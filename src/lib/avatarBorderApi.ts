import type {
  ApiAvatarBorderCatalogResponse,
  ApiAvatarBorderMeResponse,
  ApiAvatarBorderActiveResponse,
  ApiAvatarBorderVipEligibilityResponse,
} from '../types';
import { authHeaders, authFetch } from './authFetch';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await authFetch(`${BASE_URL}${path}`, {
    headers: { ...authHeaders(), Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Server error ${res.status}`);
  }
  return data as T;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await authFetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return data as T;
}

export async function fetchAvatarBorderCatalog(): Promise<ApiAvatarBorderCatalogResponse> {
  return get<ApiAvatarBorderCatalogResponse>('/avatar-borders/catalog');
}

export async function fetchMyAvatarBorders(): Promise<ApiAvatarBorderMeResponse> {
  return get<ApiAvatarBorderMeResponse>('/avatar-borders/me');
}

export async function fetchActiveAvatarBorder(): Promise<ApiAvatarBorderActiveResponse> {
  return get<ApiAvatarBorderActiveResponse>('/avatar-borders/active');
}

export async function setActiveAvatarBorder(border_id: number): Promise<{ status: number; message: string }> {
  return post<{ status: number; message: string }>('/avatar-borders/active', { border_id });
}

export async function disableActiveAvatarBorder(): Promise<{ status: number; message: string }> {
  return post<{ status: number; message: string }>('/avatar-borders/active/disable');
}

export async function checkAvatarBorderVipEligibility(): Promise<ApiAvatarBorderVipEligibilityResponse> {
  return get<ApiAvatarBorderVipEligibilityResponse>('/avatar-borders/vip/eligibility');
}

export async function purchaseAvatarBorder(border_id: number): Promise<{ status: number; message: string }> {
  return post<{ status: number; message: string }>('/avatar-borders/purchase', { border_id });
}
