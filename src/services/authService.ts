import { data } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

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

const buildUser = (
    id: string,
    email: string,
    fullName: string,
    createdAt: string,
): User => ({
    id,
    email,
    fullName,
    createdAt,
    leadFinderCredits: 0,
    emailVerifierCredits: 0,
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

const REMEMBER_ME_KEY = 'luci_remember_me';

export const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
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

    // Store remember-me marker in the correct storage:
    // true  → localStorage   (persists across browser close)
    // false → sessionStorage (cleared when browser/tab closes)
    if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        sessionStorage.removeItem(REMEMBER_ME_KEY);
    } else {
        sessionStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.removeItem(REMEMBER_ME_KEY);
    }

    const user = buildUser(
        data.user.id,
        data.user.email!,
        data.user.user_metadata?.full_name ?? '',
        data.user.created_at,
    );

    return { success: true, message: 'Login successful!', user, token: data.session.access_token };
};

export const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(REMEMBER_ME_KEY);
};

export const getCurrentUser = async (sessionOverride?: Session): Promise<User | null> => {
    const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
    console.log(session)
    if (!session) return null;

    return buildUser(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.full_name ?? '',
        session.user.created_at,
    );
};

export const resendVerificationEmail = async (email: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Verification email sent! Check your inbox.' };
};

export const requestPasswordReset = async (email: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password reset email sent! Check your inbox.' };
};

export const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password updated successfully!' };
};

// No-op — kept for compatibility
export const saveSession = (_user: User, _token: string): void => { };