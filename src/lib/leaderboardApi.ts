import { useAppStore } from '../stores/useAppStore';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

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

// Types
export interface LeaderboardUser {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  vip?: {
    status: string;
    endAt: string;
    vip_level?: string;
  } | null;
  activeAvatarBorder?: {
    id: number;
    code: string;
    title: string;
    imageUrl: string;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  user: LeaderboardUser;
  total_xp: number;
  events_count?: number;
  last_event_at?: string;
}

export interface LeaderboardData {
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  reset_seconds: number;
  cached_at?: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  entries: LeaderboardEntry[];
}

export interface LeaderboardResponse {
  message: string;
  code: number;
  data: LeaderboardData;
}

export interface UserRankPeriod {
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  reset_seconds: number;
  total_xp: number;
  rank: number | null;
  total_users: number;
}

export interface MyLeaderboardData {
  user_id: number;
  activeAvatarBorder?: {
    id: number;
    code: string;
    title: string;
    imageUrl: string;
  } | null;
  daily: UserRankPeriod;
  weekly: UserRankPeriod;
  monthly: UserRankPeriod;
}

export interface MyLeaderboardResponse {
  message: string;
  code: number;
  data: MyLeaderboardData;
}

export interface AvailableMonth {
  year: number;
  month: number;
  label: string;
}

export interface AvailableMonthsResponse {
  message: string;
  code: number;
  data: AvailableMonth[];
}

export interface MonthlySummaryData {
  year: number;
  month: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  entries: LeaderboardEntry[];
}

export interface MonthlySummaryResponse {
  message: string;
  code: number;
  data: MonthlySummaryData;
}

// ENDPOINTS

/**
 * Fetch leaderboard based on period (daily, weekly, monthly)
 */
export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  page: number = 1,
  limit: number = 50
): Promise<LeaderboardResponse> {
  const url = `${BASE_URL}/leaderboard/${period}?page=${page}&limit=${limit}`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch leaderboard');
  return data;
}

/**
 * Fetch personal leaderboard rank and XP for current periods
 */
export async function getMyLeaderboardRank(): Promise<MyLeaderboardResponse> {
  const url = `${BASE_URL}/leaderboard/me`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch personal rank');
  return data;
}

/**
 * Fetch list of available months in monthly summary table
 */
export async function getAvailableMonths(): Promise<AvailableMonthsResponse> {
  const url = `${BASE_URL}/leaderboard/monthly-summary/available-months`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch available months');
  return data;
}

/**
 * Fetch monthly leaderboard from summary table with query options
 */
export async function getMonthlySummary(params: {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}): Promise<MonthlySummaryResponse> {
  const query = new URLSearchParams();
  if (params.year) query.set('year', String(params.year));
  if (params.month) query.set('month', String(params.month));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const url = `${BASE_URL}/leaderboard/monthly-summary?${query.toString()}`;
  const res = await authFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch monthly summary');
  return data;
}
