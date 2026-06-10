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
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}
