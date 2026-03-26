// ============================================================
// DEMO MODE — Supabase auth is commented out.
// Any email + password combination will work.
// To restore real auth, uncomment the Supabase sections below
// and comment out the DEMO sections.
// ============================================================

// import { supabase } from '../lib/supabase';

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

// ---------- DEMO helpers ----------

const DEMO_SESSION_KEY = 'demo_user';

const makeDemoUser = (fullName: string, email: string): User => ({
    id: 'demo-' + btoa(email).slice(0, 8),
    email,
    fullName,
    createdAt: new Date().toISOString(),
    leadFinderCredits: 10,
    emailVerifierCredits: 100,
});

// ---------- Auth functions ----------

export const signUp = async (
    fullName: string,
    email: string,
    _password: string
): Promise<AuthResponse> => {
    // DEMO MODE — accepts any credentials
    const user = makeDemoUser(fullName, email);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return { success: true, message: 'Account created successfully!', user, token: 'demo-token' };

    // --- SUPABASE VERSION (commented out) ---
    // const { data, error } = await supabase.auth.signUp({
    //     email,
    //     password,
    //     options: { data: { full_name: fullName } },
    // });
    // if (error) return { success: false, message: error.message };
    // if (!data.user) return { success: false, message: 'Sign up failed. Please try again.' };
    // const { data: credits } = await supabase
    //     .from('luciAI_credit_balances')
    //     .select('service_type, balance')
    //     .eq('user_id', data.user.id);
    // const user = buildUser(data.user.id, data.user.email!, fullName, data.user.created_at, credits ?? []);
    // return { success: true, message: 'Account created successfully!', user };
};

export const login = async (
    email: string,
    _password: string
): Promise<AuthResponse> => {
    // DEMO MODE — accepts any credentials
    const stored = localStorage.getItem(DEMO_SESSION_KEY);
    const existing: User | null = stored ? JSON.parse(stored) : null;
    const user = (existing?.email === email) ? existing : makeDemoUser(email.split('@')[0], email);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return { success: true, message: 'Login successful!', user, token: 'demo-token' };

    // --- SUPABASE VERSION (commented out) ---
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) return { success: false, message: 'Invalid email or password' };
    // if (!data.user) return { success: false, message: 'Login failed. Please try again.' };
    // const { data: credits } = await supabase
    //     .from('luciAI_credit_balances')
    //     .select('service_type, balance')
    //     .eq('user_id', data.user.id);
    // const user = buildUser(data.user.id, data.user.email!, data.user.user_metadata?.full_name ?? '', data.user.created_at, credits ?? []);
    // return { success: true, message: 'Login successful!', user, token: data.session?.access_token };
};

export const logout = async (): Promise<void> => {
    // DEMO MODE
    localStorage.removeItem(DEMO_SESSION_KEY);

    // --- SUPABASE VERSION (commented out) ---
    // await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
    // DEMO MODE
    const stored = localStorage.getItem(DEMO_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;

    // --- SUPABASE VERSION (commented out) ---
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return null;
    // const { data: credits } = await supabase
    //     .from('luciAI_credit_balances')
    //     .select('service_type, balance')
    //     .eq('user_id', user.id);
    // return buildUser(user.id, user.email!, user.user_metadata?.full_name ?? '', user.created_at, credits ?? []);
};

// No-op in demo mode
export const saveSession = (_user: User, _token: string): void => {};
