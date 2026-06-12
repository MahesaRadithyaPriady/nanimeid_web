import { create } from 'zustand';
import type { Bookmark, WatchHistory, Anime, Manga } from '../types';
import { fetchAnimeDetail } from '../lib/animeApi';
import { fetchMyProfile } from '../lib/profileApi';

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
  // New API fields:
  id?: number;
  username?: string;
  bio?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  birthdate?: string | null;
  bannerUrl?: string | null;
  vipLevel?: string;
  isVip?: boolean;
  level?: number;
  xp?: number;
}

interface AppState {
  // Auth
  isLoggedIn: boolean;
  authToken: string | null;        // JWT from backend
  login: (profile?: Partial<UserProfile>) => void;
  logout: () => void;
  setAuthToken: (token: string | null) => void;
  fetchMyProfileData: () => Promise<void>;

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
    progress: number,
    animeCover?: string
  ) => void;
  fetchAndSetMissingCovers: () => Promise<void>;
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
  // Auth
  isLoggedIn: loadSavedState('is_logged_in', false),
  authToken: loadSavedState<string | null>('auth_token', null),

  login: (profile) => {
    saveState('is_logged_in', true);
    set({ isLoggedIn: true });
    if (profile) get().updateProfile(profile);
    // Fetch profile data from API server immediately
    get().fetchMyProfileData();
  },

  logout: () => {
    saveState('is_logged_in', false);
    saveState('auth_token', null);
    set({ isLoggedIn: false, authToken: null });
  },

  setAuthToken: (token) => {
    saveState('auth_token', token);
    set({ authToken: token });
  },

  fetchMyProfileData: async () => {
    const { authToken, isLoggedIn, logout } = get();
    if (!authToken || !isLoggedIn) return;
    try {
      const res = await fetchMyProfile();
      if (res && res.data) {
        const apiUser = res.data;
        const profile: Partial<UserProfile> = {
          name: apiUser.profile?.full_name || apiUser.username,
          email: apiUser.email || '',
          avatarUrl: apiUser.profile?.avatar_url || '',
          id: apiUser.id,
          username: apiUser.username,
          bio: apiUser.profile?.bio || '',
          gender: apiUser.profile?.gender || null,
          birthdate: apiUser.profile?.birthdate || null,
          bannerUrl: apiUser.profile?.banner_url || '',
          vipLevel: apiUser.vip?.vip_level || 'FREE',
          isVip: apiUser.vip?.status === 'ACTIVE' || !!apiUser.vip,
          level: apiUser.level?.level_number || 1,
          xp: apiUser.stats?.xp || 0,
        };
        get().updateProfile(profile);
      }
    } catch (e) {
      console.error('Failed to fetch profile from server:', e);
      if (String(e).includes('401') || String(e).includes('Unauthorized') || String(e).includes('token')) {
        logout();
      }
    }
  },

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
  addWatchHistory: (animeId, animeTitle, animeSlug, episodeNumber, episodeTitle, progress, animeCover) => set((state) => {
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
      watchedAt: Date.now(),
      animeCover
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
  }),
  fetchAndSetMissingCovers: async () => {
    const { watchHistory } = get();
    let updated = false;
    const newHistory = [...watchHistory];
    
    for (let i = 0; i < newHistory.length; i++) {
      const h = newHistory[i];
      if (!h.animeCover) {
        try {
          const detail = await fetchAnimeDetail(h.animeId);
          if (detail && detail.data && detail.data.gambar_anime) {
            newHistory[i] = {
              ...h,
              animeCover: detail.data.gambar_anime
            };
            updated = true;
          }
        } catch (e) {
          console.error(`Failed to fetch cover for anime ${h.animeId}:`, e);
        }
      }
    }
    
    if (updated) {
      set({ watchHistory: newHistory });
      saveState('watch_history', newHistory);
    }
  }
}));
