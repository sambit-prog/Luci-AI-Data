import React, { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CreditBalanceCard } from './CreditBalanceCard';
import { TransactionHistory } from './TransactionHistory';
import { ServiceType } from '../../../services/paymentService';

type Tab = ServiceType;

export const BillingView: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('lead_finder');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-white">Billing & Credits</h2>
                <p className="text-gray-400 mt-1">Manage your credit balances for each service independently.</p>
            </div>

            {/* Credit balance cards */}
            <div className="grid md:grid-cols-2 gap-4">
                <CreditBalanceCard
                    serviceType="lead_finder"
                    serviceName="Lead Finder"
                    balance={user?.leadFinderCredits ?? 0}
                    icon={<Search className="w-5 h-5 text-brand-orange" />}
                    accentColor="border-brand-orange/40 text-brand-orange hover:border-brand-orange hover:bg-brand-orange/10"
                />
                <CreditBalanceCard
                    serviceType="email_verifier"
                    serviceName="Email Verifier"
                    balance={user?.emailVerifierCredits ?? 0}
                    icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                    accentColor="border-green-500/40 text-green-400 hover:border-green-500 hover:bg-green-500/10"
                />
            </div>

            {/* Transaction history */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('lead_finder')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                activeTab === 'lead_finder'
                                    ? 'bg-brand-orange text-white'
                                    : 'text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            Lead Finder
                        </button>
                        <button
                            onClick={() => setActiveTab('email_verifier')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                activeTab === 'email_verifier'
                                    ? 'bg-brand-orange text-white'
                                    : 'text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            Email Verifier
                        </button>
                    </div>
                </div>
                <TransactionHistory serviceType={activeTab} />
            </div>
        </div>
    );
};
