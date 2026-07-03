import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, FileText, Download, Trash2, Clock, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    listFiles,
    downloadStoredFile,
    deleteFile,
    getRemainingDays,
    type VerificationFileRecord,
} from '../../services/verificationFilesService';
import type { DownloadType } from '../../services/emailVerifierService';

const DOWNLOAD_TYPES: DownloadType[] = ['all', 'valid', 'invalid', 'risky', 'catch_all', 'catch_all_valid'];

const typeLabel = (t: DownloadType): string =>
    t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const MyFiles: React.FC<{ onNavigateToVerifier: () => void }> = ({ onNavigateToVerifier }) => {
    const { user } = useAuth();
    const [files, setFiles] = useState<VerificationFileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<Record<string, DownloadType>>({});
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadErrorId, setDownloadErrorId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setLoadError(null);
        try {
            setFiles(await listFiles(user.id));
        } catch {
            setLoadError('Could not load your files. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleDownload = async (record: VerificationFileRecord) => {
        setDownloadingId(record.id);
        setDownloadErrorId(null);
        try {
            await downloadStoredFile(record, selectedType[record.id] ?? 'all');
        } catch {
            setDownloadErrorId(record.id);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (record: VerificationFileRecord) => {
        setDeletingId(record.id);
        try {
            await deleteFile(record);
            setFiles(prev => prev.filter(f => f.id !== record.id));
        } catch {
            setLoadError('Could not delete the file. Please try again.');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-dark rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-2">My Files</h2>
                <p className="text-gray-400 mb-8">
                    Saved verification results. Files are deleted automatically when they expire.
                </p>

                {loadError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-4">
                        <p className="text-red-400 text-sm font-medium">{loadError}</p>
                        <button onClick={loadFiles} className="text-sm font-semibold text-brand-orange hover:underline whitespace-nowrap">
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !loadError && files.length === 0 && (
                    <div className="text-center py-16">
                        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No saved files yet</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Enable "Save results to My Files" when you start a verification to keep a downloadable copy here.
                        </p>
                        <button
                            onClick={onNavigateToVerifier}
                            className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition shadow-lg shadow-brand-orange/20"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Go to Luci Verifier
                        </button>
                    </div>
                )}

                {/* File list */}
                {!isLoading && files.length > 0 && (
                    <div className="space-y-3">
                        {files.map(record => {
                            const remaining = getRemainingDays(record);
                            const stats = record.stats;
                            return (
                                <div key={record.id} className="border border-white/10 rounded-xl bg-white/5 p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Name + meta */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-brand-orange" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-white truncate" title={record.file_name}>
                                                    {record.file_name}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(record.created_at).toLocaleDateString()} · {record.total_emails.toLocaleString()} emails
                                                </p>
                                                <p className={`text-xs mt-1 inline-flex items-center gap-1 ${remaining <= 2 ? 'text-amber-400' : 'text-gray-500'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    Expires in {remaining} day{remaining === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats mini-bar */}
                                        <div className="lg:w-56 shrink-0">
                                            {stats && stats.total > 0 ? (
                                                <>
                                                    <div
                                                        className="flex w-full h-2 rounded-full overflow-hidden"
                                                        title={`Valid ${stats.valid} · Catch-All ${stats.catch_all} · Risky ${stats.risky} · Invalid ${stats.invalid}`}
                                                    >
                                                        <div style={{ width: `${(stats.valid / stats.total) * 100}%` }} className="bg-green-500" />
                                                        <div style={{ width: `${(stats.catch_all / stats.total) * 100}%` }} className="bg-blue-500" />
                                                        <div style={{ width: `${(stats.risky / stats.total) * 100}%` }} className="bg-yellow-500" />
                                                        <div style={{ width: `${(stats.invalid / stats.total) * 100}%` }} className="bg-red-500" />
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-1.5">
                                                        <span className="text-green-400">{stats.valid.toLocaleString()} valid</span>
                                                        {' · '}
                                                        <span className="text-red-400">{stats.invalid.toLocaleString()} invalid</span>
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-gray-500">No stats available</p>
                                            )}
                                        </div>

                                        {/* Status / actions */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            {record.status === 'saving' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                                                    <Loader2 className="w-3 h-3 animate-spin text-brand-orange" /> Saving…
                                                </span>
                                            )}
                                            {record.status === 'failed' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <XCircle className="w-3 h-3" /> Save failed
                                                </span>
                                            )}
                                            {record.status === 'stored' && (
                                                <>
                                                    <select
                                                        value={selectedType[record.id] ?? 'all'}
                                                        onChange={(e) =>
                                                            setSelectedType(prev => ({ ...prev, [record.id]: e.target.value as DownloadType }))
                                                        }
                                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-colors [&>option]:bg-gray-900"
                                                    >
                                                        {DOWNLOAD_TYPES.map(t => (
                                                            <option key={t} value={t}>{typeLabel(t)}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleDownload(record)}
                                                        disabled={downloadingId === record.id}
                                                        className="inline-flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition shadow-lg shadow-brand-orange/20 disabled:opacity-50"
                                                    >
                                                        {downloadingId === record.id
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : <Download className="w-4 h-4" />}
                                                        Download
                                                    </button>
                                                </>
                                            )}
                                            {confirmDeleteId === record.id ? (
                                                <span className="inline-flex items-center gap-2 text-xs">
                                                    <span className="text-gray-300">Delete now? This cannot be undone.</span>
                                                    <button
                                                        onClick={() => handleDelete(record)}
                                                        disabled={deletingId === record.id}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition font-medium disabled:opacity-50"
                                                    >
                                                        {deletingId === record.id ? 'Deleting…' : 'Delete'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-gray-400 hover:text-white transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(record.id)}
                                                    title="Delete file"
                                                    className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/40 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {downloadErrorId === record.id && (
                                        <p className="text-red-400 text-xs mt-3">
                                            Download failed. Please try again.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
