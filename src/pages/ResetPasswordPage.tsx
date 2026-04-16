import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updatePassword } from '../services/authService';
import { BrandName } from '../config';

type PageState = 'waiting' | 'ready' | 'success' | 'error';

export const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [pageState, setPageState] = useState<PageState>('waiting');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [linkError, setLinkError] = useState('');

    useEffect(() => {
        // Supabase fires PASSWORD_RECOVERY when user arrives via the reset link
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setPageState('ready');
            }
        });

        // Also check if session already exists (e.g. page refresh after recovery link click)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setPageState('ready');
        });

        const timer = setTimeout(() => {
            setPageState(prev => {
                if (prev === 'waiting') {
                    setLinkError('This link has expired or is invalid. Please request a new one.');
                    return 'error';
                }
                return prev;
            });
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const validateFields = () => {
        const newErrors: { password?: string; confirm?: string } = {};
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (!confirmPassword) {
            newErrors.confirm = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirm = 'Passwords do not match';
        }
        return newErrors;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setServerError('');

        const newErrors = validateFields();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);
        const result = await updatePassword(password);

        if (result.success) {
            setPageState('success');
            await supabase.auth.signOut();
            setTimeout(() => navigate('/auth', { replace: true }), 2500);
        } else {
            setServerError(result.message);
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Blob Backgrounds */}
            <div className="blob-orange w-96 h-96 top-20 -left-20" />
            <div className="blob-blue w-80 h-80 bottom-20 -right-20" />

            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
                    <Database className="h-10 w-10 text-brand-orange" />
                    <span className="text-2xl font-bold text-white">{BrandName}</span>
                </Link>

                <div className="glass-strong rounded-2xl shadow-2xl p-8">
                    {/* Waiting for recovery token */}
                    {pageState === 'waiting' && (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verifying link...</h2>
                            <p className="text-gray-400">Please wait a moment.</p>
                        </div>
                    )}

                    {/* Invalid / expired link */}
                    {pageState === 'error' && (
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-6">
                                <AlertCircle className="h-8 w-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Link Invalid</h2>
                            <p className="text-gray-400 text-sm mb-8">{linkError}</p>
                            <Link
                                to="/forgot-password"
                                className="block w-full py-2.5 px-4 btn-gradient-primary text-white rounded-lg font-semibold text-center"
                            >
                                Request New Link
                            </Link>
                        </div>
                    )}

                    {/* New password form */}
                    {pageState === 'ready' && (
                        <>
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/30 mx-auto mb-4">
                                    <Lock className="h-8 w-8 text-brand-orange" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                                <p className="text-gray-400 text-sm">Choose a strong password for your account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                {/* New Password */}
                                <div>
                                    <label htmlFor="new-password" className="block text-sm font-medium text-white mb-1">
                                        New Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="new-password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                                            className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.password ? 'border-red-500' : 'border-white/10'}`}
                                            placeholder="Min. 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-medium text-white mb-1">
                                        Confirm Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            id="confirm-password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirm: undefined })); }}
                                            className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.confirm ? 'border-red-500' : 'border-white/10'}`}
                                            placeholder="Repeat your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.confirm && (
                                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.confirm}
                                        </p>
                                    )}
                                </div>

                                {serverError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{serverError}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full btn-gradient-primary text-white py-3 rounded-lg font-semibold shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-5 w-5" />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Success */}
                    {pageState === 'success' && (
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto mb-6">
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
                            <p className="text-gray-400 text-sm">Redirecting you to login...</p>
                        </div>
                    )}
                </div>

                {(pageState === 'ready' || pageState === 'error') && (
                    <p className="text-center mt-6">
                        <Link to="/auth" className="text-brand-orange hover:text-white font-medium transition text-sm">
                            ← Back to Login
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};
