/**
 * Dashboard Page
 * Protected page for authenticated users
 */

import { useState } from 'react';
import { Database, LogOut, User, Mail, Calendar, Search, CheckCircle2, Home, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandName } from '../config';

// Import our new modular components
import { LeadFinder } from '../components/dashboard/LeadFinder';
import { EmailVerifier } from '../components/dashboard/EmailVerifier';
import { BillingView } from '../components/dashboard/billing/BillingView';

type DashboardView = 'home' | 'lead-finder' | 'email-verifier' | 'billing';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // Check for query params to set initial view
    const [activeView, setActiveView] = useState<DashboardView>(() => {
        const params = new URLSearchParams(location.search);
        const view = params.get('view') as DashboardView;
        return ['home', 'lead-finder', 'email-verifier', 'billing'].includes(view) ? view : 'home';
    });

    const handleLogout = () => {
        logout();
    };

    // Helper for rendering the Home View
    const renderHomeView = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section - Orange Gradient */}
            <div className="btn-gradient-primary rounded-2xl p-8 text-white shadow-lg shadow-brand-orange/20">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}! 👋</h1>
                <p className="text-white/90">
                    Your {BrandName} workspace is ready. Select a tool from the menu to get started.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="glass-dark rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => setActiveView('lead-finder')}
                        className="p-6 border-2 border-white/10 rounded-xl hover:border-brand-orange hover:bg-white/5 transition group text-left flex items-start gap-4"
                    >
                        <div className="bg-brand-orange/20 p-3 rounded-lg group-hover:bg-brand-orange transition-colors">
                            <Search className="w-6 h-6 text-brand-orange group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-brand-orange mb-1">
                                Find Leads
                            </h3>
                            <p className="text-sm text-gray-400">
                                Discover high-quality B2B contacts.
                            </p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveView('email-verifier')}
                        className="p-6 border-2 border-white/10 rounded-xl hover:border-brand-orange hover:bg-white/5 transition group text-left flex items-start gap-4"
                    >
                         <div className="bg-brand-orange/20 p-3 rounded-lg group-hover:bg-brand-orange transition-colors">
                            <CheckCircle2 className="w-6 h-6 text-brand-orange group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-brand-orange mb-1">
                                Verify Emails
                            </h3>
                            <p className="text-sm text-gray-400">
                                Clean your lists and boost deliverability.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* User Info Card - Dark Glass */}
            <div className="glass-dark rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Name</p>
                            <p className="font-medium text-white">{user?.fullName}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div className="overflow-hidden">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Email</p>
                            <p className="font-medium text-white truncate text-sm" title={user?.email}>{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Joined</p>
                            <p className="font-medium text-white text-sm">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col text-gray-100">
            {/* Navigation Bar - Glassmorphism */}
            <nav className="glass backdrop-blur-lg sticky top-0 z-50 shadow-lg border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <Database className="h-8 w-8 text-brand-orange" />
                            <span className="text-xl font-bold text-white tracking-tight">{BrandName}</span>
                        </Link>
                        
                        <div className="flex items-center space-x-6">
                            {/* Credits Display */}
                            <div className="hidden md:flex items-center space-x-4 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                                <div className="flex items-center space-x-2">
                                    <Search className="w-4 h-4 text-brand-orange/80" />
                                    <span className="text-sm font-medium text-white">{user?.leadFinderCredits || 0}</span>
                                </div>
                                <div className="w-px h-4 bg-white/20"></div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400/80" />
                                    <span className="text-sm font-medium text-white">{user?.emailVerifierCredits || 0}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:border-brand-orange hover:text-brand-orange transition font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Layout */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex items-start gap-8">
                
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-shrink-0 space-y-1">
                    <div className="md:hidden flex space-x-2 overflow-x-auto pb-4 mb-4">
                         {/* Mobile Top Navigation layout alternative */}
                         <button
                            onClick={() => setActiveView('home')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeView === 'home' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <Home className="w-4 h-4" /> Home
                        </button>
                        <button
                            onClick={() => setActiveView('lead-finder')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeView === 'lead-finder' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <Search className="w-4 h-4" /> Luci Radar
                        </button>
                        <button
                            onClick={() => setActiveView('email-verifier')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeView === 'email-verifier' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <CheckCircle2 className="w-4 h-4" /> Luci Verifier
                        </button>
                        <button
                            onClick={() => setActiveView('billing')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${activeView === 'billing' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            <CreditCard className="w-4 h-4" /> Billing
                        </button>
                    </div>

                    <div className="hidden md:block">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-3">
                            Overview
                        </div>
                        <button
                            onClick={() => setActiveView('home')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors mb-2 ${
                                activeView === 'home' 
                                    ? 'bg-brand-orange/10 text-brand-orange font-medium' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Home className="w-5 h-5" /> Dashboard
                        </button>

                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4 px-3">
                            Tools
                        </div>
                        <button
                            onClick={() => setActiveView('lead-finder')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors mb-2 ${
                                activeView === 'lead-finder' 
                                    ? 'bg-brand-orange/10 text-brand-orange font-medium' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Search className="w-5 h-5" /> Luci Radar
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setActiveView('email-verifier')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors mb-2 ${
                                activeView === 'email-verifier'
                                    ? 'bg-brand-orange/10 text-brand-orange font-medium'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" /> Luci Verifier
                            </div>
                        </button>

                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4 px-3">
                            Account
                        </div>
                        <button
                            onClick={() => setActiveView('billing')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                                activeView === 'billing'
                                    ? 'bg-brand-orange/10 text-brand-orange font-medium'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <CreditCard className="w-5 h-5" /> Billing
                        </button>

                        {/* Mobile Credit display shown in sidebar when on wider screens */}
                        <div className="mt-8 glass-dark p-4 rounded-xl border border-white/5 md:hidden lg:block">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                                <CreditCard className="w-4 h-4 text-brand-orange" /> My Credits
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Search</span>
                                        <span className="text-white font-medium">{user?.leadFinderCredits || 0}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                                        <div className="bg-brand-orange h-1.5 rounded-full" style={{ width: '10%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Verifications</span>
                                        <span className="text-white font-medium">{user?.emailVerifierCredits || 0}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full min-w-0">
                    {activeView === 'home' && renderHomeView()}
                    {activeView === 'lead-finder' && <LeadFinder />}
                    {activeView === 'email-verifier' && <EmailVerifier />}
                    {activeView === 'billing' && <BillingView />}
                </main>

            </div>
        </div>
    );
};
