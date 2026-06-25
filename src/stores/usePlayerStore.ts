import { create } from 'zustand';
import type { ApiAnime, ApiEpisode } from '../types';

interface PlayerState {
  isActive: boolean;
  currentAnime: ApiAnime | null;
  currentEpisode: ApiEpisode | null;
  currentEpNum: number;
  currentEpKey: string; // `${animeId}-${epNum}` — trigger HLS reload
  videoSource: string;
  currentTime: number;
  isPlaying: boolean;

  isMiniMode: boolean;

  setPlayData: (anime: ApiAnime, episode: ApiEpisode, epNum: number, source: string) => void;
  updateTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMiniMode: (isMiniMode: boolean) => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isActive: false,
  currentAnime: null,
  currentEpisode: null,
  currentEpNum: 1,
  currentEpKey: '',
  videoSource: '',
  currentTime: 0,
  isPlaying: false,
  isMiniMode: false,

  setPlayData: (anime, episode, epNum, source) => set({
    isActive: true,
    currentAnime: anime,
    currentEpisode: episode,
    currentEpNum: epNum,
    currentEpKey: `${anime.id}-${epNum}`,
    videoSource: source,
  }),
  
  updateTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMiniMode: (isMiniMode) => set({ isMiniMode }),
  
  closePlayer: () => set({
    isActive: false,
    isMiniMode: false,
    currentAnime: null,
    currentEpisode: null,
    currentEpKey: '',
    videoSource: '',
    isPlaying: false
  })
}));
