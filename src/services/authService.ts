import { supabase } from '../lib/supabase';

export interface User {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
    leadFinderCredits: number;
    emailVerifierCredits: number;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
    token?: string;
}

interface CreditRow {
    service_type: string;
    balance: number;
}

const buildUser = (
    id: string,
    email: string,
    fullName: string,
    createdAt: string,
    credits: CreditRow[]
): User => ({
    id,
    email,
    fullName,
    createdAt,
    leadFinderCredits: credits.find(c => c.service_type === 'lead_finder')?.balance ?? 0,
    emailVerifierCredits: credits.find(c => c.service_type === 'email_verifier')?.balance ?? 0,
});

export const signUp = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
): Promise<AuthResponse> => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: `${firstName} ${lastName}` },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
            return { success: false, message: 'An account with this email already exists. Try logging in instead.' };
        }
        return { success: false, message: error.message };
    }

    return { success: true, message: 'Check your email to verify your account.' };
};

export const login = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
            return { success: false, message: 'Please verify your email before logging in.' };
        }
        return { success: false, message: 'Invalid email or password.' };
    }

    if (!data.user || !data.session) {
        return { success: false, message: 'Login failed. Please try again.' };
    }

    const { data: credits } = await supabase
        .from('luciAI_credit_balances')
        .select('service_type, balance')
        .eq('user_id', data.user.id);

    const user = buildUser(
        data.user.id,
        data.user.email!,
        data.user.user_metadata?.full_name ?? '',
        data.user.created_at,
        (credits as CreditRow[]) ?? []
    );

    return { success: true, message: 'Login successful!', user, token: data.session.access_token };
};

export const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: credits } = await supabase
        .from('luciAI_credit_balances')
        .select('service_type, balance')
        .eq('user_id', session.user.id);

    return buildUser(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.full_name ?? '',
        session.user.created_at,
        (credits as CreditRow[]) ?? []
    );
};

export const resendVerificationEmail = async (email: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Verification email sent! Check your inbox.' };
};

// No-op — kept for compatibility
export const saveSession = (_user: User, _token: string): void => { };
