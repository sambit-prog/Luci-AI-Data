/**
 * Login Form Component
 * Handles user authentication with validation
 */

import { useState, FormEvent } from 'react';
import { Mail, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { login as loginService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FormErrors {
    email?: string;
    password?: string;
}

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const { login: loginUser } = useAuth();
    const navigate = useNavigate();

    // Validation
    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'email':
                if (!value.trim()) return 'Email is required';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Please enter a valid email address';
                break;
            case 'password':
                if (!value) return 'Password is required';
                break;
        }
        return undefined;
    };

    const handleBlur = (field: string, value: string) => {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setServerError('');

        // Validate all fields
        const newErrors: FormErrors = {
            email: validateField('email', email),
            password: validateField('password', password),
        };

        setErrors(newErrors);

        // Check if there are any errors
        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await loginService(email.trim(), password, rememberMe);

            if (response.success && response.user && response.token) {
                loginUser(response.user, response.token);
                navigate('/dashboard');
            } else {
                setServerError(response.message);
            }
        } catch (error) {
            setServerError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-white mb-1">
                    Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={(e) => handleBlur('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.email ? 'border-red-500' : 'border-white/10'
                            }`}
                        placeholder="[email protected]"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                    />
                </div>
                {errors.email && (
                    <p id="login-email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                    </p>
                )}
            </div>

            {/* Password */}
            <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-white mb-1">
                    Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={(e) => handleBlur('password', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition ${errors.password ? 'border-red-500' : 'border-white/10'
                            }`}
                        placeholder="••••••••"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'login-password-error' : undefined}
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
                    <p id="login-password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-brand-orange cursor-pointer"
                        />
                        <span className="text-sm text-gray-400">Remember me</span>
                    </label>
                    <button
                        type="button"
                        className="text-sm text-brand-orange hover:underline"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Forgot password?
                    </button>
                </div>
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
                        Signing In...
                    </>
                ) : (
                    <>
                        <LogIn className="h-5 w-5" />
                        Sign In
                    </>
                )}
            </button>
        </form>
    );
};
