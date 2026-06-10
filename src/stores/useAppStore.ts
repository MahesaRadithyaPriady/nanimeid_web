import { create } from 'zustand';
import type { Bookmark, WatchHistory, Anime, Manga } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  subPreference: 'id' | 'en' | 'off';
  qualityPreference: '360p' | '480p' | '720p' | '1080p';
  notify: boolean;
  animeCount: number;
  mangaCount: number;
  episodesWatchedCount: number;
}

interface AppState {
  // UI states
  sidebarExpanded: boolean;
  mobileMenuOpen: boolean;
  activeToasts: ToastMessage[];
  
  // Settings & Preferences
  videoVolume: number;
  videoQuality: '360p' | '480p' | '720p' | '1080p';
  subtitleLang: 'id' | 'en' | 'off';
  userProfile: UserProfile;
  
  // User Data
  bookmarks: Bookmark[];
  watchHistory: WatchHistory[];
  
  // UI Actions
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleMobileMenu: (open?: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  
  // Settings Actions
  setVideoVolume: (volume: number) => void;
  setVideoQuality: (quality: '360p' | '480p' | '720p' | '1080p') => void;
  setSubtitleLang: (lang: 'id' | 'en' | 'off') => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Bookmark Actions
  addBookmark: (item: Anime | Manga) => void;
  removeBookmark: (itemId: string, itemType: 'anime' | 'manga') => void;
  isBookmarked: (itemId: string, itemType: 'anime' | 'manga') => boolean;
  
  // History Actions
  addWatchHistory: (
    animeId: string,
    animeTitle: string,
    animeSlug: string,
    episodeNumber: number,
    episodeTitle: string,
    progress: number
  ) => void;
}

// Helper to load state from localStorage if available
const loadSavedState = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveState = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage block
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // UI
  sidebarExpanded: true,
  mobileMenuOpen: false,
  activeToasts: [],
  
  // Settings
  videoVolume: loadSavedState('volume', 0.8),
  videoQuality: loadSavedState('quality', '720p'),
  subtitleLang: loadSavedState('sub_lang', 'id'),
  
  userProfile: loadSavedState('profile', {
    name: 'Andi Pratama',
    email: 'andi.pratama@nanime.id',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    subPreference: 'id',
    qualityPreference: '720p',
    notify: true,
    animeCount: 12,
    mangaCount: 4,
    episodesWatchedCount: 154
  }),
  
  // Data
  bookmarks: loadSavedState('bookmarks', []),
  watchHistory: loadSavedState('watch_history', []),

  // UI Actions
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  toggleMobileMenu: (open) => set((state) => ({ mobileMenuOpen: open !== undefined ? open : !state.mobileMenuOpen })),
  
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      activeToasts: [...state.activeToasts, { id, type, message }].slice(-3) // Keep max 3 toasts
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  
  removeToast: (id) => set((state) => ({
    activeToasts: state.activeToasts.filter((t) => t.id !== id)
  })),

  // Settings Actions
  setVideoVolume: (volume) => {
    set({ videoVolume: volume });
    saveState('volume', volume);
  },
  
  setVideoQuality: (quality) => {
    set({ videoQuality: quality });
    saveState('quality', quality);
  },
  
  setSubtitleLang: (lang) => {
    set({ subtitleLang: lang });
    saveState('sub_lang', lang);
  },
  
  updateProfile: (profile) => set((state) => {
    const updated = { ...state.userProfile, ...profile };
    saveState('profile', updated);
    return { userProfile: updated };
  }),

  // Bookmark Actions
  addBookmark: (item) => set((state) => {
    const exists = state.bookmarks.some((b) => b.itemId === item.id && b.itemType === item.type);
    if (exists) return {};
    
    const newBookmark: Bookmark = {
      id: `${item.type}-${item.id}`,
      itemId: item.id,
      itemType: item.type === 'anime' ? 'anime' : 'manga',
      title: item.title,
      slug: item.slug,
      coverUrl: item.type === 'anime' ? item.posterUrl : item.coverUrl,
      progressText: item.type === 'anime' ? 'Belum ditonton' : 'Belum dibaca',
      lastAccessedAt: Date.now()
    };
    const updated = [newBookmark, ...state.bookmarks];
    saveState('bookmarks', updated);
    
    // Update count in profile
    const profileUpdate = item.type === 'anime' 
      ? { animeCount: state.userProfile.animeCount + 1 }
      : { mangaCount: state.userProfile.mangaCount + 1 };
    
    setTimeout(() => {
      get().updateProfile(profileUpdate);
    }, 50);

    return { bookmarks: updated };
  }),

  removeBookmark: (itemId, itemType) => set((state) => {
    const updated = state.bookmarks.filter((b) => !(b.itemId === itemId && b.itemType === itemType));
    saveState('bookmarks', updated);
    
    // Update count in profile
    const countKey = itemType === 'anime' ? 'animeCount' : 'mangaCount';
    const currentVal = state.userProfile[countKey];
    const profileUpdate = { [countKey]: Math.max(0, currentVal - 1) };
    
    setTimeout(() => {
      get().updateProfile(profileUpdate);
    }, 50);

    return { bookmarks: updated };
  }),
  
  isBookmarked: (itemId, itemType) => {
    return get().bookmarks.some((b) => b.itemId === itemId && b.itemType === itemType);
  },

  // History Actions
  addWatchHistory: (animeId, animeTitle, animeSlug, episodeNumber, episodeTitle, progress) => set((state) => {
    // Filter out previous record of this episode if it exists
    const cleanHistory = state.watchHistory.filter(
      (h) => !(h.animeId === animeId && h.episodeNumber === episodeNumber)
    );

    const newHistory: WatchHistory = {
      id: `history-${animeId}-${episodeNumber}-${Date.now()}`,
      animeId,
      animeTitle,
      animeSlug,
      episodeNumber,
      episodeTitle,
      progress,
      watchedAt: Date.now()
    };
    
    const updated = [newHistory, ...cleanHistory].slice(0, 50); // Store up to 50 items
    saveState('watch_history', updated);

    // Update bookmark progress text
    const updatedBookmarks = state.bookmarks.map(b => {
      if (b.itemId === animeId && b.itemType === 'anime') {
        return {
          ...b,
          progressText: `Lanjut Ep ${episodeNumber} (${Math.round(progress * 100)}%)`,
          lastAccessedAt: Date.now()
        };
      }
      return b;
    });
    
    saveState('bookmarks', updatedBookmarks);

    // Increment watch counter in profile if progress reaches over 90% (watched)
    if (progress > 0.9) {
      setTimeout(() => {
        get().updateProfile({ episodesWatchedCount: state.userProfile.episodesWatchedCount + 1 });
      }, 50);
    }

    return { 
      watchHistory: updated,
      bookmarks: updatedBookmarks
    };
  })
}));
