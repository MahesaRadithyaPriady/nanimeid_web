/**
 * Backend API client.
 * Base URL is read from VITE_API_BASE_URL (e.g. http://localhost:3000).
 * Set it in .env.local:  VITE_API_BASE_URL=https://your-api.example.com
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/* ─── Types ────────────────────────────────────────────────────────── */

export interface GoogleVerifyPayload {
  id_token: string;
  fingerprint_hash?: string;
  device_info?: Record<string, unknown>;
}

/** Shape returned by POST /auth/google/verify */
export interface GoogleVerifyResponse {
  /** JWT issued by the server */
  token?: string;
  access_token?: string;   // some backends use this key instead
  /** Optional user object embedded in the response */
  user?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
  };
  message?: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

/** Decode the payload of a JWT (base64url) without verifying signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/** Build Authorization header value from a stored JWT. */
export function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/* ─── Requests ─────────────────────────────────────────────────────── */

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? `Server error ${res.status}`
    );
  }

  return data as T;
}

/* ─── Auth endpoints ───────────────────────────────────────────────── */

/**
 * POST /auth/google/verify
 * Verify a Google ID token and receive a server-issued JWT.
 */
export const verifyGoogleToken = (payload: GoogleVerifyPayload) =>
  post<GoogleVerifyResponse>('/auth/google/verify', payload);
