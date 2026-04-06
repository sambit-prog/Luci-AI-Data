const BASE_URL = 'https://email-verifier-production-ab45.up.railway.app';
const SESSION_KEY = 'ev_session_token';

/** Returns a random delay between 3000ms and 7000ms for jittered polling. */
const randomInterval = (): number => Math.floor(Math.random() * 4001) + 3000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionResponse {
  session_token: string;
  is_new: boolean;
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

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EmailResult {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Build headers, attaching the stored session token if one exists. */
const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(SESSION_KEY);
  return token ? { 'X-Session-Token': token } : {};
};

/** Persist the latest session token to localStorage. */
const saveToken = (token: string): void => {
  localStorage.setItem(SESSION_KEY, token);
};

// ─── Step 1: Session ──────────────────────────────────────────────────────────

/**
 * POST /session/create
 * Calls the API with or without an existing token.
 * - No token → server creates a new session (is_new: true)
 * - Valid token → server refreshes/slides expiry (is_new: false)
 * - Invalid/expired token → server creates new session (is_new: true)
 * Always persists the returned token to localStorage.
 */
export const getOrCreateSession = async (): Promise<SessionResponse> => {
  const response = await fetch(`${BASE_URL}/session/create`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Session error: ${response.status}`);
  }

  const data: SessionResponse = await response.json();
  saveToken(data.session_token);
  return data;
};

// ─── Step 2: Upload CSV ───────────────────────────────────────────────────────

/**
 * POST /verify
 * Uploads a CSV file as multipart/form-data.
 * Returns job metadata immediately — processing happens in the background.
 */
export const uploadCsv = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/verify`, {
    method: 'POST',
    headers: getHeaders(),
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
export const getProgress = async (jobId: string): Promise<ProgressResponse> => {
  const response = await fetch(`${BASE_URL}/progress?job_id=${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

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
export const getStats = async (jobId: string): Promise<StatsResponse> => {
  const response = await fetch(`${BASE_URL}/stats?job_id=${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

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
  type: DownloadType = 'all'
): Promise<void> => {
  const url = `${BASE_URL}/download?job_id=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (response.status === 202) {
    throw new ResultsNotReadyError();
  }

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
export const cancelJob = async (jobId: string): Promise<void> => {
  try {
    await fetch(`${BASE_URL}/cancel?job_id=${encodeURIComponent(jobId)}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    // We intentionally ignore the response status:
    // 204 = cancelled, 404 = already finished — both are acceptable outcomes.
  } catch {
    // Network error during cancel — swallow, the abort signal will still
    // stop the local poll loop so the UI resets cleanly.
  }
};


/**
 * Polls /progress every 3500ms until the job reaches 'completed' or 'failed'.
 * Calls onProgress on each tick so the UI can update the progress bar.
 * Returns the final ProgressResponse.
 */
export const pollUntilComplete = (
  jobId: string,
  onProgress: (data: ProgressResponse) => void,
  signal?: AbortSignal
): Promise<ProgressResponse> => {
  return new Promise((resolve, reject) => {
    // If already aborted before we even start, bail immediately
    if (signal?.aborted) {
      return reject(new DOMException('Polling cancelled', 'AbortError'));
    }

    let timer: ReturnType<typeof setTimeout>;

    // When the signal fires, clear the pending timer and reject
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Polling cancelled', 'AbortError'));
    });

    const tick = async () => {
      if (signal?.aborted) return;

      try {
        const data = await getProgress(jobId);
        onProgress(data);

        if (data.status === 'completed' || data.status === 'failed') {
          resolve(data);
        } else {
          // Random jitter between 3–7 seconds to avoid thundering-herd on the API
          timer = setTimeout(tick, randomInterval());
        }
      } catch (err) {
        reject(err);
      }
    };

    tick();
  });
};
