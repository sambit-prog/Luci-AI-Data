import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Mail, RefreshCw } from 'lucide-react';
import { resendVerificationEmail } from '../services/authService';
import { BrandName } from '../config';

export const VerifyEmailPage = () => {
    const location = useLocation();
    const email: string = (location.state as { email?: string })?.email ?? '';

    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResend = async () => {
        if (!email || isResending) return;
        setIsResending(true);
        setResendMessage('');
        const result = await resendVerificationEmail(email);
        setResendSuccess(result.success);
        setResendMessage(result.message);
        setIsResending(false);
    };

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
                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/30 mx-auto mb-6">
                        <Mail className="h-8 w-8 text-brand-orange" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>

                    <p className="text-gray-400 mb-2">
                        We sent a verification link to
                    </p>
                    {email && (
                        <p className="text-white font-semibold mb-6">{email}</p>
                    )}
                    <p className="text-gray-400 text-sm mb-8">
                        Click the link in your email to activate your account. Check your spam folder if you don't see it.
                    </p>

                    {/* Resend */}
                    <div className="border-t border-white/10 pt-6">
                        <p className="text-sm text-gray-400 mb-3">Didn't receive it?</p>
                        <button
                            onClick={handleResend}
                            disabled={isResending || !email}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-white/10 rounded-lg text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Resending...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" />
                                    Resend Email
                                </>
                            )}
                        </button>

                        {resendMessage && (
                            <p className={`mt-3 text-sm ${resendSuccess ? 'text-green-400' : 'text-red-400'}`}>
                                {resendMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-gray-400">
                    <Link to="/auth" className="text-brand-orange hover:text-white font-medium transition inline-flex items-center gap-1">
                        ← Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};
