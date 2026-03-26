import React, { useState, useRef } from 'react';
import { Mail, Upload, CheckCircle2, XCircle, AlertCircle, Download, FileText, Loader2, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deductCredits } from '../../services/paymentService';

type VerificationStatus = 'Valid' | 'Invalid' | 'Risky' | 'Unknown';

interface BulkResult {
    email: string;
    status: VerificationStatus;
}

const simulateVerification = (email: string): VerificationStatus => {
    // Simple mock logic for demonstration
    if (!email.includes('@') || !email.includes('.')) return 'Invalid';
    
    const random = Math.random();
    if (random > 0.3) return 'Valid';
    if (random > 0.1) return 'Risky';
    return 'Invalid';
};

const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
        case 'Valid':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                </span>
            );
        case 'Invalid':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" /> Invalid
                </span>
            );
        case 'Risky':
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        setSingleStatus(simulateVerification(singleEmail));

        // Deduct 1 credit after successful verification
        try {
            const result = await deductCredits('email_verifier', 1, `Verified email: ${singleEmail}`);
            updateCredits(user!.leadFinderCredits, result.new_balance);
        } catch {
            // Credit deduction failed silently — reconcile later via audit log
        } finally {
            setIsVerifyingSingle(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setBulkResults([]);
            setBulkProgress(0);
        } else {
            alert('Please upload a valid CSV file.');
        }
    };

    const parseCSV = (text: string): string[] => {
        const lines = text.split('\n');
        const emails: string[] = [];
        
        // Very basic CSV parsing: looking for an email column
        for (const line of lines) {
            const cols = line.split(',');
            for (const col of cols) {
                const trimmed = col.trim().replace(/"/g, '');
                if (trimmed.includes('@') && trimmed.includes('.')) {
                    emails.push(trimmed);
                    break; // Just grab first thing that looks like email per row
                }
            }
        }
        return emails.filter(Boolean);
    };

    const handleBulkVerify = async () => {
        if (!file) return;

        setCreditError(null);

        // Parse emails first so we can do a pre-flight credit check
        const text = await file.text();
        const emails = parseCSV(text);

        if (emails.length === 0) {
            alert('No emails found in the CSV file.');
            return;
        }

        const available = user?.emailVerifierCredits ?? 0;
        if (emails.length > available) {
            setCreditError(`Not enough credits. You need ${emails.length} but only have ${available}. Please buy more credits.`);
            return;
        }

        setIsVerifyingBulk(true);
        setBulkProgress(0);
        setBulkResults([]);

        try {
            const results: BulkResult[] = [];

            for (let i = 0; i < emails.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 50));
                results.push({ email: emails[i], status: simulateVerification(emails[i]) });
                setBulkProgress(Math.round(((i + 1) / emails.length) * 100));
            }

            setBulkResults(results);

            // Deduct credits in bulk after processing completes
            try {
                const result = await deductCredits(
                    'email_verifier',
                    emails.length,
                    `Bulk verified ${emails.length} emails`,
                    file.name
                );
                updateCredits(user!.leadFinderCredits, result.new_balance);
            } catch {
                // Credit deduction failed silently — reconcile later via audit log
            }
        } catch (error) {
            console.error('Error processing file', error);
            alert('Error processing file');
        } finally {
            setIsVerifyingBulk(false);
        }
    };

    const downloadResults = () => {
        if (bulkResults.length === 0) return;

        const csvContent = [
            'Email,Status',
            ...bulkResults.map(r => `"${r.email}",${r.status}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'verification_results.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

                {/* Single Verification Content */}
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

                        {/* Result Display */}
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
                                <div>
                                    {getStatusBadge(singleStatus)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bulk Verification Content */}
                {activeTab === 'bulk' && (
                    <div>
                        {!isVerifyingBulk && bulkResults.length === 0 && (
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

                        {isVerifyingBulk && (
                            <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5">
                                <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto mb-6" />
                                <h3 className="text-xl font-semibold text-white mb-2">Verifying Emails</h3>
                                <p className="text-gray-400 mb-8">Please wait while we check your list...</p>
                                
                                <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2.5 mb-2">
                                    <div className="bg-brand-orange h-2.5 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                                </div>
                                <span className="text-sm font-medium text-white">{bulkProgress}% Complete</span>
                            </div>
                        )}

                        {bulkResults.length > 0 && !isVerifyingBulk && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">Verification Complete</h3>
                                        <p className="text-gray-400 text-sm">Processed {bulkResults.length} emails</p>
                                    </div>
                                    <button 
                                        onClick={downloadResults}
                                        className="flex items-center space-x-2 bg-transparent border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download CSV</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto border border-white/10 rounded-xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-300 uppercase tracking-wider">Email Address</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {bulkResults.map((result, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-300">{result.email}</td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(result.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={() => {
                                            setBulkResults([]);
                                            setFile(null);
                                        }}
                                        className="text-gray-400 hover:text-white text-sm"
                                    >
                                        Verify another file
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
