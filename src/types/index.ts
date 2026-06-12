export interface Anime {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: 'anime';
  status: 'ongoing' | 'completed' | 'upcoming';
  releaseDate: string;
  studio: string;
  rating: number;
  episodeCount: number;
  genres: string[];
  coverUrl: string; // Horizontal banner ratio
  posterUrl: string; // Vertical ratio (2/3)
  isFeatured?: boolean;
}

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  duration: string; // e.g. "24:12"
  videoUrl: string;
  subAvailable: boolean;
  dubAvailable: boolean;
  thumbnailUrl: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string;
  releaseDate: string;
  pages: string[]; // URLs or placeholders for pages
}

export interface Manga {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: 'manga' | 'manhwa' | 'manhua';
  status: 'ongoing' | 'completed';
  rating: number;
  chapterCount: number;
  genres: string[];
  coverUrl: string; // Vertical/portrait ratio
  bannerUrl: string; // Horizontal banner ratio
  author: string;
  releaseDate: string;
  chapters: Chapter[];
}

export interface Bookmark {
  id: string;
  itemId: string; // animeId or mangaId
  itemType: 'anime' | 'manga';
  title: string;
  slug: string;
  coverUrl: string;
  progressText: string; // e.g. "Episode 3" or "Chapter 12"
  lastAccessedAt: number;
}

export interface WatchHistory {
  id: string;
  animeId: string;
  animeTitle: string;
  animeSlug: string;
  episodeNumber: number;
  episodeTitle: string;
  progress: number; // 0 to 1
  watchedAt: number;
  animeCover?: string;
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Backend API types — match the real server response shapes          */
/* ═══════════════════════════════════════════════════════════════════ */

/** Anime object returned by the backend API */
export interface ApiAnime {
  id: number;
  nama_anime: string;
  gambar_anime: string;
  rating_anime: number;
  view_anime: string | number; // formatted string like "1.2K" or raw number
  genre_anime: string[];
  label_anime: string; // TV, Movie, ONA, OVA, Special
  status_anime: string; // ONGOING, FINISHED, UPCOMING, Completed, etc.
  studio_anime: string[];
  sinopsis_anime: string;
  tanggal_rilis_anime: string;
  content_type?: string; // ANIME, FILM, DONGHUA
  is_21_plus?: boolean;
  episodes_count?: number;
  tags_anime?: string[];
  score?: number; // ML similarity score (recommendations)
}

export interface ApiEpisodeQuality {
  id: number;
  episode_id?: number;
  nama_quality: string;
  source_quality: string;
  hls_url: string | null;
  hls_size: number | null;
  hls_status: string;
}

/** Episode object from backend */
export interface ApiEpisode {
  id: number;
  anime_id: number;
  nomor_episode: number;
  judul_episode: string;
  thumbnail_episode?: string;
  deskripsi_episode?: string;
  durasi_episode?: number; // seconds
  intro_start_seconds?: number;
  intro_duration_seconds?: number;
  outro_start_seconds?: number;
  outro_duration_seconds?: number;
  tanggal_rilis_episode: string;
  hls_master_url?: string | null;
  early_access?: boolean;
  global_available_at?: string | null;
  qualities?: ApiEpisodeQuality[];
  anime?: {
    id: number;
    nama_anime: string;
    gambar_anime: string;
    sinopsis_anime?: string;
    genre_anime?: string[];
    rating_anime?: number;
    view_anime?: string | number;
    status_anime?: string;
    tanggal_rilis_anime?: string;
  };
}

/** Last episode info embedded in /anime/latest responses */
export interface ApiLastEpisode {
  id: number;
  nomor_episode: number;
  judul_episode: string;
  tanggal_rilis_episode: string;
}

/** Anime item from /anime/latest (includes last_episode) */
export interface ApiAnimeLatest extends ApiAnime {
  last_episode?: ApiLastEpisode;
}

/** Generic paginated response from the backend */
export interface ApiPaginatedResponse<T> {
  status: number;
  message: string;
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Schedule day entry */
export interface ApiScheduleAnime {
  id: number;
  nama_anime: string;
  jam: string;
  schedule_id: number;
  latest_episode_number?: number;
  latest_episode_title?: string;
  latest_episode_updated_at?: string;
  latest_episode_release_at?: string;
  gambar_anime?: string;
  status_anime?: string;
}

export interface ApiScheduleDay {
  date: string;
  hari: string;
  day_key: string;
  anime: ApiScheduleAnime[];
}

/** Genre stats from GET /anime/genres */
export interface ApiGenreStats {
  genre: string;
  count: number;
}

export interface ApiCommentUser {
  id: number;
  username: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
  vip?: {
    status?: string;
    vip_level?: string;
    endAt?: string;
  };
  activeBadges?: Array<{
    name: string;
    icon: string;
    title_color?: string;
  }>;
  level?: {
    id: number;
    level_number: number;
    title?: string;
    xp_required_total?: number;
  };
  avatar_border_active?: {
    id: number;
    border_id: number;
    code: string;
    title: string;
    image_url: string;
    is_active: boolean;
  } | null;
  super_badge_active?: {
    id: number;
    badge_id: number;
    badge_name: string;
    badge_icon: string;
    title_color?: string;
  } | null;
  comment_background?: {
    url: string;
  } | null;
}

export interface ApiComment {
  id: number;
  episode_id?: number | null;
  anime_id?: number | null;
  content: string;
  kind: 'TEXT' | 'STICKER';
  createdAt: string;
  is_delete?: boolean;
  user?: ApiCommentUser;
  _count?: {
    likes: number;
    replies: number;
  };
  likedByMe?: boolean;
}

