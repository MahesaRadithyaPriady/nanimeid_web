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

export interface WatchLiteProgressResponse {
  status: number;
  message: string;
  data: {
    recorded: boolean;
    throttled: boolean;
    server_time?: string;
    next_tick_in_ms?: number;
    next_tick_in_s?: number;
    next_tick_at?: string;
    today_stats?: {
      seconds_watched: number;
      minutes_watched: number;
    };
  };
}

// Watch Tick API types
export interface WatchTickRequest {
  seconds?: number;
  completed_episode?: boolean;
}

export interface WatchTickResponse {
  status: number;
  message: string;
  data: {
    tick: {
      seconds_requested: number;
      seconds_verified: number;
      seconds_rewarded: number;
      seconds_accumulated: number;
      seconds_until_next_reward: number;
      is_first_tick?: boolean;
      total_seconds_today: number;
      total_minutes_today: number;
      episodes_watched_today?: number;
      completed_episode?: boolean;
    };
    xp: {
      gained_this_tick: number;
      gained_leaderboard_this_tick: number;
      current_xp: number;
      vip_tier: 'NONE' | 'BRONZE' | 'GOLD' | 'DIAMOND' | 'MASTER';
      is_vip: boolean;
      xp_per_minute: number;
      level: {
        level_number: number;
        title: string;
        xp_required_total: number;
      } | null;
      progress: {
        current_level_xp_required: number;
        next_level_xp_required: number | null;
        xp_to_next: number;
        percent_to_next: number;
      };
    };
    coin: {
      gained_this_tick: number;
      coin_per_minute: number;
      balance: number;
    };
    watch_reward?: {
      config_active: boolean;
      minutes_today: number;
      reached_tiers: Array<{
        id: string;
        minutes_required: number;
        coin_reward: number;
        claimed: boolean;
      }>;
      pending_coins: number;
      total_coins_available: number;
      next_tier: {
        id: string;
        minutes_required: number;
        coin_reward: number;
        minutes_remaining: number;
      } | null;
    };
    leaderboard?: {
      rank_today: number;
      xp_today: number;
      xp_leaderboard_per_minute: number;
    };
  };
}

/**
 * Send heartbeat progress for watch lite.
 * Endpoint: POST /watch-lite/progress
 * Body is empty — server grants XP once per real minute (idempotent).
 */
export async function postWatchLiteProgress(): Promise<WatchLiteProgressResponse> {
  const url = `${BASE_URL}/watch-lite/progress`;
  const res = await authFetch(url, { method: 'POST', body: JSON.stringify({}) });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Failed to sync watch progress (${res.status})`);
  }
  return data;
}

/**
 * Send watch tick for episode-based XP tracking.
 * Endpoint: POST /episode/:episodeId/watch-tick
 * Returns compound reward summary (XP, coins, level, watch rewards, leaderboard).
 */
export async function postWatchTick(
  episodeId: number | string,
  body: WatchTickRequest = { seconds: 60 }
): Promise<WatchTickResponse> {
  const url = `${BASE_URL}/episode/${episodeId}/watch-tick`;
  const res = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Watch tick failed (${res.status})`);
  }
  return data;
}
