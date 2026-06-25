import type { ApiVipPlan, ApiVipDetail, ApiVipHistory, ApiUserWallet, ApiVipRenewPriceResponse } from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

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
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

const VIP_PREFIX = '/vip';

export async function getVipMe() {
  return await get<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/me`);
}

export async function buyVipPackage(data: { planId: number; voucherCode?: string; durationDays?: number }) {
  return await post<{
    message: string;
    plan: any;
    voucher: any;
    pricing: { original: number; discount: number; final: number };
    wallet_balance: number;
    vip: { level: string; start_at: string; end_at: string; status: string };
  }>('/payments/vip', data);
}

export async function validateVoucher(code: string) {
  return await post<{
    message: string;
    code: number;
    data: {
      exists: boolean;
      valid: boolean;
      reason?: string;
      voucher?: {
        id: number;
        code: string;
        discount_percent: number | null;
        discount_amount: number | null;
        is_active: boolean;
      }
    }
  }>('/voucher/vouchers/validate', { code });
}

export async function getAvailableVouchers() {
  return await get<{
    message: string;
    code: number;
    data: {
      items: Array<{
        id: number;
        code: string;
        discount_percent: number | null;
        discount_amount: number | null;
        is_active: boolean;
        max_uses: number | null;
        used_count: number;
        starts_at: string | null;
        expires_at: string | null;
        metadata: any;
      }>;
      pagination: any;
    };
  }>('/voucher/vouchers', { includeInactive: 'false', pageSize: 50 });
}

export async function renewVipWithCoins(vip_plan_id: number, voucher_code?: string) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
    wallet: { balance_coins: number };
  }>(`${VIP_PREFIX}/renew/coins`, { vip_plan_id, voucher_code });
}

export async function getVipRenewPrice(vip_plan_id: number, voucher_code?: string) {
  return await get<{
    message: string;
    status: number;
    data: ApiVipRenewPriceResponse;
  }>(`${VIP_PREFIX}/renew/price`, { vip_plan_id, voucher_code });
}

export async function getVipRenewPriceByName(vip_name: string, voucher_code?: string) {
  return await get<{
    message: string;
    status: number;
    data: ApiVipRenewPriceResponse;
  }>(`${VIP_PREFIX}/renew/price/by-name`, { vip_name, voucher_code });
}

export async function renewVip(durationDays?: number, payment_method?: string, notes?: string) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/renew`, { durationDays, payment_method, notes });
}

export async function activateVip(vip_level?: string, durationDays?: number, auto_renew?: boolean, payment_method?: string, notes?: string) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/activate`, { vip_level, durationDays, auto_renew, payment_method, notes });
}

export async function cancelVip(notes?: string) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/cancel`, { notes });
}

export async function cancelVipSecure(password?: string, id_token?: string, notes?: string) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/cancel/secure`, { password, id_token, notes });
}

export async function changeAutoRenew(auto_renew: boolean) {
  return await post<{
    message: string;
    status: number;
    vip: ApiVipDetail;
  }>(`${VIP_PREFIX}/auto-renew`, { auto_renew });
}

export async function getVipHistory(page: number = 1, pageSize: number = 20) {
  return await get<{
    message: string;
    status: number;
    data: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      items: ApiVipHistory[];
    };
  }>(`${VIP_PREFIX}/history`, { page, pageSize });
}

export async function getVipPlans(page: number = 1, pageSize: number = 20, includeInactive: boolean = false) {
  return await get<{
    message: string;
    code: number;
    data: {
      items: ApiVipPlan[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    };
  }>(`${VIP_PREFIX}/vip-plans`, { page, pageSize, includeInactive: includeInactive ? 'true' : 'false' });
}

export async function getVipPlanById(id: number) {
  return await get<{
    message: string;
    code: number;
    data: ApiVipPlan;
  }>(`${VIP_PREFIX}/vip-plans/${id}`);
}

export async function createVipPlan(payload: Partial<ApiVipPlan>) {
  return await post<{
    message: string;
    code: number;
    data: ApiVipPlan;
  }>(`${VIP_PREFIX}/vip-plans`, payload);
}

export async function updateVipPlan(id: number, payload: Partial<ApiVipPlan>) {
  // We use fetch directly since api doesn't expose put, or use post if server allows.
  // Wait, I should add 'put' and 'patch' and 'del' helpers at the top.
  const urlStr = `${BASE_URL}${VIP_PREFIX}/vip-plans/${id}`;
  const res = await fetch(urlStr, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

export async function toggleVipPlan(id: number, is_active: boolean) {
  const urlStr = `${BASE_URL}${VIP_PREFIX}/vip-plans/${id}/toggle`;
  const res = await fetch(urlStr, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ is_active }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}

export async function deleteVipPlan(id: number) {
  const urlStr = `${BASE_URL}${VIP_PREFIX}/vip-plans/${id}`;
  const res = await fetch(urlStr, {
    method: 'DELETE',
    headers: { ...authHeaders(), Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}
