import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify HMAC signature
    const isTestMode = Deno.env.get('RAZORPAY_TEST_MODE') === 'true';
    const razorpayKeySecret = isTestMode ? Deno.env.get('RAZORPAY_TEST_KEY_SECRET')! : Deno.env.get('RAZORPAY_LIVE_KEY_SECRET')!;
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order — verify it belongs to this user and is still 'created'
    const { data: order, error: orderError } = await supabaseAdmin
      .from('luciAI_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .eq('status', 'created')
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found or already processed' }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Mark order paid (idempotency: AND status = 'created' prevents re-processing)
    await supabaseAdmin
      .from('luciAI_orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'created');

    // Increment credit balance
    const { data: currentBalance } = await supabaseAdmin
      .from('luciAI_credit_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('service_type', order.service_type)
      .single();

    const newBalance = (currentBalance?.balance ?? 0) + order.credits_to_add;

    await supabaseAdmin
      .from('luciAI_credit_balances')
      .upsert(
        { user_id: user.id, service_type: order.service_type, balance: newBalance, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,service_type' }
      );

    // Record transaction
    await supabaseAdmin.from('luciAI_payment_transactions').insert({
      order_id: order.id,
      user_id: user.id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      service_type: order.service_type,
      credits_added: order.credits_to_add,
      amount_paise: order.amount_paise,
      status: 'success',
    });

    // Audit log
    await supabaseAdmin.from('luciAI_credit_usage_log').insert({
      user_id: user.id,
      service_type: order.service_type,
      action: 'purchase',
      credits_delta: order.credits_to_add,
      balance_after: newBalance,
      reference_id: razorpay_payment_id,
      description: `Purchased ${order.credits_to_add} credits`,
    });

    return new Response(JSON.stringify({
      success: true,
      credits_added: order.credits_to_add,
      new_balance: newBalance,
      service_type: order.service_type,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('verify-payment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
