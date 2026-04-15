import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side price table — never trust client-sent amounts
const PLANS: Record<string, { credits: number; amount_paise: number }> = {
  // Lead Finder plans
  plan_1000:  { credits: 1000,  amount_paise: 1250 },
  plan_5000:  { credits: 5000,  amount_paise: 4580 },
  plan_10000: { credits: 10000, amount_paise: 7900 },
  plan_25000: { credits: 25000, amount_paise: 16600 },
  // Email Verifier plans
  ev_10k:  { credits: 10000,   amount_paise: 85000   },
  ev_25k:  { credits: 25000,   amount_paise: 175000  },
  ev_100k: { credits: 100000,  amount_paise: 450000  },
  ev_250k: { credits: 250000,  amount_paise: 1000000 },
  ev_500k: { credits: 500000,  amount_paise: 1500000 },
  ev_1m:   { credits: 1000000, amount_paise: 2500000 },
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

    const isTestMode = Deno.env.get('RAZORPAY_TEST_MODE') === 'true';
    const razorpayKeyId     = isTestMode ? Deno.env.get('RAZORPAY_TEST_KEY_ID')!     : Deno.env.get('RAZORPAY_LIVE_KEY_ID')!;
    const razorpayKeySecret = isTestMode ? Deno.env.get('RAZORPAY_TEST_KEY_SECRET')! : Deno.env.get('RAZORPAY_LIVE_KEY_SECRET')!;
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
    const { error: insertError } = await supabaseAdmin.from('luciAI_orders').insert({
      user_id: user.id,
      razorpay_order_id: razorpayOrder.id,
      service_type,
      credits_to_add: plan.credits,
      amount_paise: plan.amount_paise,
      currency: 'INR',
      status: 'created',
    });

    if (insertError) {
      console.error('DB insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save order' }), {
        status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

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
