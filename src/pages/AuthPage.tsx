/**
 * Authentication Page
 * Provides tabbed interface for Login and Sign Up
 */

import { useState } from 'react';
import { Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { SignUpForm } from '../components/SignUpForm';
import { BrandName } from '../config';

export const AuthPage = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Blob Backgrounds */}
            <div className="blob-orange w-96 h-96 top-20 -left-20" />
            <div className="blob-blue w-80 h-80 bottom-20 -right-20" />

            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern"></div>

            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
                    <Database className="h-10 w-10 text-brand-orange" />
                    <span className="text-2xl font-bold text-white">{BrandName}</span>
                </Link>

                {/* Auth Card - Strong Glassmorphism */}
                <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-4 text-center font-semibold transition ${activeTab === 'login'
                                ? 'text-brand-orange border-b-2 border-brand-orange bg-white/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`flex-1 py-4 text-center font-semibold transition ${activeTab === 'signup'
                                ? 'text-brand-orange border-b-2 border-brand-orange bg-white/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                        {activeTab === 'login' ? (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                                <p className="text-gray-400 mb-6">Sign in to access your account</p>
                                <LoginForm />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                                <p className="text-gray-400 mb-6">Get started with your free account</p>
                                <SignUpForm />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center mt-6 text-gray-400">
                    <Link to="/" className="text-brand-orange hover:text-white font-medium transition inline-flex items-center gap-1">
                        ← Back to Home
                    </Link>
                </p>
            </div>
        </div>
    );
};
