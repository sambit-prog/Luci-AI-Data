import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { service_type, amount, description, reference_id } = await req.json();

    if (!['lead_finder', 'email_verifier'].includes(service_type) || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: a reference_id (bulk job id) may only be deducted once.
    // Live and resume completion paths — or two open tabs — can both attempt
    // to settle the same job; the second attempt must be a no-op.
    const alreadyDeductedResponse = async () => {
      const { data: bal } = await supabaseAdmin
        .from('luciAI_credit_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('service_type', service_type)
        .single();
      return new Response(JSON.stringify({
        success: true,
        credits_deducted: 0,
        already_deducted: true,
        new_balance: bal?.balance ?? 0,
        service_type,
      }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    };

    if (reference_id) {
      const { data: existing } = await supabaseAdmin
        .from('luciAI_credit_usage_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_type', service_type)
        .eq('action', 'deduction')
        .eq('reference_id', reference_id)
        .maybeSingle();
      if (existing) {
        return await alreadyDeductedResponse();
      }
    }

    // Fetch current balance
    const { data: creditRow } = await supabaseAdmin
      .from('luciAI_credit_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('service_type', service_type)
      .single();

    const currentBalance = creditRow?.balance ?? 0;

    // Atomic guard — insufficient credits
    if (currentBalance < amount) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        current_balance: currentBalance,
        required: amount,
      }), {
        status: 402, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const newBalance = currentBalance - amount;

    // Insert the log row FIRST: the partial unique index
    // uq_luciAI_usage_dedup (user_id, service_type, reference_id) makes this
    // the atomic claim on the deduction. A 23505 conflict means another
    // request settled the same job concurrently — skip without charging.
    const { error: logError } = await supabaseAdmin.from('luciAI_credit_usage_log').insert({
      user_id: user.id,
      service_type,
      action: 'deduction',
      credits_delta: -amount,
      balance_after: newBalance,
      reference_id: reference_id ?? null,
      description: description ?? `Used ${amount} credit${amount > 1 ? 's' : ''}`,
    });

    if (logError) {
      if (logError.code === '23505') {
        return await alreadyDeductedResponse();
      }
      throw logError;
    }

    await supabaseAdmin
      .from('luciAI_credit_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('service_type', service_type);

    return new Response(JSON.stringify({
      success: true,
      credits_deducted: amount,
      new_balance: newBalance,
      service_type,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('deduct-credits error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
