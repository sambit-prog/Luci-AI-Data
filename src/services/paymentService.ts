import { supabase } from '../lib/supabase';

export type ServiceType = 'lead_finder' | 'email_verifier';
export type PlanId = 'plan_1000' | 'plan_5000' | 'plan_10000' | 'plan_25000';

export interface PricingPlan {
    id: PlanId;
    credits: number;
    price_usd: number;
    amount_paise: number;
    popular: boolean;
}

// Single source of truth for pricing — used by both UI and edge functions
export const PRICING_PLANS: PricingPlan[] = [
    { id: 'plan_1000',  credits: 1000,  price_usd: 15,  amount_paise: 1250,  popular: false },
    { id: 'plan_5000',  credits: 5000,  price_usd: 55,  amount_paise: 4580,  popular: true  },
    { id: 'plan_10000', credits: 10000, price_usd: 95,  amount_paise: 7900,  popular: false },
    { id: 'plan_25000', credits: 25000, price_usd: 200, amount_paise: 16600, popular: false },
];

export interface CreateOrderResponse {
    order_id: string;
    amount: number;
    currency: string;
    razorpay_key: string;
    prefill: { name: string; email: string };
}

export interface VerifyPaymentResponse {
    success: boolean;
    credits_added: number;
    new_balance: number;
    service_type: ServiceType;
}

export interface CreditLogEntry {
    id: string;
    action: 'purchase' | 'deduction' | 'refund';
    credits_delta: number;
    balance_after: number;
    description: string | null;
    created_at: string;
}

export interface DeductCreditsResponse {
    success: boolean;
    credits_deducted: number;
    new_balance: number;
    service_type: ServiceType;
}

export const createOrder = async (
    serviceType: ServiceType,
    planId: PlanId
): Promise<CreateOrderResponse> => {
    const { data, error } = await supabase.functions.invoke('create-order', {
        body: { service_type: serviceType, plan_id: planId },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data as CreateOrderResponse;
};

export const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): Promise<VerifyPaymentResponse> => {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data as VerifyPaymentResponse;
};

export const deductCredits = async (
    serviceType: ServiceType,
    amount: number,
    description?: string,
    referenceId?: string
): Promise<DeductCreditsResponse> => {
    const { data, error } = await supabase.functions.invoke('deduct-credits', {
        body: { service_type: serviceType, amount, description, reference_id: referenceId },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data as DeductCreditsResponse;
};

export const getCreditHistory = async (serviceType: ServiceType): Promise<CreditLogEntry[]> => {
    const { data, error } = await supabase
        .from('luciAI_credit_usage_log')
        .select('id, action, credits_delta, balance_after, description, created_at')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return (data ?? []) as CreditLogEntry[];
};
