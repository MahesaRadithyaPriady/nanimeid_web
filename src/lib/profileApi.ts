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
    throw new Error(
      (data as { message?: string }).message ?? `Server error ${res.status}`
    );
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

/* ═══════════════════════════════════════════════════════════════════ */
/* Profile API Methods                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

/** GET /profile/me (Auth) - Get current user profile */
export async function fetchMyProfile(): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  return get<{ status: number; message: string; data: ApiUserProfile }>('/profile/me');
}

/** PUT /profile/me (Auth) - Update current user profile */
export async function updateMyProfile(body: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  banner_profile_img?: string;
  bio?: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
}): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  return sendRequest<{ status: number; message: string; data: ApiUserProfile }>('PUT', '/profile/me', body);
}

/** DELETE /profile/me (Auth) - Delete current user profile */
export async function deleteMyProfile(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('DELETE', '/profile/me');
}

/** GET /profile/me/birthdate-status (Auth) - Check if birthdate is set */
export async function checkBirthdateStatus(): Promise<{ status: number; message: string; is_set: boolean }> {
  return get<{ status: number; message: string; is_set: boolean }>('/profile/me/birthdate-status');
}

/** PUT /profile/me/online (Auth) - Set status to online */
export async function setOnlineStatus(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('PUT', '/profile/me/online');
}

/** PUT /profile/me/offline (Auth) - Set status to offline */
export async function setOfflineStatus(): Promise<{ status: number; message: string }> {
  return sendRequest<{ status: number; message: string }>('PUT', '/profile/me/offline');
}

/** PUT /profile/me/avatar (Auth) - Upload custom avatar (Multipart form-data) */
export async function uploadAvatar(file: File): Promise<{ status: number; message: string; data: { avatar_url: string } }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${BASE_URL}/profile/me/avatar`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      Accept: 'application/json',
      // Note: do not set Content-Type header when using FormData so browser sets correct boundary
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return data;
}

/** PUT /profile/me/banner (Auth) - Upload custom banner (Multipart form-data) */
export async function uploadBanner(file: File): Promise<{ status: number; message: string; data: { banner_url: string } }> {
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
  return data;
}

/** GET /profile/search - Search users */
export async function searchUsers(opts: {
  q: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; message: string; data: ApiUserSearchItem[] | ApiUserSearchItem }> {
  return get<{ status: number; message: string; data: ApiUserSearchItem[] | ApiUserSearchItem }>('/profile/search', {
    q: opts.q,
    page: opts.page,
    limit: opts.limit,
  });
}

/** GET /profile/:userId - Get public profile of a user */
export async function fetchPublicProfile(userId: number | string): Promise<{ status: number; message: string; data: ApiUserProfile }> {
  return get<{ status: number; message: string; data: ApiUserProfile }>(`/profile/${userId}`);
}

/** GET /profile/:userId/comments - Get comments made by a user */
export async function fetchProfileComments(userId: number | string): Promise<{ status: number; message: string; data: ApiProfileCommentItem[] }> {
  return get<{ status: number; message: string; data: ApiProfileCommentItem[] }>(`/profile/${userId}/comments`);
}

/** GET /profile/:userId/sign-in-streak - Get user streak information */
export async function fetchProfileSignInStreak(userId: number | string): Promise<{ status: number; message: string; data: ApiProfileStreak }> {
  return get<{ status: number; message: string; data: ApiProfileStreak }>(`/profile/${userId}/sign-in-streak`);
}

/** GET /profile/:userId/recent-watched - Get recent watched episodes */
export async function fetchProfileRecentWatched(userId: number | string): Promise<{ status: number; message: string; data: ApiProfileWatchedItem[] }> {
  return get<{ status: number; message: string; data: ApiProfileWatchedItem[] }>(`/profile/${userId}/recent-watched`);
}

/** GET /profile/:userId/completed-episodes-today - Get completed episodes count and list */
export async function fetchProfileCompletedEpisodes(userId: number | string): Promise<{ status: number; message: string; data: { count: number; episodes: ApiProfileCompletedItem['episodes'] } }> {
  return get<{ status: number; message: string; data: { count: number; episodes: ApiProfileCompletedItem['episodes'] } }>(`/profile/${userId}/completed-episodes-today`);
}
