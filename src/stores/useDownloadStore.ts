import { create } from 'zustand';
import type { ApiAnime, ApiEpisode } from '../types';
import { useAppStore } from './useAppStore';

// ─── IndexedDB Config ───
const DB_NAME = 'nanime-downloads';
const DB_VERSION = 1;
const STORE_NAME = 'episodes';

export interface DownloadedItem {
  episodeId: number;
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  quality: string;
  videoSize: number;
  downloadedAt: number;
  
  // Stored Blobs
  videoBlob: Blob;
  animeImageBlob: Blob | null;
  episodeThumbnailBlob: Blob | null;
  
  // Metadata payloads for restoring offline details
  episodeData: ApiEpisode;
  animeData: ApiAnime;
  
  // Temporary Object URLs (generated during initDownloads/download success, revoked on delete/re-init)
  videoLocalUrl?: string;
  animeImageLocalUrl?: string;
  episodeThumbnailLocalUrl?: string;
}

export interface DownloadingProgress {
  progress: number;
  state: 'downloading' | 'error' | 'completed';
  error?: string;
  controller?: AbortController;
}

interface DownloadState {
  downloadedList: DownloadedItem[];
  downloadingState: Record<number, DownloadingProgress>;
  isInitialized: boolean;
  
  initDownloads: () => Promise<void>;
  downloadEpisode: (anime: ApiAnime, episode: ApiEpisode, qualityName: string, downloadUrl: string) => Promise<void>;
  cancelDownload: (episodeId: number) => void;
  deleteDownload: (episodeId: number) => Promise<void>;
  isEpisodeDownloaded: (episodeId: number) => boolean;
  getVideoBlob: (episodeId: number) => Promise<Blob | null>;
}

// Helper to open IndexedDB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'episodeId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper to route urls through the local proxy for development only
function getProxyUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Only use proxy in dev mode — production uses CDN URL directly
  if (import.meta.env.DEV && url.startsWith('https://cdn-stable.nanimeid.xyz')) {
    return url.replace('https://cdn-stable.nanimeid.xyz', '/cdn-proxy');
  }
  return url;
}

// Fetch helper to get image blob
async function fetchBlob(url?: string): Promise<Blob | null> {
  if (!url) return null;
  const proxyUrl = getProxyUrl(url);
  try {
    const res = await fetch(proxyUrl!, { referrerPolicy: 'no-referrer' });
    if (res.ok) return await res.blob();
  } catch (e) {
    console.error('Failed to fetch blob from url:', url, e);
  }
  return null;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedList: [],
  downloadingState: {},
  isInitialized: false,

  initDownloads: async () => {
    try {
      const db = await openDb();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        // Clean up any existing Object URLs to prevent leaks
        get().downloadedList.forEach(item => {
          if (item.videoLocalUrl) URL.revokeObjectURL(item.videoLocalUrl);
          if (item.animeImageLocalUrl) URL.revokeObjectURL(item.animeImageLocalUrl);
          if (item.episodeThumbnailLocalUrl) URL.revokeObjectURL(item.episodeThumbnailLocalUrl);
        });

        const rawList: DownloadedItem[] = getAllRequest.result || [];
        
        // Generate Object URLs for images only to avoid loading all videos into memory urls immediately,
        // but generate a temporary URL for everything so it works offline.
        const listWithUrls = rawList.map(item => {
          const newItem = { ...item };
          if (item.animeImageBlob) {
            newItem.animeImageLocalUrl = URL.createObjectURL(item.animeImageBlob);
          }
          if (item.episodeThumbnailBlob) {
            newItem.episodeThumbnailLocalUrl = URL.createObjectURL(item.episodeThumbnailBlob);
          }
          // Note: we'll create the video local URL when requested or played, 
          // but let's pre-generate it for easier offline watch routing
          if (item.videoBlob) {
            newItem.videoLocalUrl = URL.createObjectURL(item.videoBlob);
          }
          return newItem;
        });

        set({ downloadedList: listWithUrls, isInitialized: true });
      };
      
      getAllRequest.onerror = (e) => {
        console.error('Failed to retrieve downloads from IndexedDB:', e);
      };
    } catch (err) {
      console.error('Error initializing downloads store:', err);
    }
  },

  downloadEpisode: async (anime, episode, qualityName, downloadUrl) => {
    const episodeId = episode.id;
    const addToast = useAppStore.getState().addToast;

    // VIP check — require at least VIP to download
    if (!useAppStore.getState().userProfile?.isVip) {
      addToast('error', 'Perlu minimal VIP Bronze untuk mengunduh video!');
      return;
    }

    // Check if already downloaded or currently downloading
    if (get().isEpisodeDownloaded(episodeId)) {
      addToast('info', 'Episode ini sudah diunduh.');
      return;
    }
    if (get().downloadingState[episodeId]?.state === 'downloading') {
      addToast('info', 'Sedang mengunduh episode ini.');
      return;
    }

    if (!navigator.onLine) {
      addToast('error', 'Anda sedang offline. Tidak dapat mengunduh episode.');
      return;
    }

    const controller = new AbortController();
    set((state) => ({
      downloadingState: {
        ...state.downloadingState,
        [episodeId]: { progress: 0, state: 'downloading', controller }
      }
    }));

    addToast('info', `Mulai mengunduh Episode ${episode.nomor_episode} - ${anime.nama_anime}`);

    try {
      // 1. Fetch images as blobs in parallel
      const [animeImageBlob, episodeThumbnailBlob] = await Promise.all([
        fetchBlob(anime.gambar_anime),
        fetchBlob(episode.thumbnail_episode)
      ]);

      // 2. Fetch video with progress monitoring
      const proxyDownloadUrl = getProxyUrl(downloadUrl) || downloadUrl;
      const response = await fetch(proxyDownloadUrl, {
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file video (${response.status})`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Gagal membaca stream video.');
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          if (totalBytes > 0) {
            const progress = Math.round((receivedBytes / totalBytes) * 100);
            set((state) => ({
              downloadingState: {
                ...state.downloadingState,
                [episodeId]: {
                  ...state.downloadingState[episodeId],
                  progress
                }
              }
            }));
          }
        }
      }

      const videoBlob = new Blob(chunks as any[], { type: 'video/mp4' });

      // 3. Save to IndexedDB
      const downloadItem: Omit<DownloadedItem, 'videoLocalUrl' | 'animeImageLocalUrl' | 'episodeThumbnailLocalUrl'> = {
        episodeId,
        animeId: anime.id,
        animeTitle: anime.nama_anime,
        episodeNumber: episode.nomor_episode,
        episodeTitle: episode.judul_episode || `Episode ${episode.nomor_episode}`,
        quality: qualityName,
        videoSize: videoBlob.size,
        downloadedAt: Date.now(),
        videoBlob,
        animeImageBlob,
        episodeThumbnailBlob,
        episodeData: episode,
        animeData: anime
      };

      const db = await openDb();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(downloadItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });

      // 4. Update memory list with local object URLs
      const fullItem: DownloadedItem = {
        ...downloadItem,
        videoBlob, // keep reference
        videoLocalUrl: URL.createObjectURL(videoBlob),
        animeImageLocalUrl: animeImageBlob ? URL.createObjectURL(animeImageBlob) : undefined,
        episodeThumbnailLocalUrl: episodeThumbnailBlob ? URL.createObjectURL(episodeThumbnailBlob) : undefined
      };

      set((state) => ({
        downloadedList: [fullItem, ...state.downloadedList],
        downloadingState: {
          ...state.downloadingState,
          [episodeId]: { progress: 100, state: 'completed' }
        }
      }));

      addToast('success', `Berhasil mengunduh Episode ${episode.nomor_episode} - ${anime.nama_anime}`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Download aborted by user:', episodeId);
        addToast('info', 'Unduhan dibatalkan.');
      } else {
        console.error('Error during download:', err);
        set((state) => ({
          downloadingState: {
            ...state.downloadingState,
            [episodeId]: {
              progress: 0,
              state: 'error',
              error: err.message || 'Gagal mengunduh'
            }
          }
        }));
        addToast('error', `Gagal mengunduh: ${err.message || 'Error tidak diketahui'}`);
      }
    }
  },

  cancelDownload: (episodeId) => {
    const progress = get().downloadingState[episodeId];
    if (progress && progress.controller) {
      progress.controller.abort();
    }
    set((state) => {
      const newState = { ...state.downloadingState };
      delete newState[episodeId];
      return { downloadingState: newState };
    });
  },

  deleteDownload: async (episodeId) => {
    const addToast = useAppStore.getState().addToast;
    try {
      const db = await openDb();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const deleteRequest = store.delete(episodeId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Revoke memory URLs
      const deletedItem = get().downloadedList.find(item => item.episodeId === episodeId);
      if (deletedItem) {
        if (deletedItem.videoLocalUrl) URL.revokeObjectURL(deletedItem.videoLocalUrl);
        if (deletedItem.animeImageLocalUrl) URL.revokeObjectURL(deletedItem.animeImageLocalUrl);
        if (deletedItem.episodeThumbnailLocalUrl) URL.revokeObjectURL(deletedItem.episodeThumbnailLocalUrl);
      }

      set((state) => ({
        downloadedList: state.downloadedList.filter(item => item.episodeId !== episodeId),
        downloadingState: (() => {
          const newState = { ...state.downloadingState };
          delete newState[episodeId];
          return newState;
        })()
      }));

      addToast('success', 'Unduhan berhasil dihapus.');
    } catch (err) {
      console.error('Failed to delete download:', err);
      addToast('error', 'Gagal menghapus unduhan.');
    }
  },

  isEpisodeDownloaded: (episodeId) => {
    return get().downloadedList.some(item => String(item.episodeId) === String(episodeId));
  },

  getVideoBlob: async (episodeId) => {
    try {
      const db = await openDb();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const item = await new Promise<DownloadedItem | undefined>((resolve, reject) => {
        const getReq = store.get(episodeId);
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => reject(getReq.error);
      });

      return item?.videoBlob || null;
    } catch (e) {
      console.error('Failed to load video blob from DB:', e);
      return null;
    }
  }
}));
