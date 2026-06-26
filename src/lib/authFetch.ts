/**
 * Central authenticated fetch wrapper with auto token refresh.
 *
 * Features:
 * 1. Attaches Bearer token from store/localStorage to every request
 * 2. Captures new token from `x-new-token` response header (token rotation)
 * 3. On 401, calls POST /auth/refresh once, updates token, retries original request
 * 4. Proactively refreshes if JWT exp is within 60s
 */

import { useAppStore } from '../stores/useAppStore';
import { decodeJwtPayload } from './api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/* ─── Token helpers ─────────────────────────────────────────────────── */

/** Get the raw JWT string from localStorage (stored as JSON by zustand). */
export function getToken(): string | null {
  const raw = localStorage.getItem('auth_token');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed !== 'null' && parsed !== 'undefined') return parsed as string;
  } catch {
    return raw;
  }
  return null;
}

/** Persist a new token to both localStorage and zustand store. */
export function setToken(token: string | null): void {
  const { setAuthToken } = useAppStore.getState();
  setAuthToken(token);
}

/** Build Authorization headers object (drop-in replacement for old authHeaders). */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

/** Check if JWT is expired or about to expire (within `marginSec`). */
function isTokenExpiring(token: string, marginSec = 60): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload.exp as number | undefined;
  if (!exp) return false; // no exp claim, assume valid
  const now = Math.floor(Date.now() / 1000);
  return now + marginSec >= exp;
}

/* ─── Refresh logic ─────────────────────────────────────────────────── */

let refreshPromise: Promise<string | null> | null = null;

/** Call POST /auth/refresh to get a new token. Deduplicates concurrent calls. */
export function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const currentToken = getToken();
    if (!currentToken) return null;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!res.ok) return null;

      // New token may come from header or body
      const newTokenFromHeader = res.headers.get('x-new-token');
      const data = await res.json().catch(() => ({}));
      const newToken =
        newTokenFromHeader ||
        (data as any).token ||
        (data as any).access_token ||
        null;

      if (newToken) {
        setToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/* ─── Main authFetch wrapper ────────────────────────────────────────── */

/**
 * Drop-in replacement for `fetch` that:
 * - Attaches Authorization Bearer header
 * - Captures `x-new-token` from response headers and updates stored token
 * - On 401, refreshes token once and retries the original request
 * - Proactively refreshes if token is near expiry (before sending request)
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  // Proactive refresh if token is near expiry
  if (token && isTokenExpiring(token)) {
    await refreshToken();
  }

  const currentToken = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  let res = await fetch(url, { ...options, headers });

  // Capture rotated token from response header
  const newTokenFromHeader = res.headers.get('x-new-token');
  if (newTokenFromHeader) {
    setToken(newTokenFromHeader);
  }

  // On 401, try refresh + retry once
  if (res.status === 401 && currentToken) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry with new token
      const retryHeaders = new Headers(options.headers || {});
      if (currentToken) retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      if (!retryHeaders.has('Content-Type') && options.body) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      res = await fetch(url, { ...options, headers: retryHeaders });

      // Capture rotated token from retry response too
      const retryNewToken = res.headers.get('x-new-token');
      if (retryNewToken) {
        setToken(retryNewToken);
      }
    }
  }

  return res;
}

export default authFetch;
