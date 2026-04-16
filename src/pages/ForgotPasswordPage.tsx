import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Database, Mail, AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';
import { BrandName } from '../config';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const validateEmail = (value: string): string => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const error = validateEmail(email);
        if (error) {
            setEmailError(error);
            return;
        }

        setIsSubmitting(true);
        setServerError('');

        const result = await requestPasswordReset(email.trim());

        if (result.success) {
            setSubmitted(true);
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

                {/* Card */}
                <div className="glass-strong rounded-2xl shadow-2xl p-8">
                    {!submitted ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/30 mx-auto mb-4">
                                    <Mail className="h-8 w-8 text-brand-orange" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                                <p className="text-gray-400 text-sm">
                                    Enter your email and we'll send you a link to reset your password.
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-white mb-1">
                                        Email Address <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            id="reset-email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                            onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${emailError ? 'border-red-500' : 'border-white/10'}`}
                                            placeholder="[email protected]"
                                            aria-invalid={!!emailError}
                                        />
                                    </div>
                                    {emailError && (
                                        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {emailError}
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
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto mb-6">
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
                            <p className="text-gray-400 mb-2 text-sm">We sent a password reset link to</p>
                            <p className="text-white font-semibold mb-6">{email}</p>
                            <p className="text-gray-400 text-sm mb-8">
                                Click the link in the email to reset your password. Check your spam folder if you don't see it.
                            </p>
                            <button
                                onClick={() => { setSubmitted(false); setEmail(''); }}
                                className="text-sm text-brand-orange hover:underline"
                            >
                                Use a different email
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center mt-6">
                    <Link to="/auth" className="text-brand-orange hover:text-white font-medium transition inline-flex items-center gap-1 text-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};
