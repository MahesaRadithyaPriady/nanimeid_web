import type { ApiAnime, ApiEpisode } from '../types';
import { authHeaders, authFetch } from './authFetch';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Server error ${res.status}`;
    const err = new Error(errorMsg) as any;
    err.code = data.code || errorMsg;
    err.details = data.details || null;
    throw err;
  }
  return data as T;
}

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const res = await authFetch(url.toString(), {
    headers: {
      ...authHeaders(),
      Accept: 'application/json',
    },
  });
  return handleResponse<T>(res);
}

async function sendRequest<T>(
  method: 'POST' | 'PUT' | 'DELETE',
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
  return handleResponse<T>(res);
}

export interface WatchPartySession {
  id: number;
  code: string;
  host_user_id: number;
  anime_id: number | null;
  episode_id: number | null;
  quality: string | null;
  status: 'ACTIVE' | 'ENDED';
  access_mode: 'PUBLIC' | 'PRIVATE' | 'FRIENDS' | 'FOLLOWERS';
  is_locked: boolean;
  is_host?: boolean;
  can_manage_room?: boolean;
  has_password?: boolean;
  current_time: number;
  is_paused: boolean;
  createdAt: string;
  updatedAt: string;
  viewer_count?: number;
  anime?: {
    id: number;
    nama_anime: string;
    gambar_anime: string;
    status_anime?: string;
    label_anime?: string;
  } | null;
  episode?: {
    id: number;
    anime_id: number;
    nomor_episode: number;
    judul_episode: string;
  } | null;
}

export interface JoinSessionResponse {
  ok: boolean;
  session: WatchPartySession;
  role: 'host' | 'member';
  is_host: boolean;
}

export interface ListSessionsResponse {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  sessions: WatchPartySession[];
}

export interface AnimeDetailsResponse {
  ok: boolean;
  anime: ApiAnime;
  episodes: Array<
    ApiEpisode & {
      qualities: Array<{
        id: number;
        nama_quality: string;
        source_quality: string;
      }>;
    }
  >;
}

export interface ChatMessage {
  id: number | string;
  user_id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  message: string;
  kind: 'TEXT' | 'STICKER' | 'IMAGE';
  image_url?: string;
  sticker?: string | number;
  createdAt: string;
}

export const watchPartyApi = {
  /** POST /watchparty/v2/sessions */
  createSession: (body: {
    anime_id?: number;
    episode_id?: number;
    quality?: string;
    access_mode?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS' | 'FOLLOWERS';
    password?: string;
  }) => sendRequest<{ ok: boolean; session: WatchPartySession }>('POST', '/watchparty/v2/sessions', body),

  /** GET /watchparty/v2/anime/:id */
  getAnimeDetails: (id: number | string) => get<AnimeDetailsResponse>(`/watchparty/v2/anime/${id}`),

  /** POST /watchparty/v2/sessions/:code/join */
  joinSession: (code: string, body?: { password?: string }) =>
    sendRequest<JoinSessionResponse>('POST', `/watchparty/v2/sessions/${code}/join`, body),

  /** GET /watchparty/v2/sessions/search */
  searchSessions: (params: { q?: string; query?: string; host?: string; host_name?: string; limit?: number }) =>
    get<{ ok: boolean; total: number; sessions: WatchPartySession[] }>('/watchparty/v2/sessions/search', params),

  /** GET /watchparty/v2/sessions/visited */
  getVisitedSessions: () => get<{ ok: boolean; total: number; rooms: WatchPartySession[] }>('/watchparty/v2/sessions/visited'),

  /** POST /watchparty/v2/sessions/:code/switch-episode */
  switchEpisode: (
    code: string,
    body: {
      episode_id: number;
      quality?: string;
      anime_id?: number;
      reset_time?: boolean;
    }
  ) =>
    sendRequest<{
      ok: boolean;
      session: WatchPartySession;
      media: {
        anime: any;
        episode: any;
        quality: string;
        url: string;
        current_time: number;
        is_paused: boolean;
      };
    }>('POST', `/watchparty/v2/sessions/${code}/switch-episode`, body),

  /** POST /watchparty/v2/sessions/:code/kick/:userId */
  kickParticipant: (code: string, userId: number) =>
    sendRequest<{ ok: boolean; removed: boolean; member: any }>('POST', `/watchparty/v2/sessions/${code}/kick/${userId}`),

  /** GET /watchparty/v2/sessions/:code */
  getSessionDetails: (code: string) => get<{ ok: boolean; session: WatchPartySession }>(`/watchparty/v2/sessions/${code}`),

  /** GET /watchparty/v2/sessions */
  listSessions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    mine?: boolean;
    only_public?: boolean;
    access_mode?: string;
    anime_id?: number;
    episode_id?: number;
  }) => get<ListSessionsResponse>('/watchparty/v2/sessions', params),

  /** POST /watchparty/v2/sessions/:code/lock */
  lockSession: (code: string, body: { access_mode?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS' | 'FOLLOWERS'; password?: string }) =>
    sendRequest<{ ok: boolean; session: WatchPartySession }>('POST', `/watchparty/v2/sessions/${code}/lock`, body),

  /** POST /watchparty/v2/sessions/:code/end */
  endSession: (code: string) => sendRequest<{ ok: boolean; session: WatchPartySession }>('POST', `/watchparty/v2/sessions/${code}/end`),

  /** POST /watchparty/v2/sessions/:code/leave */
  leaveSession: (code: string) =>
    sendRequest<{ ok: boolean; removed: boolean; ended?: boolean }>('POST', `/watchparty/v2/sessions/${code}/leave`),

  /** POST /watchparty/v2/sessions/:code/chat (Multi-part upload for image, fallback for text/sticker) */
  sendChatMessage: async (
    code: string,
    body: {
      kind: 'TEXT' | 'STICKER' | 'IMAGE';
      message?: string;
      sticker_id?: number;
      image?: File;
    }
  ) => {
    let headers: Record<string, string> = { ...authHeaders(), Accept: 'application/json' };
    let requestBody: any;

    if (body.kind === 'IMAGE' && body.image) {
      const formData = new FormData();
      formData.append('kind', 'IMAGE');
      formData.append('image', body.image);
      requestBody = formData;
      // Do not set Content-Type header so browser sets appropriate multipart boundary
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}/watchparty/v2/sessions/${code}/chat`, {
      method: 'POST',
      headers,
      body: requestBody,
    });
    return handleResponse<{ ok: boolean; message: ChatMessage }>(res);
  },
};
