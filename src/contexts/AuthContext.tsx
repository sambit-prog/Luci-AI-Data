import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser, logout as logoutService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateCredits: (leadFinderCredits: number, emailVerifierCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session on mount
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            }
            setIsLoading(false);
        });

        // Stay in sync with Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = (user: User, _token: string) => {
        setUser(user);
    };

    const logout = async () => {
        await logoutService();
        setUser(null);
    };

    const updateCredits = (leadFinderCredits: number, emailVerifierCredits: number) => {
        setUser(prev => prev ? { ...prev, leadFinderCredits, emailVerifierCredits } : prev);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateCredits,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
