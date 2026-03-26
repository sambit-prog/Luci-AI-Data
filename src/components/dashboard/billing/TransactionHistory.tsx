import React, { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Loader2 } from 'lucide-react';
import { getCreditHistory, CreditLogEntry, ServiceType } from '../../../services/paymentService';

interface TransactionHistoryProps {
    serviceType: ServiceType;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ serviceType }) => {
    const [entries, setEntries] = useState<CreditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        getCreditHistory(serviceType)
            .then(setEntries)
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, [serviceType]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history...
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 text-sm py-4">{error}</p>;
    }

    if (entries.length === 0) {
        return <p className="text-gray-500 text-sm py-4 text-center">No transactions yet.</p>;
    }

    return (
        <div className="space-y-2">
            {entries.map((entry) => {
                const isPositive = entry.credits_delta > 0;
                const Icon = entry.action === 'refund' ? RefreshCw : isPositive ? ArrowUpCircle : ArrowDownCircle;
                const colorClass = isPositive ? 'text-green-400' : 'text-red-400';

                return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0`} />
                            <div>
                                <p className="text-sm text-white">{entry.description ?? entry.action}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(entry.created_at).toLocaleString()} · Balance after: {entry.balance_after.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <span className={`text-sm font-semibold ${colorClass} whitespace-nowrap ml-4`}>
                            {isPositive ? '+' : ''}{entry.credits_delta.toLocaleString()}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
