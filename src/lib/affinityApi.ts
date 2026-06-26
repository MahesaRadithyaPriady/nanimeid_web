import type {
  ApiAffinityRecord,
  ApiAffinitySummary,
  AffinityRelationType,
  AffinityStatus
} from '../types';
import { authHeaders, authFetch } from './authFetch';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const res = await authFetch(url.toString(), {
    headers: { ...authHeaders(), Accept: 'application/json' },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Server error ${res.status}`);
  }
  return data as T;
}

async function sendRequest<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  const res = await authFetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return data as T;
}

export async function fetchPublicAffinities(userId: number | string): Promise<{ success: boolean; message: string; data: ApiAffinityRecord[] }> {
  return get<{ success: boolean; message: string; data: ApiAffinityRecord[] }>(`/users/${userId}/affinities`);
}

export async function fetchAffinitySummary(userId: number | string): Promise<{ success: boolean; message: string; data: ApiAffinitySummary }> {
  return get<{ success: boolean; message: string; data: ApiAffinitySummary }>(`/users/${userId}/affinities/summary`);
}

export async function fetchMyAffinities(opts?: { status?: AffinityStatus; direction?: 'sent' | 'received' | 'all' }): Promise<{ success: boolean; message: string; data: ApiAffinityRecord[] }> {
  return get<{ success: boolean; message: string; data: ApiAffinityRecord[] }>(`/user/affinities`, opts);
}

export async function requestAffinity(targetUserId: number, relationType: AffinityRelationType): Promise<{ success: boolean; message: string; data: ApiAffinityRecord }> {
  return sendRequest<{ success: boolean; message: string; data: ApiAffinityRecord }>('POST', `/user/affinities`, { target_user_id: targetUserId, relation_type: relationType });
}

export async function respondAffinity(affinityId: number | string, status: 'ACCEPTED' | 'REJECTED'): Promise<{ success: boolean; message: string; data: any }> {
  return sendRequest<{ success: boolean; message: string; data: any }>('PATCH', `/user/affinities/${affinityId}`, { status });
}

export async function deleteAffinity(affinityId: number | string): Promise<{ success: boolean; message: string; data: any }> {
  return sendRequest<{ success: boolean; message: string; data: any }>('DELETE', `/user/affinities/${affinityId}`);
}
