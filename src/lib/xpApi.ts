/**
 * XP System API client.
 * Endpoints: /xp/me, /xp/levels, /xp/rewards/:id/claim, /xp/levels/:id/claim-all, /xp/vouchers
 */

import { useAppStore } from '../stores/useAppStore';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/* ─── Helpers ─────────────────────────────────────────────────────── */

async function authFetch(url: string, options: RequestInit = {}) {
  const state = useAppStore.getState();
  const token = state.authToken;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

/* ─── Types ───────────────────────────────────────────────────────── */

export interface XpLevelInfo {
  id: number;
  level_number: number;
  xp_required_total: number;
  title: string;
}

export interface XpProgressInfo {
  currentLevelXpRequired: number;
  nextLevelXpRequired: number | null;
  xpToNext: number;
  percent: number;
}

export interface XpMeData {
  user_id: number;
  current_xp: number;
  level_id: number;
  level: XpLevelInfo | null;
  progress: XpProgressInfo;
}

export interface XpReward {
  id: number;
  level_id: number;
  type: 'COIN' | 'VIP_DAYS' | 'VOUCHER';
  coins_amount?: number;
  vip_days?: number;
  voucher_valid_days?: number;
  is_active: boolean;
  claimed: boolean;
}

export interface XpLevelWithRewards extends XpLevelInfo {
  rewards: XpReward[] | null;
}

export interface XpVoucher {
  claim_id: number;
  reward_id: number;
  level_id: number;
  issued_at: string;
  valid_until: string;
  is_active: boolean;
  voucher: {
    discount_percent?: number;
    discount_amount?: number;
    valid_days: number;
  };
}

// XP History types
export interface XpHistoryEntry {
  id: number;
  user_id: number;
  amount: number;
  event_type: 'watch_progress_minute' | 'level_reward' | 'daily_login' | 'event_bonus' | 'admin_adjustment';
  description?: string;
  created_at: string;
  metadata?: {
    episode_id?: number;
    anime_title?: string;
    level_number?: number;
    reward_type?: string;
  };
}

export interface XpStats {
  total_xp_today: number;
  total_xp_this_week: number;
  watch_xp_today: number;
  reward_xp_today: number;
  current_xp_per_minute: number;
  vip_multiplier: number;
  minutes_watched_today: number;
}

export interface ApiResponse<T> {
  message: string;
  code: number;
  data: T;
}

/* ─── Endpoints ───────────────────────────────────────────────────── */

/**
 * GET /xp/me
 * Get current user's XP, level, and progress.
 */
export async function fetchMyXp(): Promise<ApiResponse<XpMeData>> {
  const res = await authFetch(`${BASE_URL}/xp/me`);
  return handleResponse<ApiResponse<XpMeData>>(res);
}

/**
 * GET /xp/levels
 * List all levels with rewards and claimed indicator.
 */
export async function fetchXpLevels(): Promise<ApiResponse<XpLevelWithRewards[]>> {
  const res = await authFetch(`${BASE_URL}/xp/levels`);
  return handleResponse<ApiResponse<XpLevelWithRewards[]>>(res);
}

/**
 * POST /xp/rewards/:rewardId/claim
 * Claim a specific level reward.
 */
export async function claimXpReward(rewardId: number): Promise<ApiResponse<{
  claim_id: number;
  reward: { id: number; level_id: number; type: string };
  appliedEffect: Record<string, unknown>;
}>> {
  const res = await authFetch(`${BASE_URL}/xp/rewards/${rewardId}/claim`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

/**
 * POST /xp/levels/:levelId/claim-all
 * Claim all active rewards at a specific level.
 */
export async function claimAllLevelRewards(levelId: number): Promise<ApiResponse<{
  level_id: number;
  claimedCount: number;
  totalRewards: number;
  skippedAlreadyClaimed: number[];
  results: Array<{
    reward_id: number;
    claim_id?: number;
    status: string;
    appliedEffect?: Record<string, unknown>;
    reason?: string;
  }>;
}>> {
  const res = await authFetch(`${BASE_URL}/xp/levels/${levelId}/claim-all`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

/**
 * GET /xp/vouchers
 * Get user's vouchers from claimed VOUCHER rewards.
 */
export async function fetchMyVouchers(onlyActive = false): Promise<ApiResponse<XpVoucher[]>> {
  const query = onlyActive ? '?onlyActive=true' : '';
  const res = await authFetch(`${BASE_URL}/xp/vouchers${query}`);
  return handleResponse<ApiResponse<XpVoucher[]>>(res);
}

/**
 * GET /xp/history
 * Get user's XP transaction history.
 */
export async function fetchXpHistory(limit = 50, offset = 0): Promise<ApiResponse<XpHistoryEntry[]>> {
  const res = await authFetch(`${BASE_URL}/xp/history?limit=${limit}&offset=${offset}`);
  return handleResponse<ApiResponse<XpHistoryEntry[]>>(res);
}

/**
 * GET /xp/stats
 * Get user's XP statistics.
 */
export async function fetchXpStats(): Promise<ApiResponse<XpStats>> {
  const res = await authFetch(`${BASE_URL}/xp/stats`);
  return handleResponse<ApiResponse<XpStats>>(res);
}
