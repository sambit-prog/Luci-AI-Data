import { supabase } from '../lib/supabase';

export type ServiceType = 'lead_finder' | 'email_verifier';
export type LeadFinderPlanId = 'plan_1000' | 'plan_5000' | 'plan_10000' | 'plan_25000';
export type EmailVerifierPlanId = 'ev_10k' | 'ev_25k' | 'ev_100k' | 'ev_250k' | 'ev_500k' | 'ev_1m';
export type PlanId = LeadFinderPlanId | EmailVerifierPlanId;

export interface PricingPlan {
    id: PlanId;
    credits: number;           // leads or verifications
    amount_paise: number;      // Razorpay charge amount in INR paise
    popular: boolean;
    price_display: string;     // e.g. "$15" or "₹850"
    unit_price_display: string; // e.g. "$0.015/credit" or "8.5p/email"
}

// Lead Finder plans — priced in USD (displayed), charged in INR paise via Razorpay
export const LEAD_FINDER_PLANS: PricingPlan[] = [
    { id: 'plan_1000',  credits: 1000,  amount_paise: 1250,  popular: false, price_display: '$15',  unit_price_display: '$0.015/credit' },
    { id: 'plan_5000',  credits: 5000,  amount_paise: 4580,  popular: true,  price_display: '$55',  unit_price_display: '$0.011/credit' },
    { id: 'plan_10000', credits: 10000, amount_paise: 7900,  popular: false, price_display: '$95',  unit_price_display: '$0.0095/credit' },
    { id: 'plan_25000', credits: 25000, amount_paise: 16600, popular: false, price_display: '$200', unit_price_display: '$0.008/credit' },
];

// Email Verifier plans — priced in INR
export const EMAIL_VERIFIER_PLANS: PricingPlan[] = [
    { id: 'ev_10k',  credits: 10000,   amount_paise: 85000,   popular: false, price_display: '₹850',    unit_price_display: '8.5p/email' },
    { id: 'ev_25k',  credits: 25000,   amount_paise: 175000,  popular: false, price_display: '₹1,750',  unit_price_display: '7p/email'   },
    { id: 'ev_100k', credits: 100000,  amount_paise: 450000,  popular: true,  price_display: '₹4,500',  unit_price_display: '4.5p/email' },
    { id: 'ev_250k', credits: 250000,  amount_paise: 1000000, popular: false, price_display: '₹10,000', unit_price_display: '4p/email'   },
    { id: 'ev_500k', credits: 500000,  amount_paise: 1500000, popular: false, price_display: '₹15,000', unit_price_display: '3p/email'   },
    { id: 'ev_1m',   credits: 1000000, amount_paise: 2500000, popular: false, price_display: '₹25,000', unit_price_display: '2.5p/email' },
];

export const getPlansByServiceType = (serviceType: ServiceType): PricingPlan[] =>
    serviceType === 'email_verifier' ? EMAIL_VERIFIER_PLANS : LEAD_FINDER_PLANS;

// Backward-compat alias (used in PurchaseModal test mode path)
export const PRICING_PLANS = LEAD_FINDER_PLANS;

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

// Always call getSession() before invoking edge functions to ensure a fresh,
// non-expired access token is used. The Supabase JS client's internal auth
// header is only updated on onAuthStateChange events, which can leave a stale
// token if the access token expired between events.
const getFreshAuthHeader = async (): Promise<{ Authorization: string }> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error('Session expired. Please sign in again.');
    return { Authorization: `Bearer ${session.access_token}` };
};

export const createOrder = async (
    serviceType: ServiceType,
    planId: PlanId
): Promise<CreateOrderResponse> => {
    const authHeader = await getFreshAuthHeader();
    const { data, error } = await supabase.functions.invoke('create-order', {
        body: { service_type: serviceType, plan_id: planId },
        headers: authHeader,
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
    const authHeader = await getFreshAuthHeader();
    const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        },
        headers: authHeader,
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
    const authHeader = await getFreshAuthHeader();
    const { data, error } = await supabase.functions.invoke('deduct-credits', {
        body: { service_type: serviceType, amount, description, reference_id: referenceId },
        headers: authHeader,
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
