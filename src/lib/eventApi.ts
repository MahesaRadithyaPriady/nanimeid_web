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
export interface SignInEventConfig {
  id: number;
  is_active: boolean;
  days_total: number;
  daily_coin_rewards: number[];
  daily_reward_types: string[];
  daily_reward_ids: number[];
  starts_at: string | null;
  ends_at: string | null;
}

export interface SignInProgress {
  user_id: number;
  current_day: number;
  last_claimed_at: string | null;
  streak_started_at: string | null;
  can_claim_today: boolean;
  claimed_today?: boolean;
}

export interface GrantedReward {
  type: string;
  id?: number;
  asset?: {
    name: string;
    image_url: string;
  };
}

export interface WatchTier {
  id?: string;
  minutes?: number;
  episodes?: number;
  coin_reward: number;
  reward_type: string;
  reward_id: number;
}

export interface WatchEventConfig {
  id: number;
  is_active: boolean;
  daily_reset: boolean;
  thresholds: WatchTier[];
}

export interface WatchProgress {
  user_id: number;
  seconds_watched_today?: number;
  minutes_watched_today: number;
  episodes_watched_today: number;
  last_reset_date: string | null;
  claimed_today: boolean;
  claimed_tiers: string[];
}

// ENDPOINTS

export async function getSignInStatus() {
  const res = await authFetch(`${BASE_URL}/events/sign-in`);
  return res.json();
}

export async function getSignInProgress() {
  const res = await authFetch(`${BASE_URL}/events/sign-in/progress`);
  return res.json();
}

export async function claimSignIn() {
  const res = await authFetch(`${BASE_URL}/events/sign-in/claim`, {
    method: 'POST',
  });
  return res.json();
}

export async function getWatchStatus() {
  const res = await authFetch(`${BASE_URL}/events/watch`);
  return res.json();
}

export async function claimWatchTier(payload: { tier_index?: number; tier_id?: string }) {
  const res = await authFetch(`${BASE_URL}/events/watch/claim`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getWatchProgress() {
  const res = await authFetch(`${BASE_URL}/events/watch/progress`);
  return res.json();
}
