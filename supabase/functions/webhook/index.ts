import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

serve(async (req) => {
  try {
    // Read raw body BEFORE any parsing (HMAC is computed over raw bytes)
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const eventId = req.headers.get('x-razorpay-event-id') ?? '';

    // Verify webhook HMAC signature
    const expectedSig = createHmac('sha256', Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      console.warn('Webhook signature mismatch');
      return new Response('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Idempotency check — if we've seen this event, skip processing
    const { data: existing } = await supabaseAdmin
      .from('luciAI_webhook_events')
      .select('id')
      .eq('razorpay_event_id', eventId)
      .maybeSingle();

    if (existing) {
      return new Response('OK', { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.event;

    // Record the event (unprocessed)
    await supabaseAdmin.from('luciAI_webhook_events').insert({
      razorpay_event_id: eventId,
      event_type: eventType,
      payload,
      processed: false,
    });

    if (eventType === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      const razorpayOrderId: string = payment?.order_id;
      const razorpayPaymentId: string = payment?.id;

      if (razorpayOrderId) {
        // Only act if verify-payment hasn't already credited the user
        const { data: order } = await supabaseAdmin
          .from('luciAI_orders')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .eq('status', 'created')
          .maybeSingle();

        if (order) {
          // Same credit logic as verify-payment — safety net for abandoned checkouts
          await supabaseAdmin
            .from('luciAI_orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', order.id)
            .eq('status', 'created');

          const { data: currentBalance } = await supabaseAdmin
            .from('luciAI_credit_balances')
            .select('balance')
            .eq('user_id', order.user_id)
            .eq('service_type', order.service_type)
            .single();

          const newBalance = (currentBalance?.balance ?? 0) + order.credits_to_add;

          await supabaseAdmin
            .from('luciAI_credit_balances')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', order.user_id)
            .eq('service_type', order.service_type);

          await supabaseAdmin.from('luciAI_payment_transactions').insert({
            order_id: order.id,
            user_id: order.user_id,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: 'webhook',
            service_type: order.service_type,
            credits_added: order.credits_to_add,
            amount_paise: order.amount_paise,
            status: 'success',
          });

          await supabaseAdmin.from('luciAI_credit_usage_log').insert({
            user_id: order.user_id,
            service_type: order.service_type,
            action: 'purchase',
            credits_delta: order.credits_to_add,
            balance_after: newBalance,
            reference_id: razorpayPaymentId,
            description: `Purchased ${order.credits_to_add} credits (via webhook)`,
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      const razorpayOrderId: string = payment?.order_id;
      if (razorpayOrderId) {
        await supabaseAdmin
          .from('luciAI_orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('razorpay_order_id', razorpayOrderId)
          .eq('status', 'created');
      }
    }

    // Mark event as processed
    await supabaseAdmin
      .from('luciAI_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('razorpay_event_id', eventId);

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('webhook error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
