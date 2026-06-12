import type {
  ApiUserProfile,
  ApiUserSearchItem,
  ApiProfileCommentItem,
  ApiProfileWatchedItem,
  ApiProfileCompletedItem,
  ApiProfileStreak,
} from '../types';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

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
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  let headers: Record<string, string> = { ...authHeaders(), Accept: 'application/json' };
  let res = await fetch(url.toString(), { headers });

  if (res.status === 401 && headers.Authorization) {
    console.warn('Unauthorized token, retrying request without token...');
    headers = { Accept: 'application/json' };
    res = await fetch(url.toString(), { headers });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Server error ${res.status}`);
  }
  return data as T;
}

async function sendRequest<T>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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

function unwrapData<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

function normalizeUserProfile(payload: any): ApiUserProfile {
  const root = unwrapData<any>(payload) ?? {};
  const user = root.user ?? {};
  const profile = root.profile ?? {};
  const id = root.id ?? user.id ?? profile.user_id ?? profile.id ?? 0;
  const username = root.username ?? user.username ?? profile.username ?? '';
  const accountCreatedAt =
    root.account_created_at ?? user.createdAt ?? root.createdAt ?? profile.createdAt ?? undefined;

  return {
    ...root,
    id,
    username,
    account_created_at: accountCreatedAt,
    user: user.id || user.username ? { id: user.id ?? id, username: user.username ?? username, createdAt: user.createdAt } : { id, username },
    profile: {
      ...profile,
      id: profile.id ?? root.profile?.id ?? undefined,
      user_id: profile.user_id ?? id,
    },
  };
}

function normalizeSearchItem(item: any): ApiUserSearchItem {
  const user = item.user ?? {};
  const profile = item.profile ?? {};
  const id = item.id ?? user.id ?? profile.user_id ?? 0;
  const username = item.username ?? user.username ?? '';

  return {
    ...item,
    id,
    username,
    user: user.id || user.username ? { id: user.id ?? id, username: user.username ?? username } : { id, username },
    profile: {
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      bio: profile.bio ?? null,
    },
  };
}

function normalizeAnimeRef(anime: any): any {
  if (!anime) return undefined;
  return {
    ...anime,
    id: anime.id,
    nama_anime: anime.nama_anime ?? anime.title ?? null,
    title: anime.title ?? anime.nama_anime ?? null,
    gambar_anime: anime.gambar_anime ?? anime.poster_url ?? anime.image_url ?? anime.cover_url ?? anime.cover ?? null,
    poster_url: anime.poster_url ?? anime.gambar_anime ?? anime.image_url ?? anime.cover_url ?? anime.cover ?? null,
  };
}

function normalizeEpisodeRef(episode: any): any {
  if (!episode) return undefined;
  const anime = normalizeAnimeRef(episode.anime);
  return {
    ...episode,
    id: episode.id,
    nomor_episode: episode.nomor_episode ?? episode.episode_number ?? null,
    episode_number: episode.episode_number ?? episode.nomor_episode ?? null,
    judul_episode: episode.judul_episode ?? episode.episode_title ?? episode.title ?? episode.nama_episode ?? null,
    title: episode.title ?? episode.judul_episode ?? episode.episode_title ?? episode.nama_episode ?? null,
    nama_episode: episode.nama_episode ?? episode.judul_episode ?? episode.episode_title ?? episode.title ?? null,
    episode_title: episode.episode_title ?? episode.judul_episode ?? episode.title ?? episode.nama_episode ?? null,
    anime,
  };
}

function normalizeCommentItem(item: any): ApiProfileCommentItem {
  return {
    ...item,
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    created_at: item.created_at ?? item.createdAt,
    anime_id: item.anime_id ?? item.anime?.id ?? null,
    episode_id: item.episode_id ?? item.episode?.id ?? null,
    anime: item.anime
      ? {
          id: item.anime.id,
          nama_anime: item.anime.nama_anime ?? item.anime.title ?? null,
          title: item.anime.title ?? item.anime.nama_anime ?? null,
          poster_url: item.anime.poster_url ?? item.anime.gambar_anime ?? null,
          gambar_anime: item.anime.gambar_anime ?? item.anime.poster_url ?? null,
        }
      : undefined,
    episode: item.episode ? normalizeEpisodeRef(item.episode) : undefined,
  };
}

function normalizeWatchedItem(item: any): ApiProfileWatchedItem {
  const anime = normalizeAnimeRef(item.anime);
  const episode = normalizeEpisodeRef(item.episode);
  const timestamp = item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at ?? item.watched_at ?? new Date().toISOString();

  return {
    ...item,
    progress_watching: item.progress_watching ?? item.current_second ?? 0,
    current_second: item.current_second ?? item.progress_watching ?? 0,
    updatedAt: timestamp,
    updated_at: item.updated_at ?? timestamp,
    createdAt: item.createdAt ?? item.created_at ?? timestamp,
    created_at: item.created_at ?? item.createdAt ?? timestamp,
    watched_at: item.watched_at ?? timestamp,
    anime,
    episode,
  };
}

function normalizeCompletedItem(item: any): ApiProfileCompletedItem['episodes'][number] {
  const anime = normalizeAnimeRef(item.anime);
  const episode = normalizeEpisodeRef(item.episode);
  const timestamp = item.last_watched ?? item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at ?? item.watched_at ?? new Date().toISOString();

  return {
    ...item,
    total_watched_seconds: item.total_watched_seconds ?? 0,
    duration_seconds: item.duration_seconds ?? item.episode?.duration_seconds ?? item.episode?.durasi_episode ?? undefined,
    is_completed_flag: item.is_completed_flag ?? item.meets_threshold ?? false,
    meets_threshold: item.meets_threshold ?? item.is_completed_flag ?? false,
    last_watched: item.last_watched ?? timestamp,
    updatedAt: item.updatedAt ?? timestamp,
    updated_at: item.updated_at ?? timestamp,
    createdAt: item.createdAt ?? item.created_at ?? timestamp,
    created_at: item.created_at ?? item.createdAt ?? timestamp,
    watched_at: item.watched_at ?? timestamp,
    anime,
    episode,
  };
}

function normalizeStreak(payload: any): ApiProfileStreak {
  const root = unwrapData<any>(payload) ?? {};
  return {
    current_streak: root.current_streak ?? 0,
    max_streak: root.max_streak ?? root.longest_streak ?? 0,
    total_claims: root.total_claims ?? 0,
    year: root.year,
    month: root.month,
    claim_dates: root.claim_dates ?? [],
    longest_streak: root.longest_streak ?? root.max_streak ?? 0,
    last_sign_in: root.last_sign_in ?? root.claim_dates?.[root.claim_dates.length - 1] ?? null,
  };
}

/* Profile API Methods */

export async function fetchMyProfile(): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  const res = await get<any>('/profile/me');
  const payload = res.data ?? res;
  return { status: res.status, message: res.message, data: normalizeUserProfile(payload) };
}

export async function updateMyProfile(body: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  banner_profile_img?: string;
  bio?: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
}): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  const res = await sendRequest<any>('PUT', '/profile/me', body);
  const payload = res.data ?? res;
  return { status: res.status, message: res.message, data: normalizeUserProfile(payload) };
}

export async function deleteMyProfile(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('DELETE', '/profile/me');
}

export async function checkBirthdateStatus(): Promise<{ status: number; message: string; is_set: boolean }> {
  return get<{ status: number; message: string; is_set: boolean }>('/profile/me/birthdate-status');
}

export async function setOnlineStatus(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('PUT', '/profile/me/online');
}

export async function setOfflineStatus(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('PUT', '/profile/me/offline');
}

export async function uploadAvatar(file: File): Promise<{ status: number; message: string; profile?: ApiUserProfile }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${BASE_URL}/profile/me/avatar`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      Accept: 'application/json',
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return { ...data, profile: data.profile ? normalizeUserProfile(data.profile) : undefined };
}

export async function uploadBanner(file: File): Promise<{ status: number; message: string; profile?: ApiUserProfile }> {
  const formData = new FormData();
  formData.append('banner', file);

  const res = await fetch(`${BASE_URL}/profile/me/banner`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      Accept: 'application/json',
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return { ...data, profile: data.profile ? normalizeUserProfile(data.profile) : undefined };
}

export async function searchUsers(opts: {
  q: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; message: string; data: ApiUserSearchItem[]; total?: number; page?: number; limit?: number }> {
  const res = await get<any>('/profile/search', {
    q: opts.q,
    page: opts.page,
    limit: opts.limit,
  });
  const rawItems = res.items ?? res.data?.items ?? res.data ?? [];
  const mapped = Array.isArray(rawItems) ? rawItems.map(normalizeSearchItem) : [];

  return { status: res.status, message: res.message, data: mapped, total: res.total, page: res.page, limit: res.limit };
}

export async function fetchPublicProfile(userId: number | string): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  const res = await get<any>(`/profile/${userId}`);
  const payload = res.data ?? res;
  return { status: res.status, message: res.message, data: normalizeUserProfile(payload) };
}

export async function fetchProfileComments(
  userId: number | string
): Promise<{ status: number; message: string; data: ApiProfileCommentItem[] }> {
  const res = await get<any>(`/profile/${userId}/comments`);
  const payload = res.data ?? res;
  const comments = payload.comments ?? payload.data?.comments ?? [];
  return { status: res.status, message: res.message, data: Array.isArray(comments) ? comments.map(normalizeCommentItem) : [] };
}

export async function fetchProfileSignInStreak(
  userId: number | string
): Promise<{ status: number; message: string; data: ApiProfileStreak | null }> {
  const res = await get<any>(`/profile/${userId}/sign-in-streak`);
  return { status: res.status, message: res.message, data: normalizeStreak(res) };
}

export async function fetchProfileRecentWatched(
  userId: number | string
): Promise<{ status: number; message: string; data: ApiProfileWatchedItem[] }> {
  const res = await get<any>(`/profile/${userId}/recent-watched`);
  const payload = res.data ?? res;
  const watched = payload.watched ?? payload.data?.watched ?? [];
  return { status: res.status, message: res.message, data: Array.isArray(watched) ? watched.map(normalizeWatchedItem) : [] };
}

export async function fetchProfileCompletedEpisodes(
  userId: number | string
): Promise<{ status: number; message: string; data: { count: number; episodes: ApiProfileCompletedItem['episodes'] } }> {
  const res = await get<any>(`/profile/${userId}/completed-episodes-today`);
  const payload = res.data ?? res;
  const episodes = payload.episodes ?? payload.data?.episodes ?? [];
  return {
    status: res.status,
    message: res.message,
    data: {
      count: payload.count ?? 0,
      episodes: Array.isArray(episodes) ? episodes.map(normalizeCompletedItem) : [],
    },
  };
}
