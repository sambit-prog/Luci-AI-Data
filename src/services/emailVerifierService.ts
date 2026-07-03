const BASE_URL = 'https://email-verifier-production-ab45.up.railway.app';

// ─── localStorage key builders (scoped per user) ──────────────────────────────

const sessionKey = (userId: string) => `ev_session_token_${userId}`;
const activeJobKey = (userId: string) => `ev_active_job_${userId}`;

// ─── Active Job Persistence ───────────────────────────────────────────────────
//
// The record deliberately survives job completion: it is the only client-side
// pointer to results the user has not downloaded yet. It is cleared ONLY when
// the user starts a new file, or when the server definitively reports the job
// gone (404) and there is nothing left to recover.

export interface ActiveJob {
  job_id: string;
  total: number;
  fileName: string;
  status: 'running' | 'completed' | 'cancelled';
  createdAt: string;                // ISO timestamp
  consent: boolean;                 // user opted in to "Save results to My Files"
  retentionDays: number | null;     // 5–30 when consent is true
  creditsDeducted: boolean;         // client-side settle guard (sole guard in test mode)
  savedFileId?: string | null;      // luciAI_verification_files.id once stored
}

/** Records older than this are considered abandoned and dropped on read. */
const ACTIVE_JOB_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

export const saveActiveJob = (job: ActiveJob, userId: string): void => {
  localStorage.setItem(activeJobKey(userId), JSON.stringify(job));
};

export const getActiveJob = (userId: string): ActiveJob | null => {
  try {
    const raw = localStorage.getItem(activeJobKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveJob> & { job_id?: string; total?: number };
    if (!parsed.job_id) return null;

    // Migrate pre-recovery-fix records ({job_id, total} only) so jobs that were
    // live during the old deploy still resume.
    const job: ActiveJob = {
      job_id: parsed.job_id,
      total: parsed.total ?? 0,
      fileName: parsed.fileName ?? 'results.csv',
      status: parsed.status ?? 'running',
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      consent: parsed.consent ?? false,
      retentionDays: parsed.retentionDays ?? null,
      creditsDeducted: parsed.creditsDeducted ?? false,
      savedFileId: parsed.savedFileId ?? null,
    };

    if (Date.now() - Date.parse(job.createdAt) > ACTIVE_JOB_MAX_AGE_MS) {
      clearActiveJob(userId);
      return null;
    }
    return job;
  } catch {
    return null;
  }
};

/** Read-merge-write partial update; no-op when no record exists. */
export const updateActiveJob = (userId: string, patch: Partial<ActiveJob>): void => {
  const current = getActiveJob(userId);
  if (!current) return;
  saveActiveJob({ ...current, ...patch }, userId);
};

export const clearActiveJob = (userId: string): void => {
  localStorage.removeItem(activeJobKey(userId));
};

/** Returns a random delay between 3000ms and 7000ms for jittered polling. */
const randomInterval = (): number => Math.floor(Math.random() * 4001) + 3000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionResponse {
  session_token: string;
  is_new: boolean;
}

export interface SingleVerifyResponse {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  reason: string;
  checks: {
    syntax: boolean;
    disposable: boolean;
    role_based: boolean;
    mx_found: boolean;
    mx_host: string;
    catch_all: boolean;
  };
  elapsed_ms: number;
}

export interface StatsResponse {
  valid: number;
  invalid: number;
  risky: number;
  catch_all: number;
  cancelled: number;
  total: number;
}

export interface UploadResponse {
  job_id: string;
  total: number;
  total_batches: number;
  batch_size: number;
  session_token: string;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface EmailResult {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'catch_all' | 'unknown';
}

export interface ProgressResponse {
  job_id: string;
  status: JobStatus;
  percent: number;           // 0–100, returned directly by the API
  total: number;
  total_batches: number;
  completed_batches: number;
  completed_emails: number;
  logs: string[];            // per-email log lines
  last_log: string;          // most recent log line
  is_legacy: boolean;
  results?: EmailResult[];   // populated when status === 'completed'
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/** Thrown when the server returns 404 — the job definitively no longer exists. */
export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} not found on server`);
    this.name = 'JobNotFoundError';
  }
}

/** Thrown when polling exhausted its retries on transient errors.
 *  The job may still be running — callers must NOT clear the job record. */
export class PollingGaveUpError extends Error {
  constructor() {
    super('Polling gave up after repeated connection failures');
    this.name = 'PollingGaveUpError';
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Build headers, attaching the stored session token if one exists. */
const getHeaders = (userId: string): Record<string, string> => {
  const token = localStorage.getItem(sessionKey(userId));
  return token ? { 'X-Session-Token': token } : {};
};

/** Persist the latest session token to localStorage. */
const saveToken = (token: string, userId: string): void => {
  localStorage.setItem(sessionKey(userId), token);
};

/**
 * GET a job-scoped endpoint. On 401 (session token expired, e.g. after a long
 * laptop sleep) refresh the Railway session once and retry — a 404 after the
 * refresh is the honest "job gone" signal, handled by each caller.
 */
const jobRequest = async (path: string, userId: string): Promise<Response> => {
  let response = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers: getHeaders(userId) });
  if (response.status === 401) {
    await getOrCreateSession(userId);
    response = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers: getHeaders(userId) });
  }
  return response;
};

// ─── Single Email Verification ────────────────────────────────────────────────

/**
 * POST /verify-single
 * Verifies a single email address.
 * @param sessionToken - Token returned from getOrCreateSession(), sent as X-API-Key header.
 */
export const verifySingleEmail = async (email: string, sessionToken: string): Promise<SingleVerifyResponse> => {
  const response = await fetch(`${BASE_URL}/verify-single`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': sessionToken,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Verification failed' }));
    throw new Error(err.error ?? `Verify-single error: ${response.status}`);
  }

  return response.json() as Promise<SingleVerifyResponse>;
};

// ─── Step 1: Session ──────────────────────────────────────────────────────────

/**
 * POST /session/create
 * Calls the API with or without an existing token.
 * - No token → server creates a new session (is_new: true)
 * - Valid token → server refreshes/slides expiry (is_new: false)
 * - Invalid/expired token → server creates new session (is_new: true)
 * Always persists the returned token to localStorage under the user's scoped key.
 */
export const getOrCreateSession = async (userId: string): Promise<SessionResponse> => {
  const response = await fetch(`${BASE_URL}/session/create`, {
    method: 'POST',
    headers: getHeaders(userId),
  });

  if (!response.ok) {
    throw new Error(`Session error: ${response.status}`);
  }

  const data: SessionResponse = await response.json();
  saveToken(data.session_token, userId);
  return data;
};

// ─── Step 2: Upload CSV ───────────────────────────────────────────────────────

/**
 * POST /verify
 * Uploads a CSV file as multipart/form-data.
 * Returns job metadata immediately — processing happens in the background.
 */
export const uploadCsv = async (file: File, userId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/verify`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? `Upload error: ${response.status}`);
  }

  return response.json() as Promise<UploadResponse>;
};

// ─── Step 3: Poll Progress ────────────────────────────────────────────────────

/**
 * GET /progress?job_id=...
 * Returns the current status of a verification job.
 */
export const getProgress = async (jobId: string, userId: string): Promise<ProgressResponse> => {
  const response = await jobRequest(`/progress?job_id=${encodeURIComponent(jobId)}`, userId);

  if (response.status === 404) throw new JobNotFoundError(jobId);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Progress check failed' }));
    throw new Error(err.error ?? `Progress error: ${response.status}`);
  }

  return response.json() as Promise<ProgressResponse>;
};

// ─── Step 4: Stats ────────────────────────────────────────────────────────────

/**
 * GET /stats?job_id=...
 * Returns aggregate per-status counts for a completed job.
 */
export const getStats = async (jobId: string, userId: string): Promise<StatsResponse> => {
  const response = await jobRequest(`/stats?job_id=${encodeURIComponent(jobId)}`, userId);

  if (response.status === 404) throw new JobNotFoundError(jobId);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Stats fetch failed' }));
    throw new Error(err.error ?? `Stats error: ${response.status}`);
  }

  return response.json() as Promise<StatsResponse>;
};

// ─── Step 5: Download Results ─────────────────────────────────────────────────

export type DownloadType = 'all' | 'valid' | 'invalid' | 'risky' | 'catch_all' | 'catch_all_valid';

/** Thrown when the server returns 202 — results exist but aren't fully ready yet. */
export class ResultsNotReadyError extends Error {
  constructor() {
    super('Results are not ready yet. Verification may still be processing.');
    this.name = 'ResultsNotReadyError';
  }
}

/**
 * GET /download?job_id=...&type=...
 * Streams a filtered CSV from the server and triggers a browser file-save dialog.
 *
 * @param type - Filter: 'all' | 'valid' | 'invalid' | 'risky' | 'catch_all' | 'catch_all_valid'
 *   Defaults to 'all'. Pass the user's selected filter from the download panel.
 *
 * Throws ResultsNotReadyError on 202 (still processing — caller can show a "not ready" message).
 * Throws Error on 401 / 404 / other failures.
 *
 * TODO: If download behaviour changes (e.g. inline preview, signed URL), update here only.
 */
export const downloadResults = async (
  jobId: string,
  fileName = 'verification_results.csv',
  type: DownloadType = 'all',
  userId: string
): Promise<void> => {
  const response = await jobRequest(
    `/download?job_id=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`,
    userId
  );

  if (response.status === 202) {
    throw new ResultsNotReadyError();
  }
  if (response.status === 404) throw new JobNotFoundError(jobId);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error ?? `Download error: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};


/**
 * GET /download?job_id=...&type=...
 * Fetches the filtered CSV as text and returns an array of email strings.
 * Used for in-page preview (expandable stat cards) — does NOT trigger a file download.
 */
export const fetchCategoryEmails = async (
  jobId: string,
  type: DownloadType,
  userId: string
): Promise<string[]> => {
  const response = await jobRequest(
    `/download?job_id=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`,
    userId
  );

  if (response.status === 202) throw new ResultsNotReadyError();
  if (response.status === 404) throw new JobNotFoundError(jobId);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Fetch failed' }));
    throw new Error(err.error ?? `Fetch error: ${response.status}`);
  }

  const text = await response.text();
  // Parse CSV — find the email column from the header row, then extract values
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const emailCol = headers.findIndex(h => h === 'email');
  if (emailCol === -1) {
    // No header found — assume first column is email
    return lines.slice(1).map(l => l.split(',')[0].trim().replace(/"/g, '')).filter(Boolean);
  }
  return lines.slice(1).map(l => {
    const cols = l.split(',');
    return (cols[emailCol] ?? '').trim().replace(/"/g, '');
  }).filter(Boolean);
};

/**
 * GET /download?job_id=...&type=all
 * Fetches the full results CSV as raw text (no browser save dialog).
 * Used to persist a copy to Supabase Storage ("My Files").
 * Throws ResultsNotReadyError on 202, JobNotFoundError on 404.
 */
export const fetchResultsCsvText = async (jobId: string, userId: string): Promise<string> => {
  const response = await jobRequest(`/download?job_id=${encodeURIComponent(jobId)}&type=all`, userId);

  if (response.status === 202) throw new ResultsNotReadyError();
  if (response.status === 404) throw new JobNotFoundError(jobId);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Results fetch failed' }));
    throw new Error(err.error ?? `Results fetch error: ${response.status}`);
  }

  return response.text();
};

// ─── Step 5: Cancel Job ───────────────────────────────────────────────────────

/**
 * POST /cancel?job_id=...
 * Signals the server to stop processing a running job.
 * - 204 → cancelled successfully (no body)
 * - 404 → job not found / not owned by this session (already done or wrong id)
 * - 401 → session missing / expired
 *
 * NOTE: This function is intentionally fire-and-forget friendly.
 * Any already-completed results remain available on the server.
 * The caller is responsible for aborting the local poll loop separately.
 *
 * TODO: If the cancel flow changes (e.g. optimistic UI, partial results fetch),
 * update only this function and handleStop() in EmailVerifier.tsx.
 */
export const cancelJob = async (jobId: string, userId: string): Promise<void> => {
  try {
    await fetch(`${BASE_URL}/cancel?job_id=${encodeURIComponent(jobId)}`, {
      method: 'POST',
      headers: getHeaders(userId),
    });
    // We intentionally ignore the response status:
    // 204 = cancelled, 404 = already finished — both are acceptable outcomes.
  } catch {
    // Network error during cancel — swallow, the abort signal will still
    // stop the local poll loop so the UI resets cleanly.
  }
};


export type ConnectionState = 'connected' | 'reconnecting';

/** Consecutive transient failures tolerated before polling gives up (~4 min of backoff). */
const MAX_CONSECUTIVE_POLL_FAILURES = 8;

/**
 * Polls /progress on a jittered 3–7s interval until the job reaches
 * 'completed', 'failed' or 'cancelled'. Calls onProgress on each tick.
 *
 * Resilience contract:
 * - Transient errors (network blips, 5xx) are retried with exponential backoff
 *   (5s → 60s cap). onConnectionChange reports 'reconnecting' / 'connected' so
 *   the UI can show a banner instead of failing.
 * - Rejects with JobNotFoundError only on a definitive server 404.
 * - Rejects with PollingGaveUpError after MAX_CONSECUTIVE_POLL_FAILURES —
 *   the job may still be running, so callers must NOT clear the job record.
 * - 'online' and 'visibilitychange' events trigger an immediate re-poll so a
 *   laptop waking from sleep reconnects promptly.
 */
export const pollUntilComplete = (
  jobId: string,
  onProgress: (data: ProgressResponse) => void,
  signal: AbortSignal | undefined,
  userId: string,
  onConnectionChange?: (state: ConnectionState, failCount: number) => void
): Promise<ProgressResponse> => {
  return new Promise((resolve, reject) => {
    // If already aborted before we even start, bail immediately
    if (signal?.aborted) {
      return reject(new DOMException('Polling cancelled', 'AbortError'));
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    let inFlight = false;
    let consecutiveFailures = 0;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    const settleResolve = (data: ProgressResponse) => { if (!settled) { cleanup(); resolve(data); } };
    const settleReject = (err: unknown) => { if (!settled) { cleanup(); reject(err); } };

    const onAbort = () => settleReject(new DOMException('Polling cancelled', 'AbortError'));
    signal?.addEventListener('abort', onAbort);

    // Immediate re-poll on network return / tab foreground (laptop wake)
    const wake = () => {
      if (settled || inFlight) return;
      clearTimeout(timer);
      tick();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') wake();
    };
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', onVisibility);

    // 5s, 10s, 20s, 40s, 60s, 60s... plus 0–2s jitter
    const backoffDelay = (failCount: number): number =>
      Math.min(5000 * 2 ** (failCount - 1), 60000) + Math.floor(Math.random() * 2000);

    const tick = async () => {
      if (settled || signal?.aborted) return;
      inFlight = true;

      try {
        const data = await getProgress(jobId, userId);
        inFlight = false;
        if (settled) return;

        if (consecutiveFailures > 0) {
          consecutiveFailures = 0;
          onConnectionChange?.('connected', 0);
        }
        onProgress(data);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          settleResolve(data);
        } else {
          // Random jitter between 3–7 seconds to avoid thundering-herd on the API
          timer = setTimeout(tick, randomInterval());
        }
      } catch (err) {
        inFlight = false;
        if (settled) return;

        if (err instanceof DOMException && err.name === 'AbortError') return settleReject(err);
        if (err instanceof JobNotFoundError) return settleReject(err);

        consecutiveFailures += 1;
        onConnectionChange?.('reconnecting', consecutiveFailures);
        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          return settleReject(new PollingGaveUpError());
        }
        timer = setTimeout(tick, backoffDelay(consecutiveFailures));
      }
    };

    tick();
  });
};
