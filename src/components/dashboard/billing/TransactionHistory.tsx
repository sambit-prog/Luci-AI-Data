import React, { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    getCreditHistory,
    CreditLogEntry,
    ServiceType,
    TransactionFilter,
    TransactionSort,
} from '../../../services/paymentService';

interface TransactionHistoryProps {
    serviceType: ServiceType;
}

const PER_PAGE = 7;

const FILTERS: { label: string; value: TransactionFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Spent', value: 'deduction' },
    { label: 'Refund', value: 'refund' },
];

const FILTER_EMPTY_MESSAGES: Record<TransactionFilter, string> = {
    all: 'No transactions yet.',
    purchase: 'No purchase transactions yet.',
    deduction: 'No spent transactions yet.',
    refund: 'No refund transactions yet.',
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ serviceType }) => {
    const [entries, setEntries] = useState<CreditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<TransactionFilter>('all');
    const [sort, setSort] = useState<TransactionSort>('date_desc');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setPage(1);
    }, [serviceType, filter, sort]);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        getCreditHistory(serviceType, { filter, sort, page, perPage: PER_PAGE })
            .then((result) => {
                setEntries(result.entries);
                setTotal(result.total);
                setTotalPages(result.totalPages);
            })
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, [serviceType, filter, sort, page]);

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                {/* Filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f.value
                                ? 'bg-brand-orange text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Sort dropdown */}
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as TransactionSort)}
                    className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-orange/50 cursor-pointer"
                >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
            ) : error ? (
                <p className="text-red-400 text-sm py-4">{error}</p>
            ) : entries.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">{FILTER_EMPTY_MESSAGES[filter]}</p>
            ) : (
                <>
                    <div className="space-y-2">
                        {entries.map((entry) => {
                            const isPositive = entry.credits_delta > 0;
                            const isRefund = entry.action === 'refund';
                            const Icon = isRefund ? RefreshCw : isPositive ? ArrowUpCircle : ArrowDownCircle;
                            const iconColor = isRefund ? 'text-blue-400' : isPositive ? 'text-green-400' : 'text-red-400';
                            const deltaColor = isRefund ? 'text-blue-400' : isPositive ? 'text-green-400' : 'text-red-400';

                            return (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 gap-4"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                                        <div className="min-w-0">
                                            <p className="text-sm text-white truncate">
                                                {entry.description ?? entry.action}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(entry.created_at).toLocaleString()}
                                                <span className="mx-1.5">·</span>
                                                Balance after:{' '}
                                                <span className="text-gray-400">
                                                    {entry.balance_after.toLocaleString()}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-semibold ${deltaColor} whitespace-nowrap`}>
                                        {isPositive ? '+' : ''}
                                        {entry.credits_delta.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>

                            <span className="text-xs text-gray-500">
                                Page <span className="text-white font-medium">{page}</span> of{' '}
                                <span className="text-white font-medium">{totalPages}</span>
                                <span className="ml-2 text-gray-600">({total} total)</span>
                            </span>

                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
