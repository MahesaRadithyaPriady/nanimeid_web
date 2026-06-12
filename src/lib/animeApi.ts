/**
 * Anime API client.
 * Wraps all /anime endpoints documented in the backend API spec.
 */

import type {
  ApiAnime,
  ApiAnimeLatest,
  ApiEpisode,
  ApiPaginatedResponse,
  ApiScheduleDay,
  ApiGenreStats,
  ApiComment,
} from '../types';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/* ─── Helpers ──────────────────────────────────────────────────────── */

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token'); // zustand stores with JSON.stringify
  let jwt: string | null = null;
  if (token) {
    try {
      jwt = JSON.parse(token);
    } catch {
      jwt = token;
    }
  }
  if (jwt && jwt !== 'null' && jwt !== 'undefined') return { Authorization: `Bearer ${jwt}` };
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
    console.warn('Unauthorized token, retrying GET request without token...');
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

/** Sanitize rating_anime property to always be a float number */
function cleanAnime<T extends ApiAnime>(a: T): T {
  if (!a) return a;
  const rawRating = (a as any).rating_anime;
  const rating_anime = rawRating !== undefined && rawRating !== null
    ? parseFloat(String(rawRating))
    : 0;
  return {
    ...a,
    rating_anime: isNaN(rating_anime) ? 0 : rating_anime
  };
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Response shapes (specific to each endpoint)                        */
/* ═══════════════════════════════════════════════════════════════════ */

interface AnimeListResponse {
  status: number;
  message: string;
  data: ApiAnime[];
  meta?: {
    total?: number;
    limit?: number;
    page?: number;
    sortBy?: string;
    order?: string;
  };
}

interface AnimeLatestResponse extends ApiPaginatedResponse<ApiAnimeLatest> {}

interface AnimeViewResponse extends ApiPaginatedResponse<ApiAnime> {}

interface AnimeDetailResponse {
  status: number;
  message: string;
  data: ApiAnime & {
    episodes?: ApiEpisode[];
    aliases?: Array<{ id: number; alias: string; language?: string; type?: string }>;
  };
}

interface AnimeScheduleResponse {
  status: number;
  message: string;
  data: Record<string, ApiScheduleDay>;
}

interface AnimeRecommendationsResponse {
  status: number;
  message: string;
  data: ApiAnime[];
  meta?: Record<string, unknown>;
}

interface AnimeGenresResponse {
  status: number;
  message: string;
  data: {
    genres: string[];
    genreStats: ApiGenreStats[];
    totalGenres: number;
    totalAnimes: number;
  };
}

interface LiveSearchResponse {
  status: number;
  message: string;
  data: ApiAnime[];
}

interface SearchPaginatedResponse {
  status: number;
  message: string;
  items: ApiAnime[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RelatedAnimeResponse {
  success: boolean;
  data: {
    relatedAnime: (ApiAnime & {
      episodeCount?: number;
      sharedAliases?: string[];
      episodes?: ApiEpisode[];
    })[];
    totalRelated: number;
    totalEpisodes: number;
    sharedAliases: string[];
  };
}

interface SimilarAnimeResponse {
  status: number;
  message: string;
  data: ApiAnime[];
  meta?: Record<string, unknown>;
}

interface AnimeGenreResponse extends ApiPaginatedResponse<ApiAnime> {}

/* ═══════════════════════════════════════════════════════════════════ */
/* Endpoint functions                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

/** GET /anime — paginated anime list with optional filters */
export async function fetchAnimeList(opts?: {
  page?: number;
  limit?: number;
  type?: string;
  contentType?: string;
  sortBy?: string;
  order?: string;
}): Promise<AnimeListResponse> {
  const res = await get<AnimeListResponse>('/anime', {
    page: opts?.page,
    limit: opts?.limit,
    type: opts?.type,
    content_type: opts?.contentType,
    sortBy: opts?.sortBy,
    order: opts?.order,
  });
  if (res.data) {
    res.data = res.data.map(cleanAnime);
  }
  return res;
}

/** GET /anime/latest — newest anime by latest episode */
export async function fetchAnimeLatest(opts?: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<AnimeLatestResponse> {
  const res = await get<AnimeLatestResponse>('/anime/latest', {
    page: opts?.page,
    limit: opts?.limit,
    type: opts?.type,
  });
  if (res.items) {
    res.items = res.items.map(cleanAnime);
  }
  return res;
}

/** GET /anime/view — anime sorted by most views */
export async function fetchAnimeByView(opts?: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<AnimeViewResponse> {
  const res = await get<AnimeViewResponse>('/anime/view', {
    page: opts?.page,
    limit: opts?.limit,
    type: opts?.type,
  });
  if (res.items) {
    res.items = res.items.map(cleanAnime);
  }
  return res;
}

/** GET /anime/:id — full anime detail */
export async function fetchAnimeDetail(id: number | string): Promise<AnimeDetailResponse> {
  const res = await get<AnimeDetailResponse>(`/anime/${id}`);
  if (res.data) {
    res.data = cleanAnime(res.data);
  }
  return res;
}

/** GET /anime/schedule — 10-day schedule */
export async function fetchAnimeSchedule(opts?: {
  limitPerDay?: number;
  date?: string;
}): Promise<AnimeScheduleResponse> {
  return get<AnimeScheduleResponse>('/anime/schedule', {
    limitPerDay: opts?.limitPerDay,
    date: opts?.date,
  });
}

/** GET /anime/recommendations — personalized or popular */
export async function fetchAnimeRecommendations(opts?: {
  limit?: number;
  type?: string;
  page?: number;
}): Promise<AnimeRecommendationsResponse> {
  const res = await get<AnimeRecommendationsResponse>('/anime/recommendations', {
    limit: opts?.limit,
    type: opts?.type,
    page: opts?.page,
  });
  if (res.data) {
    res.data = res.data.map(cleanAnime);
  }
  return res;
}

/** GET /anime/recommendations/similar — ML-based similar anime */
export async function fetchSimilarAnime(animeId: number | string, opts?: {
  limit?: number;
  page?: number;
}): Promise<SimilarAnimeResponse> {
  const res = await get<SimilarAnimeResponse>('/anime/recommendations/similar', {
    anime_id: Number(animeId),
    limit: opts?.limit,
    page: opts?.page,
  });
  if (res.data) {
    res.data = res.data.map(cleanAnime);
  }
  return res;
}

/** GET /anime/genres — all genres with stats */
export async function fetchAnimeGenres(): Promise<AnimeGenresResponse> {
  return get<AnimeGenresResponse>('/anime/genres');
}

/** GET /anime/genre/:genre — anime filtered by genre */
export async function fetchAnimeByGenre(genre: string, opts?: {
  page?: number;
  limit?: number;
}): Promise<AnimeGenreResponse> {
  const res = await get<AnimeGenreResponse>(`/anime/genre/${encodeURIComponent(genre)}`, {
    page: opts?.page,
    limit: opts?.limit,
  });
  if (res.items) {
    res.items = res.items.map(cleanAnime);
  }
  return res;
}

/** GET /anime/status/:status — anime filtered by status */
export async function fetchAnimeByStatus(status: string): Promise<AnimeListResponse> {
  const res = await get<AnimeListResponse>(`/anime/status/${encodeURIComponent(status)}`);
  if (res.data) {
    res.data = res.data.map(cleanAnime);
  }
  return res;
}

/** GET /anime/live-search — fast search with fuzzy matching */
export async function fetchLiveSearch(q: string, opts?: {
  limit?: number;
  fuzzy?: boolean;
}): Promise<LiveSearchResponse> {
  const res = await get<LiveSearchResponse>('/anime/live-search', {
    q,
    limit: opts?.limit,
    fuzzy: opts?.fuzzy !== undefined ? (opts.fuzzy ? 'true' : 'false') : undefined,
  } as Record<string, string | number | undefined>);
  if (res.data) {
    res.data = res.data.map(cleanAnime);
  }
  return res;
}

/** GET /anime/search-paginated — search with pagination and filters */
export async function fetchSearchPaginated(q: string, opts?: {
  page?: number;
  limit?: number;
  status?: string;
  genre?: string;
  sortBy?: string;
}): Promise<SearchPaginatedResponse> {
  const res = await get<SearchPaginatedResponse>('/anime/search-paginated', {
    q,
    page: opts?.page,
    limit: opts?.limit,
    status: opts?.status,
    genre: opts?.genre,
    sortBy: opts?.sortBy,
  });
  if (res.items) {
    res.items = res.items.map(cleanAnime);
  }
  return res;
}

/** GET /anime/:id/related — related anime by shared aliases */
export async function fetchRelatedAnime(id: number | string): Promise<RelatedAnimeResponse> {
  const res = await get<RelatedAnimeResponse>(`/anime/${id}/related`);
  if (res.data && res.data.relatedAnime) {
    res.data.relatedAnime = res.data.relatedAnime.map(cleanAnime);
  }
  return res;
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Episode API types and functions                                    */
/* ═══════════════════════════════════════════════════════════════════ */

export interface ApiEpisodeNavigation {
  previousEpisode: {
    id: number;
    nomor_episode: number;
    judul_episode: string;
    thumbnail_episode?: string;
  } | null;
  nextEpisode: {
    id: number;
    nomor_episode: number;
    judul_episode: string;
    thumbnail_episode?: string;
  } | null;
  totalEpisodes: number;
  currentEpisodeNumber: number;
}

export interface ApiEpisodeByNumberResponse {
  status: number;
  message: string;
  data: {
    episode: ApiEpisode;
    navigation: ApiEpisodeNavigation;
  };
}

export interface ApiNextEpisodeResponse {
  status: number;
  message: string;
  has_next: boolean;
  current: {
    id: number;
    nomor_episode: number;
  };
  next: {
    id: number;
    anime_id: number;
    nomor_episode: number;
    judul_episode: string;
    thumbnail_episode?: string;
    tanggal_rilis_episode: string;
    durasi_episode: number | null;
  } | null;
}

export interface ApiEpisodeDownloadQuality {
  id: number;
  nama_quality: string;
  source_quality: string;
  hls_url: string | null;
  hls_status: string;
}

export interface ApiEpisodeDownloadResponse {
  status: number;
  message: string;
  data: {
    id: number;
    anime_id: number;
    nomor_episode: number;
    judul_episode: string;
    qualities: ApiEpisodeDownloadQuality[];
  };
}

export interface ApiBatchDownloadResponse {
  status: number;
  message: string;
  data: {
    anime_id: number;
    qualities: Record<string, Array<{
      episode_id: number;
      episode_number: number;
      judul_episode: string;
      quality_id: number;
      source: string;
    }>>;
  };
}

/** GET /episode/anime/:animeId — get all episodes for a specific anime */
export async function fetchAnimeEpisodes(animeId: number | string): Promise<{ success: boolean; data: ApiEpisode[] }> {
  return get<{ success: boolean; data: ApiEpisode[] }>(`/episode/anime/${animeId}`);
}

/** GET /episode/:episodeId — get detailed episode info by ID */
export async function fetchEpisodeDetail(episodeId: number | string): Promise<{ success: boolean; data: ApiEpisode }> {
  return get<{ success: boolean; data: ApiEpisode }>(`/episode/${episodeId}`);
}

/** GET /episode/anime/:animeId/episode/:episodeNumber — get episode by anime ID & number with navigation */
export async function fetchEpisodeByNumber(
  animeId: number | string,
  episodeNumber: number | string
): Promise<ApiEpisodeByNumberResponse> {
  return get<ApiEpisodeByNumberResponse>(`/episode/anime/${animeId}/episode/${episodeNumber}`);
}

/** GET /episode/:episodeId/next — check if next episode is available */
export async function fetchNextEpisode(episodeId: number | string): Promise<ApiNextEpisodeResponse> {
  return get<ApiNextEpisodeResponse>(`/episode/${episodeId}/next`);
}

/** GET /episode/download/episode/:episodeId — get download links for episode */
export async function fetchEpisodeDownloadLink(episodeId: number | string): Promise<ApiEpisodeDownloadResponse> {
  return get<ApiEpisodeDownloadResponse>(`/episode/download/episode/${episodeId}`);
}

/** GET /episode/download/anime/:animeId/batch — get batch download links */
export async function fetchBatchDownloadLink(animeId: number | string): Promise<ApiBatchDownloadResponse> {
  return get<ApiBatchDownloadResponse>(`/episode/download/anime/${animeId}/batch`);
}

/** POST /episode/:episodeId/progress — save watch progress to server */
export async function saveEpisodeProgress(
  episodeId: number | string,
  progressSeconds: number,
  isCompleted: boolean = false
): Promise<any> {
  const token = localStorage.getItem('auth_token'); // zustand auth token representation
  let jwt: string | null = null;
  if (token) {
    try { jwt = JSON.parse(token); } catch { jwt = token; }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${BASE_URL}/episode/${episodeId}/progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      progress_watching: Math.round(progressSeconds),
      is_completed: isCompleted
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Server error ${res.status}`);
  }
  return data;
}

/** GET /episode/:episodeId/progress — get watch progress from server */
export async function fetchEpisodeProgress(episodeId: number | string): Promise<any> {
  return get<any>(`/episode/${episodeId}/progress`);
}

/* ─── Comments & Likes API ─────────────────────────────────────────── */

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

export interface CommentsListResponse {
  status: number;
  message: string;
  total: number;
  comments: ApiComment[];
}

export async function fetchComments(opts: {
  episodeId?: number | string;
  animeId?: number | string;
  skip?: number;
  take?: number;
}): Promise<CommentsListResponse> {
  return get<CommentsListResponse>('/comments', {
    episodeId: opts.episodeId,
    animeId: opts.animeId,
    skip: opts.skip,
    take: opts.take,
  });
}

export async function fetchTopComments(opts: {
  episodeId?: number | string;
  animeId?: number | string;
  skip?: number;
  take?: number;
}): Promise<CommentsListResponse> {
  return get<CommentsListResponse>('/comments/top-latest', {
    episodeId: opts.episodeId,
    animeId: opts.animeId,
    skip: opts.skip,
    take: opts.take,
  });
}

export async function postComment(body: {
  anime_id?: number;
  episode_id?: number;
  content: string;
  kind?: 'TEXT' | 'STICKER';
  video_second?: number;
}): Promise<{ status: number; message: string; data: ApiComment }> {
  return sendRequest<{ status: number; message: string; data: ApiComment }>('POST', '/comments', body);
}

export async function likeComment(commentId: number | string): Promise<any> {
  return sendRequest<any>('POST', `/comments/${commentId}/like`);
}

export async function unlikeComment(commentId: number | string): Promise<any> {
  return sendRequest<any>('DELETE', `/comments/${commentId}/like`);
}
