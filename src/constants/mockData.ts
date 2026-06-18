import type { Anime, Episode, Manga, Comment } from '../types';

export const GENRES = [
  'Semua',
  'Action',
  'Adventure',
  'Fantasy',
  'Drama',
  'Sci-Fi',
  'Slice of Life',
  'Comedy',
  'Romance',
  'Mystery',
  'Supernatural',
  'Historical',
  'School'
];

export const MOCK_ANIMES: Anime[] = [];

export const generateEpisodesForAnime = (animeId: string, count: number): Episode[] => {
  return [];
};

export const MOCK_EPISODES: Record<string, Episode[]> = {};

export const MOCK_MANGAS: Manga[] = [];

export const generateMangaPages = (chapterNum: number): string[] => {
  return [];
};

export const MOCK_COMMENTS: Comment[] = [];
