/**
 * Dashboard Page
 * Protected page for authenticated users
 */

import { Database, LogOut, User, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandName } from '../config';

export const Dashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navigation Bar - Glassmorphism */}
            <nav className="glass backdrop-blur-lg sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <Database className="h-8 w-8 text-brand-orange" />
                            <span className="text-xl font-bold text-white">{BrandName}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 border-2 border-brand-orange text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section - Orange Gradient */}
                <div className="btn-gradient-primary rounded-2xl p-8 mb-8 text-white shadow-lg shadow-brand-orange/20">
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.fullName}! 👋</h1>
                    <p className="text-white/90">
                        You're successfully logged in to your {BrandName} account
                    </p>
                </div>

                {/* User Info Card - Dark Glass */}
                <div className="glass-dark rounded-2xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                            <User className="h-5 w-5 text-brand-orange" />
                            <div>
                                <p className="text-sm text-gray-400">Full Name</p>
                                <p className="font-semibold text-white">{user?.fullName}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                            <Mail className="h-5 w-5 text-brand-orange" />
                            <div>
                                <p className="text-sm text-gray-400">Email Address</p>
                                <p className="font-semibold text-white">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                            <Calendar className="h-5 w-5 text-brand-orange" />
                            <div>
                                <p className="text-sm text-gray-400">Member Since</p>
                                <p className="font-semibold text-white">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-dark rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Link
                            to="/"
                            className="p-4 border-2 border-white/10 rounded-lg hover:border-brand-orange hover:bg-white/5 transition group"
                        >
                            <h3 className="font-semibold text-white group-hover:text-brand-orange mb-1">
                                Browse Services
                            </h3>
                            <p className="text-sm text-gray-400">
                                Explore our lead export services
                            </p>
                        </Link>

                        <button className="p-4 border-2 border-white/10 rounded-lg hover:border-brand-orange hover:bg-white/5 transition group text-left">
                            <h3 className="font-semibold text-white group-hover:text-brand-orange mb-1">
                                Export Leads
                            </h3>
                            <p className="text-sm text-gray-400">
                                Start a new lead export project
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
