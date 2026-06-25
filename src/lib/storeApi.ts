import type {
  ApiStoreItem,
  ApiUserWallet,
  ApiUserBadge,
  ApiUserSuperBadge,
  ApiCoinTransaction,
  ApiCashoutRequest,
  ApiSticker,
  ApiSuperBadgeCatalog,
  ApiQrisInfo,
  ApiQrisRequest,
  ApiBadgeCatalogResponse,
  ApiBadgeCatalogItem,
  ApiBadgeMineItem,
  ApiBadgeActiveResponse,
} from '../types';
import { useAppStore } from '../stores/useAppStore';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
const STORE_PREFIX = '/store';
const ROOT_URL = (() => {
  try { return new URL(BASE_URL).origin; } catch { return BASE_URL; }
})();

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

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const urlStr = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const url = new URL(urlStr);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    headers: { ...authHeaders(), Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

async function post<T>(path: string, body: any): Promise<T> {
  const urlStr = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(urlStr, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || `Server error ${res.status}`);
    error.alreadyOwned = data.alreadyOwned;
    throw error;
  }
  return data;
}

async function patch<T>(path: string, body: any): Promise<T> {
  const urlStr = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(urlStr, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

// ----------------------------------------------------------------------
// 1. Wallet Management
// ----------------------------------------------------------------------

export async function getWallet(): Promise<ApiUserWallet> {
  return await get<ApiUserWallet>(`${STORE_PREFIX}/wallet`);
}

export async function earnCoins(ref: string = 'manual_claim'): Promise<ApiUserWallet> {
  const userId = useAppStore.getState().userProfile?.id || localStorage.getItem('user_id');
  return await post<ApiUserWallet>(`${STORE_PREFIX}/wallet/earn`, { userId, ref });
}

export async function getCoinTransactions(page = 1, limit = 20) {
  return await get<{
    data: ApiCoinTransaction[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`${STORE_PREFIX}/coins/transactions`, { page, limit });
}

// ----------------------------------------------------------------------
// 2. VIP & Store Items
// ----------------------------------------------------------------------

export async function checkVipEligibility() {
  return await get<any>(`${STORE_PREFIX}/vip/eligibility`);
}

export async function getStoreItems() {
  return await get<{
    status: number;
    message: string;
    data: ApiStoreItem[];
    total: number;
  }>(`${STORE_PREFIX}/items`);
}

export async function getCoinPacks() {
  return await get<{
    status: number;
    message: string;
    data: ApiStoreItem[];
    total: number;
  }>(`${STORE_PREFIX}/coins/packs`);
}

export async function purchaseVip(itemId: number) {
  return await post<any>(`${STORE_PREFIX}/purchase/vip`, { itemId });
}

// ----------------------------------------------------------------------
// 3. Badges
// ----------------------------------------------------------------------

export async function purchaseBadge(itemId: number, type: 'BADGE' | 'SUPERBADGE' = 'BADGE') {
  return await post<any>(`${STORE_PREFIX}/purchase/badge`, { itemId, type });
}

export async function getUserBadges(): Promise<ApiUserBadge[]> {
  const res = await get<any>(`${STORE_PREFIX}/badges`);
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function getActiveBadge() {
  return await get<any>(`${STORE_PREFIX}/badges/active`);
}

export async function activateBadge(badgeName: string) {
  return await post<any>(`${STORE_PREFIX}/badges/activate`, { badgeName });
}

export async function deactivateBadge() {
  return await post<any>(`${STORE_PREFIX}/badges/deactivate`, {});
}

// Tambahan: Activate/Deactivate One
export async function activateOneBadge(badgeName: string) {
  return await post<any>(`${STORE_PREFIX}/badges/activate-one`, { badgeName });
}

export async function deactivateOneBadge(badgeName: string) {
  return await post<any>(`${STORE_PREFIX}/badges/deactivate-one`, { badgeName });
}

// ----------------------------------------------------------------------
// 4. Superbadges
// ----------------------------------------------------------------------

export async function getSuperbadges() {
  return await get<{
    status: number;
    message: string;
    data: ApiSuperBadgeCatalog[];
  }>(`${STORE_PREFIX}/superbadges`);
}

export async function getActiveSuperbadge() {
  return await get<any>(`${STORE_PREFIX}/superbadges/active`);
}

export async function activateSuperbadge(badgeId: number) {
  return await post<any>(`${STORE_PREFIX}/superbadges/activate`, { badgeId });
}

export async function deactivateSuperbadge() {
  return await post<any>(`${STORE_PREFIX}/superbadges/deactivate`, {});
}

// ----------------------------------------------------------------------
// 5. Stickers
// ----------------------------------------------------------------------

export async function getStickers() {
  return await get<{
    status: number;
    message: string;
    data: ApiSticker[];
  }>(`${STORE_PREFIX}/stickers`);
}

export async function purchaseSticker(itemId: number) {
  return await post<any>(`${STORE_PREFIX}/purchase/sticker`, { itemId });
}

export async function checkStoreVipEligibility() {
  return await get<any>(`${STORE_PREFIX}/vip/eligibility`);
}

// ----------------------------------------------------------------------
// 5b. Badge Catalog (Collection)
// ----------------------------------------------------------------------

export async function getBadgeCatalog(): Promise<ApiBadgeCatalogItem[]> {
  const res = await get<ApiBadgeCatalogResponse>(`${STORE_PREFIX}/badges/catalog`);
  return res?.data ?? [];
}

export async function getMyBadges(): Promise<ApiBadgeMineItem[]> {
  const res = await get<any>(`${STORE_PREFIX}/badges/mine`);
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function getActiveBadges(): Promise<ApiBadgeMineItem[] | null> {
  const res = await get<ApiBadgeActiveResponse>(`${STORE_PREFIX}/badges/active`);
  return res?.data ?? null;
}

// ----------------------------------------------------------------------
// 6. Cashout
// ----------------------------------------------------------------------

export async function requestCashout(payload: { coins: number; payoutMethod: string; payoutAddress: string }) {
  return await post<ApiCashoutRequest>(`${ROOT_URL}/store/cashout`, payload);
}

export async function getCashoutRequests(page = 1, limit = 20) {
  return await get<{
    data: ApiCashoutRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`${ROOT_URL}/store/cashout/requests`, { page, limit });
}

// Khusus Admin
export async function updateCashoutStatus(id: number, status: 'APPROVED' | 'REJECTED') {
  return await patch<ApiCashoutRequest>(`${ROOT_URL}/store/cashout/${id}`, { status });
}

// ----------------------------------------------------------------------
// 7. Avatar Borders
// ----------------------------------------------------------------------

export async function getStoreBorders() {
  return await get<{
    status: number;
    message: string;
    user_preview: any;
    total: number;
    data: any[];
  }>(`${STORE_PREFIX}/borders`);
}

export async function purchaseStoreBorder(border_id: number) {
  return await post<any>(`${STORE_PREFIX}/borders/purchase`, { border_id });
}

// Khusus Admin
export async function processCashout(requestId: number, action: 'APPROVE' | 'REJECT', notes?: string) {
  return await post<ApiCashoutRequest>(`${ROOT_URL}/store/cashout/${requestId}/process`, { action, notes });
}

// ----------------------------------------------------------------------
// 8. Manual QRIS Topup
// ----------------------------------------------------------------------

export async function getQrisLogo() {
  return await get<{ message: string; qris: ApiQrisInfo }>(`/payments/manual/qris/logo`);
}

export async function createQrisRequest(payload: { amount: number; note?: string }) {
  // Can throw 409 error with `QRIS_ACTIVE_REQUEST_EXISTS` and `data` containing active request
  return await post<{ message: string; data: ApiQrisRequest; code?: string }>(`/payments/manual/qris/requests`, payload);
}

export async function uploadQrisProof(requestId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('auth_token');
  let jwt: string | null = null;
  if (token) {
    try { jwt = JSON.parse(token); } catch { jwt = token; }
  }
  
  const res = await fetch(`${BASE_URL}/payments/manual/qris/requests/${requestId}/proof`, {
    method: 'POST',
    headers: (jwt && jwt !== 'null') ? { Authorization: `Bearer ${jwt}` } : {},
    body: formData
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

export async function getQrisRequests(page = 1, limit = 20) {
  return await get<{
    message: string;
    items: ApiQrisRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/payments/manual/qris/requests`, { mine: 'true', page, limit });
}
