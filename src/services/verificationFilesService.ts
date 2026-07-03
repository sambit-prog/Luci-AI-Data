import { supabase } from '../lib/supabase';
import {
  fetchResultsCsvText,
  ResultsNotReadyError,
  type ActiveJob,
  type StatsResponse,
  type DownloadType,
} from './emailVerifierService';

// ─── "My Files": consent-based storage of bulk verification results ───────────
//
// One row in luciAI_verification_files per saved job; the results CSV lives in
// the private 'verification-results' bucket at '{user_id}/{job_id}.csv'.
// Rows expire after retention_days (5–30, chosen by the user at upload time);
// an edge function deletes expired rows + objects daily, and every read here
// also filters expires_at > now() as defense in depth.

const BUCKET = 'verification-results';
const TABLE = 'luciAI_verification_files';

export interface VerificationFileStats {
  valid: number;
  invalid: number;
  risky: number;
  catch_all: number;
  cancelled: number;
  total: number;
}

export interface VerificationFileRecord {
  id: string;
  user_id: string;
  job_id: string;
  file_name: string;
  total_emails: number;
  stats: VerificationFileStats | null;
  storage_path: string | null;
  retention_days: number;
  expires_at: string;
  status: 'saving' | 'stored' | 'failed';
  created_at: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All non-expired saved files for the user, newest first. */
export const listFiles = async (userId: string): Promise<VerificationFileRecord[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as VerificationFileRecord[];
};

/** Saved copy for a specific Railway job, if any — used by session recovery. */
export const getFileByJobId = async (
  userId: string,
  jobId: string
): Promise<VerificationFileRecord | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as VerificationFileRecord | null) ?? null;
};

// ─── Save orchestrator ────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Persist a completed job's results: upsert the tracking row, pull the full
 * CSV from the Railway API, upload it to storage, then mark the row 'stored'.
 * On failure the row is marked 'failed' and the error re-thrown so the caller
 * can offer a Retry. Multi-tab safe: unique(user_id, job_id) + upserts.
 */
export const saveCompletedJobResults = async (
  userId: string,
  job: ActiveJob,
  stats: StatsResponse | null
): Promise<VerificationFileRecord> => {
  if (!job.retentionDays) throw new Error('Retention period missing for saved file');

  const expiresAt = new Date(Date.now() + job.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: row, error: upsertError } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        job_id: job.job_id,
        file_name: job.fileName,
        total_emails: job.total,
        stats,
        retention_days: job.retentionDays,
        expires_at: expiresAt,
        status: 'saving',
      },
      { onConflict: 'user_id,job_id' }
    )
    .select()
    .single();

  if (upsertError) throw new Error(upsertError.message);
  const record = row as VerificationFileRecord;

  const storagePath = `${userId}/${job.job_id}.csv`;
  try {
    // Railway may briefly 202 right after completion — retry a few times
    let csvText = '';
    for (let attempt = 1; ; attempt++) {
      try {
        csvText = await fetchResultsCsvText(job.job_id, userId);
        break;
      } catch (err) {
        if (err instanceof ResultsNotReadyError && attempt < 3) {
          await sleep(3000);
          continue;
        }
        throw err;
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, new Blob([csvText], { type: 'text/csv' }), {
        upsert: true,
        contentType: 'text/csv',
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({ status: 'stored', storage_path: storagePath, stats })
      .eq('id', record.id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    return updated as VerificationFileRecord;
  } catch (err) {
    await supabase.from(TABLE).update({ status: 'failed' }).eq('id', record.id);
    throw err;
  }
};

// ─── Download / filter ────────────────────────────────────────────────────────

/**
 * Filter the stored CSV client-side by the status column.
 * Verified format of the Railway 'type=all' CSV (probed 2026-07-03):
 *   email,status,reason
 * with status in valid | invalid | risky | catch_all.
 * 'all' passes the original text through; 'catch_all_valid' = valid + catch_all.
 * If no status column is found (format change), only 'all' is supported.
 */
export const parseAndFilterCsv = (text: string, filter: DownloadType): string => {
  if (filter === 'all') return text;

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return text;

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const statusCol = headers.findIndex(h => h === 'status');
  if (statusCol === -1) {
    throw new Error('This file has no status column — only the full download is available.');
  }

  const wanted: string[] = filter === 'catch_all_valid' ? ['valid', 'catch_all'] : [filter];
  const rows = lines.slice(1).filter(line => {
    const status = (line.split(',')[statusCol] ?? '').trim().replace(/"/g, '').toLowerCase();
    return wanted.includes(status);
  });

  return [lines[0], ...rows].join('\n');
};

/** Download a stored file from storage, filtered, via the browser save dialog. */
export const downloadStoredFile = async (
  record: VerificationFileRecord,
  filter: DownloadType = 'all'
): Promise<void> => {
  if (!record.storage_path) throw new Error('This file has no stored copy.');

  const { data, error } = await supabase.storage.from(BUCKET).download(record.storage_path);
  if (error || !data) throw new Error(error?.message ?? 'Download failed');

  const filtered = parseAndFilterCsv(await data.text(), filter);
  const blob = new Blob([filtered], { type: 'text/csv' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `verification_${filter}_${record.file_name}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

// ─── Delete / expiry ──────────────────────────────────────────────────────────

/** Remove the stored object (best effort) and the tracking row. */
export const deleteFile = async (record: VerificationFileRecord): Promise<void> => {
  if (record.storage_path) {
    // Best effort — a missing object must not block deleting the row
    await supabase.storage.from(BUCKET).remove([record.storage_path]);
  }
  const { error } = await supabase.from(TABLE).delete().eq('id', record.id);
  if (error) throw new Error(error.message);
};

/** Whole days until expiry, floored at 0 — display only. */
export const getRemainingDays = (record: VerificationFileRecord): number =>
  Math.max(0, Math.ceil((Date.parse(record.expires_at) - Date.now()) / 86400000));
