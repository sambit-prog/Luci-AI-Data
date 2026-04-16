import React, { useState, useRef, useEffect } from 'react';
import { Mail, Upload, CheckCircle2, XCircle, AlertCircle, Download, FileText, Loader2, ShoppingCart, StopCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deductCredits } from '../../services/paymentService';
import {
    getOrCreateSession,
    verifySingleEmail,
    uploadCsv,
    pollUntilComplete,
    cancelJob,
    getStats,
    getProgress,
    downloadResults as downloadResultsFromApi,
    fetchCategoryEmails,
    ResultsNotReadyError,
    saveActiveJob,
    getActiveJob,
    clearActiveJob,
    type SingleVerifyResponse,
    type EmailResult,
    type ProgressResponse,
    type StatsResponse,
    type DownloadType,
} from '../../services/emailVerifierService';

type VerificationStatus = 'valid' | 'invalid' | 'risky' | 'catch_all' | 'unknown';

interface BulkResult {
    email: string;
    status: VerificationStatus;
}

const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
        case 'valid':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                </span>
            );
        case 'invalid':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" /> Invalid
                </span>
            );
        case 'risky':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <AlertCircle className="w-3 h-3 mr-1" /> Risky
                </span>
            );
        case 'catch_all':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <AlertCircle className="w-3 h-3 mr-1" /> Catch-All
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                    <AlertCircle className="w-3 h-3 mr-1" /> Unknown
                </span>
            );
    }
};

export const EmailVerifier: React.FC = () => {
    const { user, updateCredits } = useAuth();
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('bulk');
    const [creditError, setCreditError] = useState<string | null>(null);

    // Single Email State
    const [singleEmail, setSingleEmail] = useState('');
    const [singleResult, setSingleResult] = useState<SingleVerifyResponse | null>(null);
    const [isVerifyingSingle, setIsVerifyingSingle] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const LOADING_STEPS = [
        'Checking email syntax...',
        'Looking up MX records...',
        'Testing deliverability...',
        'Almost there...',
    ];

    useEffect(() => {
        if (!isVerifyingSingle) { setLoadingStep(0); return; }
        const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length), 1200);
        return () => clearInterval(interval);
    }, [isVerifyingSingle]);

    // Bulk Email State
    const [file, setFile] = useState<File | null>(null);
    const [isVerifyingBulk, setIsVerifyingBulk] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [totalEmails, setTotalEmails] = useState(0);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [showDownloadPanel, setShowDownloadPanel] = useState(false);
    const [selectedDownloadType, setSelectedDownloadType] = useState<DownloadType>('all');
    const [isDownloading, setIsDownloading] = useState(false);
    const [jobStats, setJobStats] = useState<StatsResponse | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [progressMeta, setProgressMeta] = useState({ total: 0, completed_emails: 0, total_batches: 0, completed_batches: 0 });
    const [expandedCategory, setExpandedCategory] = useState<'valid' | 'invalid' | 'risky' | 'catch_all' | null>(null);
    const [categoryEmails, setCategoryEmails] = useState<string[]>([]);
    const [isFetchingCategory, setIsFetchingCategory] = useState(false);
    const [lastLog, setLastLog] = useState<string>('');
    const [logKey, setLogKey] = useState(0); // incremented on each new log to trigger animation
    const [isCancelling, setIsCancelling] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Resume active job on mount (survives page refresh) ──────────────────

    useEffect(() => {
        if (!user) return;
        const activeJob = getActiveJob(user.id);
        if (!activeJob) return;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Check current server status before resuming poll
        getProgress(activeJob.job_id, user.id)
            .then((data) => {
                if (data.status === 'completed' || data.status === 'failed') {
                    // Job already finished while we were away
                    clearActiveJob(user.id);
                    setCurrentJobId(activeJob.job_id);
                    setTotalEmails(activeJob.total);
                    setBulkProgress(data.percent);
                    setProgressMeta({
                        total: data.total,
                        completed_emails: data.completed_emails,
                        total_batches: data.total_batches,
                        completed_batches: data.completed_batches,
                    });
                    const results = (data.results ?? []).map((r: EmailResult) => ({
                        email: r.email,
                        status: r.status,
                    }));
                    setBulkResults(results);
                    setShowDownloadPanel(true);
                    // Fetch stats for the completed job
                    getStats(activeJob.job_id, user.id).then(setJobStats).catch(() => {});
                } else {
                    // Still running — restore state and resume polling
                    setCurrentJobId(activeJob.job_id);
                    setTotalEmails(activeJob.total);
                    setIsVerifyingBulk(true);
                    setBulkProgress(data.percent);
                    setProgressMeta({
                        total: data.total,
                        completed_emails: data.completed_emails,
                        total_batches: data.total_batches,
                        completed_batches: data.completed_batches,
                    });

                    pollUntilComplete(activeJob.job_id, (progress) => {
                        setBulkProgress(progress.percent);
                        setProgressMeta({
                            total: progress.total,
                            completed_emails: progress.completed_emails,
                            total_batches: progress.total_batches,
                            completed_batches: progress.completed_batches,
                        });
                        if (progress.last_log) {
                            setLastLog(progress.last_log);
                            setLogKey(k => k + 1);
                        }
                    }, controller.signal, user.id)
                        .then((finalData) => {
                            clearActiveJob(user.id);
                            if (finalData.status === 'cancelled') {
                                setShowDownloadPanel(true);
                                return;
                            }
                            const results = (finalData.results ?? []).map((r: EmailResult) => ({
                                email: r.email,
                                status: r.status,
                            }));
                            setBulkResults(results);
                            setBulkProgress(100);
                            setShowDownloadPanel(true);
                            getStats(activeJob.job_id, user.id).then(setJobStats).catch(() => {});
                        })
                        .catch((err) => {
                            if (err instanceof DOMException && err.name === 'AbortError') {
                                setShowDownloadPanel(true);
                            } else {
                                clearActiveJob(user.id);
                                setBulkError('Verification failed after resuming. Please try again.');
                            }
                        })
                        .finally(() => {
                            abortControllerRef.current = null;
                            setIsVerifyingBulk(false);
                            setIsCancelling(false);
                        });
                }
            })
            .catch(() => {
                // Job not found or expired — clear stale entry silently
                clearActiveJob(user.id);
            });
    }, []);

    // ─── Single verification ──────────────────────────────────────────────────

    const handleSingleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleEmail) return;

        if ((user?.emailVerifierCredits ?? 0) <= 0) {
            setCreditError('You have no Luci Verifier credits. Please buy more to continue.');
            return;
        }

        setCreditError(null);
        setIsVerifyingSingle(true);
        setSingleResult(null);

        try {
            const { session_token } = await getOrCreateSession(user!.id);
            const result = await verifySingleEmail(singleEmail, session_token);
            setSingleResult(result);

            // Deduct 1 credit after successful verification
            const isTestMode = import.meta.env.VITE_TEST_PAYMENT_MODE === 'true';
            if (isTestMode) {
                updateCredits(user!.leadFinderCredits, Math.max(0, user!.emailVerifierCredits - 1));
            } else {
                try {
                    const cr = await deductCredits('email_verifier', 1, `Verified email: ${singleEmail}`);
                    updateCredits(user!.leadFinderCredits, cr.new_balance);
                } catch {
                    // Credit deduction failed silently — reconcile later via audit log
                }
            }
        } catch (err) {
            console.error('Single verification error:', err);
            setCreditError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
        } finally {
            setIsVerifyingSingle(false);
        }
    };

    // ─── File handling ────────────────────────────────────────────────────────

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
            setBulkResults([]);
            setBulkProgress(0);
            setBulkError(null);
            setCurrentJobId(null);
        } else {
            alert('Please upload a valid CSV file.');
        }
    };

    // ─── CSV parser (client-side, for credit pre-check) ───────────────────────

    const parseCSV = (text: string): string[] => {
        const emails: string[] = [];
        for (const line of text.split('\n')) {
            for (const col of line.split(',')) {
                const trimmed = col.trim().replace(/"/g, '');
                if (trimmed.includes('@') && trimmed.includes('.')) {
                    emails.push(trimmed);
                    break;
                }
            }
        }
        return emails.filter(Boolean);
    };

    // ─── Bulk verification (real API) ─────────────────────────────────────────

    const handleBulkVerify = async () => {
        if (!file) return;

        // Parse CSV client-side first for an upfront credit pre-check,
        // so we avoid creating a server job when credits are insufficient.
        const text = await file.text();
        const parsedEmails = parseCSV(text);

        if (parsedEmails.length === 0) {
            setBulkError('No emails found in the CSV file.');
            return;
        }

        const available = user?.emailVerifierCredits ?? 0;
        if (parsedEmails.length > available) {
            setCreditError(`Not enough credits. You need ${parsedEmails.length} but only have ${available}. Please buy more credits.`);
            return;
        }

        setCreditError(null);
        setBulkError(null);
        setDownloadError(null);
        setIsVerifyingBulk(true);
        setShowDownloadPanel(false);
        setBulkProgress(0);
        setBulkResults([]);

        // Create a fresh AbortController for this job
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Step 1: Ensure a valid session exists (creates or refreshes via localStorage)
            await getOrCreateSession(user!.id);

            // Step 2: Upload CSV and receive job metadata
            const { job_id, total } = await uploadCsv(file, user!.id);
            setCurrentJobId(job_id);
            setTotalEmails(total);
            saveActiveJob({ job_id, total }, user!.id);

            // Step 3: Poll progress every 3500ms until job completes
            const finalData: ProgressResponse = await pollUntilComplete(job_id, (data) => {
                setBulkProgress(data.percent);
                setProgressMeta({
                    total: data.total,
                    completed_emails: data.completed_emails,
                    total_batches: data.total_batches,
                    completed_batches: data.completed_batches,
                });
                if (data.last_log) {
                    setLastLog(data.last_log);
                    setLogKey(k => k + 1);
                }
            }, controller.signal, user!.id);

            // Step 4: Map API results to local BulkResult shape
            clearActiveJob(user!.id);
            if (finalData.status === 'cancelled') {
                const processed = finalData.completed_emails;
                setShowDownloadPanel(true);
                if (processed > 0) {
                    const isTestMode = import.meta.env.VITE_TEST_PAYMENT_MODE === 'true';
                    if (isTestMode) {
                        updateCredits(user!.leadFinderCredits, Math.max(0, user!.emailVerifierCredits - processed));
                    } else {
                        try {
                            const result = await deductCredits(
                                'email_verifier',
                                processed,
                                `Bulk verified ${processed} of ${total} emails (job cancelled)`,
                                job_id
                            );
                            updateCredits(user!.leadFinderCredits, result.new_balance);
                        } catch {
                            // Credit deduction failed silently — reconcile later via audit log
                        }
                    }
                }
                return;
            }
            const results: BulkResult[] = (finalData.results ?? []).map((r: EmailResult) => ({
                email: r.email,
                status: r.status,
            }));
            setBulkResults(results);
            setBulkProgress(100);

            // Fetch per-category stats for the completed job
            try {
                const stats = await getStats(job_id, user!.id);
                setJobStats(stats);
            } catch {
                // Stats are non-critical — show panel anyway
            }

            setShowDownloadPanel(true);

            // Deduct credits in bulk after processing completes
            const isTestMode = import.meta.env.VITE_TEST_PAYMENT_MODE === 'true';
            if (isTestMode) {
                updateCredits(user!.leadFinderCredits, Math.max(0, user!.emailVerifierCredits - total));
            } else {
                try {
                    const result = await deductCredits(
                        'email_verifier',
                        total,
                        `Bulk verified ${total} emails`,
                        job_id
                    );
                    updateCredits(user!.leadFinderCredits, result.new_balance);
                } catch {
                    // Credit deduction failed silently — reconcile later via audit log
                }
            }
        } catch (err) {
            // Don't show an error banner if the user intentionally stopped
            if (err instanceof DOMException && err.name === 'AbortError') {
                // Keep the current job ID and results gathered so far, but show download panel
                setShowDownloadPanel(true);
            } else {
                clearActiveJob(user!.id);
                console.error('Bulk verification error:', err);
                setBulkError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
            }
        } finally {
            abortControllerRef.current = null;
            setIsVerifyingBulk(false);
            setIsCancelling(false);
        }
    };

    // ─── Stop / cancel ────────────────────────────────────────────────────────
    // Tell the server to stop, then wait for the next progress poll to confirm
    // status: "cancelled". Do NOT abort locally — the cancelled status is needed
    // to calculate partial credit deduction (completed_emails vs total).
    const handleStop = () => {
        if (isCancelling) return; // already waiting for server confirmation
        setIsCancelling(true);
        clearActiveJob(user!.id);
        if (currentJobId) {
            cancelJob(currentJobId, user!.id); // fire-and-forget
        }
        // Polling continues until the server responds with status: "cancelled"
    };

    // ─── Download ─────────────────────────────────────────────────────────────

    const handleDownload = async () => {
        if (!currentJobId) return;
        setIsDownloading(true);
        setDownloadError(null);
        try {
            const fileName = `verification_${selectedDownloadType}_${file?.name ?? 'results'}`;
            await downloadResultsFromApi(currentJobId, fileName, selectedDownloadType, user!.id);
        } catch (err) {
            console.error('Download error:', err);
            if (err instanceof ResultsNotReadyError) {
                setDownloadError('Results are still being prepared. Please try again in a few seconds.');
            } else {
                setDownloadError('Failed to download results. Please try again.');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div className="glass-dark rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-2">Luci Verifier</h2>
                <p className="text-gray-400 mb-8">Ensure your emails land in the inbox by verifying them instantly.</p>

                {/* Credit error banner */}
                {creditError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-4">
                        <p className="text-red-400 text-sm font-medium">{creditError}</p>
                        <a href="/dashboard?view=billing" className="flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline whitespace-nowrap">
                            <ShoppingCart className="w-4 h-4" /> Buy Credits
                        </a>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'bulk' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
                    >
                        Bulk Verification
                        {activeTab === 'bulk' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'single' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
                    >
                        Single Verification
                        {activeTab === 'single' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-t-full"></div>
                        )}
                    </button>
                </div>

                {/* Single Verification */}
                {activeTab === 'single' && (
                    <div className="max-w-xl">
                        <form onSubmit={handleSingleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className={`h-5 w-5 ${isVerifyingSingle ? 'text-gray-600' : 'text-gray-500'}`} />
                                        </div>
                                        <input
                                            type="email"
                                            value={singleEmail}
                                            onChange={(e) => setSingleEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            disabled={isVerifyingSingle}
                                            className="block w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isVerifyingSingle || !singleEmail}
                                        className="btn-gradient-primary text-white px-6 py-3 rounded-lg shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all font-medium flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifyingSingle ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Loading card */}
                        {isVerifyingSingle && (
                            <div className="mt-5 p-5 rounded-xl bg-white/5 border border-brand-orange/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-brand-orange" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-400">Verifying</p>
                                        <p className="text-sm font-medium text-white truncate">{singleEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange shrink-0" />
                                    <span className="transition-all duration-300">{LOADING_STEPS[loadingStep]}</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                    <div className="h-1 bg-brand-orange/60 rounded-full animate-pulse" style={{ width: '60%' }} />
                                </div>
                            </div>
                        )}

                        {singleResult && !isVerifyingSingle && (
                            <div className="mt-6 space-y-3">
                                {/* Header row */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Result for</p>
                                            <p className="font-medium text-white">{singleResult.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">{singleResult.elapsed_ms}ms</span>
                                        {getStatusBadge(singleResult.status)}
                                    </div>
                                </div>

                                {/* Reason + checks */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Reason</p>
                                        <p className="text-sm text-white font-mono">{singleResult.reason.replace(/_/g, ' ')}</p>
                                    </div>
                                    {singleResult.checks.mx_host && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">MX Host</p>
                                            <p className="text-sm text-white font-mono">{singleResult.checks.mx_host}</p>
                                        </div>
                                    )}
                                    <div className="border-t border-white/5 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                            { label: 'Syntax', value: singleResult.checks.syntax },
                                            { label: 'MX Found', value: singleResult.checks.mx_found },
                                            { label: 'Catch-All', value: singleResult.checks.catch_all, invert: true },
                                            { label: 'Disposable', value: singleResult.checks.disposable, invert: true },
                                            { label: 'Role-Based', value: singleResult.checks.role_based, invert: true },
                                        ].map(({ label, value, invert }) => {
                                            const good = invert ? !value : value;
                                            return (
                                                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${good ? 'bg-green-500/5 border-green-500/15 text-green-400' : 'bg-red-500/5 border-red-500/15 text-red-400'}`}>
                                                    {good
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                        : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                    {label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bulk Verification */}
                {activeTab === 'bulk' && (
                    <div>
                        {/* Upload zone */}
                        {!isVerifyingBulk && !showDownloadPanel && (
                            <div
                                className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-brand-orange/50 hover:bg-white/5 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">Upload CSV</h3>
                                <p className="text-gray-400 mb-6">Drag and drop your CSV file here, or click to browse.</p>
                                {file && (
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-white text-sm mb-4">
                                        <FileText className="w-4 h-4 text-brand-orange" />
                                        {file.name}
                                    </div>
                                )}
                                {bulkError && (
                                    <p className="text-red-400 text-sm mt-2">{bulkError}</p>
                                )}
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            file ? handleBulkVerify() : fileInputRef.current?.click();
                                        }}
                                        className="bg-brand-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition shadow-lg shadow-brand-orange/20"
                                    >
                                        {file ? 'Start Verification' : 'Select File'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Progress state */}
                        {isVerifyingBulk && (
                            <div className="p-8 border border-white/10 rounded-2xl bg-white/5 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
                                        <h3 className="text-base font-semibold text-white">Verifying Emails</h3>
                                    </div>
                                    <span className="text-sm font-semibold text-brand-orange">{bulkProgress}%</span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-brand-orange h-2 rounded-full transition-all duration-500" style={{ width: `${bulkProgress}%` }} />
                                </div>

                                {/* Stat cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total Emails', value: progressMeta.total },
                                        { label: 'Completed', value: progressMeta.completed_emails },
                                        { label: 'Total Batches', value: progressMeta.total_batches },
                                        { label: 'Batches Done', value: progressMeta.completed_batches },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                                            <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Last log */}
                                <div className="h-8 overflow-hidden relative">
                                    <p
                                        key={logKey}
                                        className="text-xs text-gray-400 absolute w-full text-center"
                                        style={{ animation: 'slideUpLog 0.35s ease-out forwards' }}
                                    >
                                        {lastLog || 'Initializing…'}
                                    </p>
                                </div>

                                {/* Stop button */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={handleStop}
                                        disabled={isCancelling}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCancelling ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Cancelling...
                                            </>
                                        ) : (
                                            <>
                                                <StopCircle className="w-4 h-4" />
                                                Stop Verification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Download Panel */}
                        {showDownloadPanel && !isVerifyingBulk && (
                            <div className="space-y-6">
                                <div className="p-8 rounded-2xl border border-white/10 bg-white/5 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {bulkProgress === 100 ? 'Verification Complete' : 'Verification Stopped'}
                                    </h3>
                                    <p className="text-gray-400 mb-8">
                                        {bulkProgress === 100 
                                            ? `All ${totalEmails} emails have been processed.`
                                            : `Process stopped at ${bulkProgress}%. You can still download the results processed so far.`}
                                    </p>

                                    {/* Stats breakdown */}
                                    {jobStats && (
                                        <div className="mb-8">
                                            {/* Progress bar breakdown */}
                                            <div className="flex w-full h-3 rounded-full overflow-hidden mb-4">
                                                {jobStats.total > 0 && (<>
                                                    <div style={{ width: `${(jobStats.valid / jobStats.total) * 100}%` }} className="bg-green-500 transition-all duration-700" />
                                                    <div style={{ width: `${(jobStats.catch_all / jobStats.total) * 100}%` }} className="bg-blue-500 transition-all duration-700" />
                                                    <div style={{ width: `${(jobStats.risky / jobStats.total) * 100}%` }} className="bg-yellow-500 transition-all duration-700" />
                                                    <div style={{ width: `${(jobStats.invalid / jobStats.total) * 100}%` }} className="bg-red-500 transition-all duration-700" />
                                                </>)}
                                            </div>
                                            {/* Stat cards — clickable to expand email list */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { key: 'valid' as const, label: 'Valid', count: jobStats.valid, color: 'green' },
                                                    { key: 'catch_all' as const, label: 'Catch-All', count: jobStats.catch_all, color: 'blue' },
                                                    { key: 'risky' as const, label: 'Risky', count: jobStats.risky, color: 'yellow' },
                                                    { key: 'invalid' as const, label: 'Invalid', count: jobStats.invalid, color: 'red' },
                                                ].map(({ key, label, count, color }) => {
                                                    const isActive = expandedCategory === key;
                                                    const pct = jobStats.total > 0 ? ((count / jobStats.total) * 100).toFixed(1) : '0';
                                                    const colorMap: Record<string, string> = {
                                                        green: 'bg-green-500/10 border-green-500/20 text-green-400 hover:border-green-500/50',
                                                        blue:  'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/50',
                                                        yellow:'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:border-yellow-500/50',
                                                        red:   'bg-red-500/10 border-red-500/20 text-red-400 hover:border-red-500/50',
                                                    };
                                                    const activeRing: Record<string, string> = {
                                                        green: 'ring-2 ring-green-500/50',
                                                        blue:  'ring-2 ring-blue-500/50',
                                                        yellow:'ring-2 ring-yellow-500/50',
                                                        red:   'ring-2 ring-red-500/50',
                                                    };
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={async () => {
                                                                if (isActive) { setExpandedCategory(null); return; }
                                                                setExpandedCategory(key);
                                                                setCategoryEmails([]);
                                                                setIsFetchingCategory(true);
                                                                try {
                                                                    const emails = await fetchCategoryEmails(currentJobId!, key, user!.id);
                                                                    setCategoryEmails(emails);
                                                                } catch {
                                                                    setCategoryEmails([]);
                                                                } finally {
                                                                    setIsFetchingCategory(false);
                                                                }
                                                            }}
                                                            className={`${colorMap[color]} ${isActive ? activeRing[color] : ''} border rounded-xl p-4 text-left transition-all cursor-pointer w-full`}
                                                        >
                                                            <p className={`text-xs font-medium uppercase tracking-wider mb-1`}>{label}</p>
                                                            <p className="text-2xl font-bold text-white">{count.toLocaleString()}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{pct}% · click to view</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Expanded email list */}
                                            {expandedCategory && (() => {
                                                const labelMap: Record<string, string> = { valid: 'Valid', catch_all: 'Catch-All', risky: 'Risky', invalid: 'Invalid' };
                                                const badgeMap: Record<string, VerificationStatus> = { valid: 'valid', catch_all: 'catch_all', risky: 'risky', invalid: 'invalid' };
                                                return (
                                                    <div className="mt-4 border border-white/10 rounded-xl overflow-hidden">
                                                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                                                            <p className="text-sm font-semibold text-white">
                                                                {labelMap[expandedCategory]} Emails
                                                                {!isFetchingCategory && (
                                                                    <span className="ml-2 text-xs text-gray-400 font-normal">({categoryEmails.length.toLocaleString()})</span>
                                                                )}
                                                            </p>
                                                            <button onClick={() => setExpandedCategory(null)} className="text-gray-400 hover:text-white transition text-xs">
                                                                ✕ Close
                                                            </button>
                                                        </div>
                                                        {isFetchingCategory ? (
                                                            <div className="flex items-center justify-center gap-2 py-8">
                                                                <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                                                                <span className="text-sm text-gray-400">Loading emails…</span>
                                                            </div>
                                                        ) : categoryEmails.length === 0 ? (
                                                            <p className="text-sm text-gray-400 text-center py-6">No emails found in this category.</p>
                                                        ) : (
                                                            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                                                                {categoryEmails.map((email, i) => (
                                                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition">
                                                                        <span className="text-sm text-gray-200 font-mono truncate mr-3">{email}</span>
                                                                        {getStatusBadge(badgeMap[expandedCategory])}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {jobStats.cancelled > 0 && (
                                                <p className="text-xs text-gray-500 mt-3 text-center">{jobStats.cancelled.toLocaleString()} emails were skipped due to cancellation</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 text-left">
                                        {(['all', 'valid', 'invalid', 'risky', 'catch_all', 'catch_all_valid'] as DownloadType[]).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedDownloadType(t)}
                                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                    selectedDownloadType === t
                                                        ? 'bg-brand-orange/20 border-brand-orange text-brand-orange shadow-[0_0_15px_rgba(255,107,0,0.2)]'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                                                }`}
                                            >
                                                {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                            </button>
                                        ))}
                                    </div>

                                    {downloadError && (
                                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                            {downloadError}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-orange text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-brand-orange/20 disabled:opacity-50"
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Download className="w-5 h-5" />
                                            )}
                                            Download {selectedDownloadType === 'all' ? 'All' : ''} Results
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                setShowDownloadPanel(false);
                                                setBulkResults([]);
                                                setFile(null);
                                                setCurrentJobId(null);
                                                setBulkError(null);
                                                setBulkProgress(0);
                                                setTotalEmails(0);
                                                setJobStats(null);
                                                setProgressMeta({ total: 0, completed_emails: 0, total_batches: 0, completed_batches: 0 });
                                                setLastLog('');
                                                setLogKey(0);
                                                setExpandedCategory(null);
                                                setCategoryEmails([]);
                                            }}
                                            className="w-full sm:w-auto text-gray-400 hover:text-white text-sm font-medium"
                                        >
                                            Verify another file
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
