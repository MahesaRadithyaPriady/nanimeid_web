import type { ApiWaifu, ApiWaifuVoteCooldownResponse } from '../types';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

const WAIFU_PREFIX = '/waifu';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  let jwt: string | null = null;
  if (token) {
    try {
      jwt = JSON.parse(token);
    } catch {
      jwt = token;
    }
  }
  if (jwt && jwt !== 'null' && jwt !== 'undefined') {
    return { Authorization: `Bearer ${jwt}` };
  }
  return {};
}

async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, String(v));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return data;
}

export async function getWaifuTerms(): Promise<{ status: number; message: string; data: any }> {
  try {
    const res = await get<any>(`${WAIFU_PREFIX}/vote/terms`);
    return { status: res.status ?? 200, message: res.message ?? 'OK', data: res.data ?? res };
  } catch (err: any) {
    throw err;
  }
}

export async function getWaifuList(opts?: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<{
  status: number;
  message: string;
  items: ApiWaifu[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const res = await get<any>(WAIFU_PREFIX, {
    page: opts?.page,
    limit: opts?.limit,
    q: opts?.q,
  });

  return {
    status: res.status ?? 200,
    message: res.message ?? 'OK',
    items: res.items ?? res.data?.items ?? res.data ?? [],
    pagination: res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function getWaifuDetail(id: number): Promise<{ status: number; message: string; data: ApiWaifu }> {
  const res = await get<any>(`${WAIFU_PREFIX}/${id}`);
  return { status: res.status ?? 200, message: res.message ?? 'OK', data: res.data ?? res };
}

export async function voteWaifu(id: number, fingerprint_hash: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${WAIFU_PREFIX}/${id}/vote`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fingerprint_hash }),
  });

  const data = await res.json().catch(() => ({}));
  // Returning the whole response data because we want the status and meta from 409, 429
  return {
    status: res.status,
    ...data
  };
}

export async function checkWaifuCooldown(fingerprint_hash: string): Promise<any> {
  // Similarly, returning the raw fetch response for non-ok to handle 400 safely.
  const url = new URL(`${BASE_URL}${WAIFU_PREFIX}/vote/cooldown`);
  url.searchParams.append('fingerprint_hash', fingerprint_hash);
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json().catch(() => ({}));
  return {
    status: res.status,
    ...data
  };
}
