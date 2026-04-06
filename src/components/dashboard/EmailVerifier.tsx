import React, { useState, useRef } from 'react';
import { Mail, Upload, CheckCircle2, XCircle, AlertCircle, Download, FileText, Loader2, ShoppingCart, StopCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deductCredits } from '../../services/paymentService';
import {
    getOrCreateSession,
    uploadCsv,
    pollUntilComplete,
    cancelJob,
    downloadResults as downloadResultsFromApi,
    ResultsNotReadyError,
    type EmailResult,
    type ProgressResponse,
    type DownloadType,
} from '../../services/emailVerifierService';

type VerificationStatus = 'valid' | 'invalid' | 'risky' | 'unknown';

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
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [creditError, setCreditError] = useState<string | null>(null);

    // Single Email State
    const [singleEmail, setSingleEmail] = useState('');
    const [singleStatus, setSingleStatus] = useState<VerificationStatus | null>(null);
    const [isVerifyingSingle, setIsVerifyingSingle] = useState(false);

    // Bulk Email State
    const [file, setFile] = useState<File | null>(null);
    const [isVerifyingBulk, setIsVerifyingBulk] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [showDownloadPanel, setShowDownloadPanel] = useState(false);
    const [selectedDownloadType, setSelectedDownloadType] = useState<DownloadType>('all');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Single verification ──────────────────────────────────────────────────

    const handleSingleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleEmail) return;

        if ((user?.emailVerifierCredits ?? 0) <= 0) {
            setCreditError('You have no Email Verifier credits. Please buy more to continue.');
            return;
        }

        setCreditError(null);
        setIsVerifyingSingle(true);
        setSingleStatus(null);

        try {
            // Ensure we have a valid session before calling the API
            await getOrCreateSession();

            // TODO: single-email endpoint — using mock until API supports it
            await new Promise(resolve => setTimeout(resolve, 1200));
            const mock: VerificationStatus = Math.random() > 0.3 ? 'valid' : Math.random() > 0.5 ? 'risky' : 'invalid';
            setSingleStatus(mock);

            // Deduct 1 credit after successful verification
            try {
                const result = await deductCredits('email_verifier', 1, `Verified email: ${singleEmail}`);
                updateCredits(user!.leadFinderCredits, result.new_balance);
            } catch {
                // Credit deduction failed silently — reconcile later via audit log
            }
        } catch (err) {
            console.error('Single verification error:', err);
        } finally {
            setIsVerifyingSingle(false);
        }
    };

    // ─── File handling ────────────────────────────────────────────────────────

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setBulkResults([]);
            setBulkProgress(0);
            setBulkError(null);
            setCurrentJobId(null);
        } else {
            alert('Please upload a valid CSV file.');
        }
    };

    // ─── Bulk verification (real API) ─────────────────────────────────────────

    const handleBulkVerify = async () => {
        if (!file) return;

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
            await getOrCreateSession();

            // Step 2: Upload CSV and receive job metadata
            const { job_id, total } = await uploadCsv(file);
            setCurrentJobId(job_id);

            // Step 3: Poll progress every 3500ms until job completes
            const finalData: ProgressResponse = await pollUntilComplete(job_id, (data) => {
                // Use percent directly from API (already 0–100)
                setBulkProgress(data.percent);
            }, controller.signal);

            // Step 4: Map API results to local BulkResult shape
            const results: BulkResult[] = (finalData.results ?? []).map((r: EmailResult) => ({
                email: r.email,
                status: r.status,
            }));
            setBulkResults(results);
            setBulkProgress(100);
            setShowDownloadPanel(true);

            // Deduct credits in bulk after processing completes
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
        } catch (err) {
            // Don't show an error banner if the user intentionally stopped
            if (err instanceof DOMException && err.name === 'AbortError') {
                // Keep the current job ID and results gathered so far, but show download panel
                setShowDownloadPanel(true);
            } else {
                console.error('Bulk verification error:', err);
                setBulkError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
            }
        } finally {
            abortControllerRef.current = null;
            setIsVerifyingBulk(false);
        }
    };

    // ─── Stop / cancel ────────────────────────────────────────────────────────
    // NOTE: Two-step cancel — first tell the server to stop, then kill local poll.
    // If the cancel flow changes in future, update cancelJob() in emailVerifierService.ts.
    const handleStop = () => {
        if (currentJobId) {
            cancelJob(currentJobId); // fire-and-forget
        }
        abortControllerRef.current?.abort(); // local poll loop stops, catch block triggers
    };

    // ─── Download ─────────────────────────────────────────────────────────────

    const handleDownload = async () => {
        if (!currentJobId) return;
        setIsDownloading(true);
        setDownloadError(null);
        try {
            const fileName = `verification_${selectedDownloadType}_${file?.name ?? 'results'}`;
            await downloadResultsFromApi(currentJobId, fileName, selectedDownloadType);
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
                <h2 className="text-2xl font-bold text-white mb-2">Email Verifier</h2>
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
                        onClick={() => setActiveTab('single')}
                        className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'single' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
                    >
                        Single Verification
                        {activeTab === 'single' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'bulk' ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
                    >
                        Bulk Verification
                        {activeTab === 'bulk' && (
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
                                            <Mail className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            type="email"
                                            value={singleEmail}
                                            onChange={(e) => setSingleEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="block w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isVerifyingSingle || !singleEmail}
                                        className="btn-gradient-primary text-white px-6 py-3 rounded-lg shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all font-medium flex items-center justify-center min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifyingSingle ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {singleStatus && !isVerifyingSingle && (
                            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Result for</p>
                                        <p className="font-medium text-white">{singleEmail}</p>
                                    </div>
                                </div>
                                <div>{getStatusBadge(singleStatus)}</div>
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
                            <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5">
                                <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto mb-6" />
                                <h3 className="text-xl font-semibold text-white mb-2">Verifying Emails</h3>
                                <p className="text-gray-400 mb-8">Please wait while we check your list...</p>
                                <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2.5 mb-2">
                                    <div
                                        className="bg-brand-orange h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${bulkProgress}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-white">{bulkProgress}% Complete</span>
                                <div className="mt-8">
                                    <button
                                        onClick={handleStop}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all text-sm font-medium"
                                    >
                                        <StopCircle className="w-4 h-4" />
                                        Stop Verification
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
                                            ? `All ${bulkResults.length} emails have been processed.`
                                            : `Process stopped at ${bulkProgress}%. You can still download the results processed so far.`}
                                    </p>

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
