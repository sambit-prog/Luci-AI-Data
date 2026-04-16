/**
 * Sign Up Form Component
 * Handles user registration with client-side validation
 */

import { useState, FormEvent } from 'react';
import { Mail, Lock, User as UserIcon, AlertCircle, Check, Eye, EyeOff, Tag, Loader2 } from 'lucide-react';
import { signUp, validateReferralCode } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

export const SignUpForm = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    const navigate = useNavigate();

    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'firstName':
                if (!value.trim()) return 'First name is required';
                if (value.trim().length < 1 || value.trim().length > 50) return 'Must be 1–50 characters';
                break;
            case 'lastName':
                if (!value.trim()) return 'Last name is required';
                if (value.trim().length < 1 || value.trim().length > 50) return 'Must be 1–50 characters';
                break;
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                break;
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 6) return 'Password must be at least 6 characters';
                if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
                if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
                if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
                break;
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== password) return 'Passwords do not match';
                break;
        }
        return undefined;
    };

    const handleBlur = (field: string, value: string) => {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleReferralBlur = async () => {
        const code = referralCode.trim();
        if (!code) { setReferralStatus('idle'); return; }
        setReferralStatus('checking');
        try {
            const isValid = await validateReferralCode(code);
            setReferralStatus(isValid ? 'valid' : 'invalid');
        } catch {
            setReferralStatus('idle');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setServerError('');

        const newErrors: FormErrors = {
            firstName: validateField('firstName', firstName),
            lastName: validateField('lastName', lastName),
            email: validateField('email', email),
            password: validateField('password', password),
            confirmPassword: validateField('confirmPassword', confirmPassword),
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await signUp(firstName.trim(), lastName.trim(), email.trim(), password, referralCode.trim() || undefined);

            if (response.success) {
                navigate('/verify-email', { state: { email: email.trim() } });
            } else {
                setServerError(response.message);
            }
        } catch {
            setServerError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* First Name + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                        First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onBlur={(e) => handleBlur('firstName', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.firstName ? 'border-red-500' : 'border-white/10'}`}
                            placeholder="John"
                            aria-invalid={!!errors.firstName}
                        />
                    </div>
                    {errors.firstName && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.firstName}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
                        Last Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onBlur={(e) => handleBlur('lastName', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.lastName ? 'border-red-500' : 'border-white/10'}`}
                            placeholder="Doe"
                            aria-invalid={!!errors.lastName}
                        />
                    </div>
                    {errors.lastName && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.lastName}
                        </p>
                    )}
                </div>
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={(e) => handleBlur('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                        placeholder="[email protected]"
                        aria-invalid={!!errors.email}
                    />
                </div>
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                    </p>
                )}
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                    Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={(e) => handleBlur('password', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.password ? 'border-red-500' : 'border-white/10'}`}
                        placeholder="••••••••"
                        aria-invalid={!!errors.password}
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
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'}`}
                        placeholder="••••••••"
                        aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                    </p>
                )}
            </div>

            {/* Referral Code */}
            <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-white mb-1">
                    Referral Code <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        id="referralCode"
                        value={referralCode}
                        onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralStatus('idle'); }}
                        onBlur={handleReferralBlur}
                        placeholder="Enter code..."
                        className={`w-full pl-9 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition uppercase tracking-wider text-sm ${
                            referralStatus === 'valid'
                                ? 'border-green-500 focus:ring-green-500/30'
                                : referralStatus === 'invalid'
                                ? 'border-orange-400 focus:ring-orange-400/30'
                                : 'border-white/10 focus:ring-brand-orange focus:border-brand-orange'
                        }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {referralStatus === 'checking' && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                        {referralStatus === 'valid' && <Check className="h-4 w-4 text-green-400" />}
                        {referralStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-orange-400" />}
                    </div>
                </div>
                {referralStatus === 'valid' && (
                    <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Code applied! You'll receive bonus credits on signup.
                    </p>
                )}
                {referralStatus === 'invalid' && (
                    <p className="mt-1 text-xs text-orange-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Invalid referral code.
                    </p>
                )}
            </div>

            {/* Server Error */}
            {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{serverError}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gradient-primary text-white py-3 rounded-lg font-semibold shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                    </>
                ) : (
                    <>
                        <Check className="h-5 w-5" />
                        Create Account
                    </>
                )}
            </button>
        </form>
    );
};
