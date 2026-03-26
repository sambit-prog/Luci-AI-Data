import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side price table — never trust client-sent amounts
const PLANS: Record<string, { credits: number; amount_paise: number }> = {
  plan_1000:  { credits: 1000,  amount_paise: 1250 },
  plan_5000:  { credits: 5000,  amount_paise: 4580 },
  plan_10000: { credits: 10000, amount_paise: 7900 },
  plan_25000: { credits: 25000, amount_paise: 16600 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Verify Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { service_type, plan_id } = await req.json();

    if (!['lead_finder', 'email_verifier'].includes(service_type)) {
      return new Response(JSON.stringify({ error: 'Invalid service_type' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const plan = PLANS[plan_id];
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Invalid plan_id' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const receipt = crypto.randomUUID();

    // Create Razorpay order
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: plan.amount_paise,
        currency: 'INR',
        receipt,
        notes: { user_id: user.id, service_type, plan_id },
      }),
    });

    if (!razorpayRes.ok) {
      const err = await razorpayRes.text();
      console.error('Razorpay error:', err);
      return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const razorpayOrder = await razorpayRes.json();

    // Persist order in DB using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabaseAdmin.from('luciAI_orders').insert({
      user_id: user.id,
      razorpay_order_id: razorpayOrder.id,
      service_type,
      credits_to_add: plan.credits,
      amount_paise: plan.amount_paise,
      currency: 'INR',
      status: 'created',
    });

    // Fetch user profile for prefill
    const { data: profile } = await supabaseAdmin
      .from('luciAI_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    return new Response(JSON.stringify({
      order_id: razorpayOrder.id,
      amount: plan.amount_paise,
      currency: 'INR',
      razorpay_key: razorpayKeyId,
      prefill: {
        name: profile?.full_name ?? '',
        email: profile?.email ?? user.email ?? '',
      },
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('create-order error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
