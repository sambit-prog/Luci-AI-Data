import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BrandName } from '../config';

type Status = 'loading' | 'success' | 'error';

export const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Supabase JS v2 automatically processes the #access_token hash on client init.
        // We just need to check if a session was established.
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                setErrorMessage(error.message);
                setStatus('error');
                return;
            }

            if (session) {
                sessionStorage.setItem('luci_remember_me', 'true');
                setStatus('success');
                setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
                return;
            }

            // Session not yet ready — listen for auth state change
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    subscription.unsubscribe();
                    clearTimeout(timer);
                    sessionStorage.setItem('luci_remember_me', 'true');
                    setStatus('success');
                    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
                }
            });

            // Timeout fallback for expired or invalid links
            const timer = setTimeout(() => {
                subscription.unsubscribe();
                setErrorMessage('The verification link has expired or is invalid. Please request a new one.');
                setStatus('error');
            }, 5000);

            return () => {
                clearTimeout(timer);
                subscription.unsubscribe();
            };
        });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Blob Backgrounds */}
            <div className="blob-orange w-96 h-96 top-20 -left-20" />
            <div className="blob-blue w-80 h-80 bottom-20 -right-20" />

            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern"></div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
                    <Database className="h-10 w-10 text-brand-orange" />
                    <span className="text-2xl font-bold text-white">{BrandName}</span>
                </Link>

                {/* Card */}
                <div className="glass-strong rounded-2xl shadow-2xl p-8 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verifying your email...</h2>
                            <p className="text-gray-400">Please wait a moment.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto mb-6">
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                            <p className="text-gray-400">Redirecting you to your dashboard...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-6">
                                <AlertCircle className="h-8 w-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                            <p className="text-gray-400 mb-6 text-sm">{errorMessage}</p>
                            <div className="space-y-3">
                                <Link
                                    to="/verify-email"
                                    className="block w-full py-2.5 px-4 btn-gradient-primary text-white rounded-lg font-semibold text-center"
                                >
                                    Resend Verification Email
                                </Link>
                                <Link
                                    to="/auth"
                                    className="block w-full py-2.5 px-4 border border-white/10 text-white rounded-lg hover:bg-white/5 transition text-center"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
