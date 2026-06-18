import { create } from 'zustand';
import type { ApiAnime, ApiEpisode } from '../types';

interface PlayerState {
  isActive: boolean;
  currentAnime: ApiAnime | null;
  currentEpisode: ApiEpisode | null;
  currentEpNum: number;
  videoSource: string;
  currentTime: number;
  isPlaying: boolean;

  setPlayData: (anime: ApiAnime, episode: ApiEpisode, epNum: number, source: string) => void;
  updateTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isActive: false,
  currentAnime: null,
  currentEpisode: null,
  currentEpNum: 1,
  videoSource: '',
  currentTime: 0,
  isPlaying: false,

  setPlayData: (anime, episode, epNum, source) => set({
    isActive: true,
    currentAnime: anime,
    currentEpisode: episode,
    currentEpNum: epNum,
    videoSource: source,
  }),
  
  updateTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  closePlayer: () => set({
    isActive: false,
    currentAnime: null,
    currentEpisode: null,
    videoSource: '',
    isPlaying: false
  })
}));
