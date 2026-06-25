import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, 
  Minimize2, Settings, ArrowLeft, ArrowRight, Heart, Send, 
  MessageSquare, Star, Loader2, Smile, VideoOff, Lock, Download, Trash2
} from 'lucide-react';
import Hls from 'hls.js';
import { useAppStore } from '../stores/useAppStore';
import { useDownloadStore } from '../stores/useDownloadStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { Badge } from '../components/ui/Badge';
import { UserAvatar } from '../components/ui/UserAvatar';
import { AnimeCard } from '../components/cards/AnimeCard';
import { 
  fetchAnimeDetail, 
  fetchEpisodeByNumber, 
  fetchSimilarAnime,
  saveEpisodeProgress,
  fetchComments,
  postComment,
  likeComment,
  unlikeComment,
  fetchStickers,
  fetchVipEligibility,
  purchaseSticker,
  type ApiEpisodeNavigation
} from '../lib/animeApi';
import { postWatchTick, type WatchTickResponse } from '../lib/watchApi';
import { useConfirmStore } from '../stores/useConfirmStore';
import type { ApiAnime, ApiEpisode, ApiComment, ApiSticker } from '../types';

/** Format seconds into mm:ss or hh:mm:ss */
function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Module-level episode progress cache — bertahan saat WatchPage unmount/remount.
 * Key: `${animeId}-${epNum}`, Value: {time, wasPlaying}
 */
const globalEpisodeCache = new Map<string, { time: number; wasPlaying: boolean }>();

/** Helper to resolve sticker image URLs dynamically by replacing placeholder domains with backend host */
function getStickerUrl(content?: string): string {
  if (!content) return '';

  // If it's already a valid external HTTP/HTTPS URL, just use it directly
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content;
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
  const apiHost = baseUrl.replace(/\/v?\d+\.\d+\.\d+(\/.*)?$/, '').replace(/\/v?\d+(\/.*)?$/, '');

  // 1. If it's a code (like STK_HAPPY_1)
  if (!content.includes('/') && !content.includes('.')) {
    return `${apiHost}/static/uploads/stickers/${content.toLowerCase()}.png`;
  }

  // 2. If it's a relative path
  if (content.startsWith('/') || content.startsWith('static/')) {
    const cleanPath = content.startsWith('/') ? content : `/${content}`;
    return `${apiHost}${cleanPath}`;
  }

  // 3. Fallback
  return `${apiHost}/static/uploads/stickers/${content}`;
}

const WatchPageSkeleton: React.FC = () => {
  return (
    <div className="pb-16 space-y-6">
      {/* Back to details link skeleton */}
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary/50">
        <ArrowLeft className="w-3.5 h-3.5 opacity-40" />
        <div className="w-28 h-3.5 bg-white/5 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Player, Title, comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Box Skeleton */}
          <div className="relative aspect-[16/9] w-full bg-black rounded-2xl overflow-hidden border border-border/30 flex items-center justify-center group/player">
            {/* Dark inner layer with shimmer */}
            <div className="absolute inset-0 animate-shimmer opacity-40" />
            <div className="z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse border border-white/10">
                <Play className="w-6 h-6 text-white/20 fill-white/10 animate-pulse" />
              </div>
              <div className="w-36 h-3 bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Episode Meta Info Box Skeleton */}
          <div className="bg-bg-sidebar/65 backdrop-blur-sm border border-border/30 rounded-2xl p-5 sm:p-6 text-left space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
              <div className="space-y-2.5 flex-1">
                <div className="w-24 h-3.5 bg-primary/10 rounded border border-primary/10 animate-pulse" />
                <div className="w-3/4 h-7 bg-bg-elevated dark:bg-white/10 rounded animate-pulse" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-5 bg-bg-elevated dark:bg-white/5 rounded animate-pulse" />
                  <div className="w-36 h-4 bg-bg-elevated dark:bg-white/5 rounded animate-pulse" />
                </div>
              </div>

              {/* Prev / Next buttons skeletons */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-10 bg-bg-elevated dark:bg-white/5 border border-border/40 rounded-xl animate-pulse" />
                <div className="w-24 h-10 bg-bg-elevated dark:bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              {/* Left stats */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-16 h-6 bg-white/5 rounded-md animate-pulse" />
                <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
              </div>
              {/* Right indicators */}
              <div className="flex items-center gap-2">
                <div className="w-28 h-6 bg-white/5 rounded-md animate-pulse" />
                <div className="w-20 h-6 bg-white/5 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Comments Section Skeleton */}
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 text-left space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <div className="w-32 h-5 bg-white/10 rounded animate-pulse" />
            </div>

            {/* Comment input form skeleton */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 h-10 bg-white/5 rounded-xl animate-pulse" />
            </div>

            {/* Comment List skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-border/30 p-3 rounded-xl last:border-none">
                  <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                        <div className="w-8 h-3.5 bg-white/5 rounded animate-pulse" />
                      </div>
                      <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded animate-pulse" />
                    <div className="w-5/6 h-3 bg-white/5 rounded animate-pulse" />
                    <div className="w-10 h-3.5 bg-white/5 rounded animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area (Sidebar): Episode List Skeleton */}
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col text-left space-y-3 animate-fade-in">
          <div className="pb-3 border-b border-border/50 shrink-0">
            <div className="w-36 h-4 bg-white/10 rounded animate-pulse" />
            <div className="w-24 h-3 bg-white/5 rounded animate-pulse mt-1.5" />
          </div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl border border-transparent">
                {/* Thumbnail placeholder */}
                <div className="relative w-20 aspect-[16/9] bg-white/5 rounded animate-pulse shrink-0" />
                {/* Details placeholder */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-3.5 bg-white/10 rounded animate-pulse" />
                    <div className="w-8 h-3 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="w-5/6 h-3.5 bg-white/5 rounded animate-pulse" />
                  <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse font-mono" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface WatchPageProps {
  forceId?: string;
  forceEpisode?: string;
  isMiniMode?: boolean;
}

export const WatchPage: React.FC<WatchPageProps> = ({ forceId, forceEpisode, isMiniMode }) => {
  const params = useParams<{ id: string; episodeNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const id = forceId || params.id;
  const episodeNumber = forceEpisode || params.episodeNumber;
  const currentEpNum = parseInt(episodeNumber || '1', 10);

  const { 
    videoVolume, setVideoVolume, 
    videoQuality, setVideoQuality, 
    addWatchHistory, watchHistory, 
    isLoggedIn, userProfile, updateProfile
  } = useAppStore();

  // We re-enable toasts so we can debug the Watch XP Lite issue
  const { addToast } = useAppStore();
  const confirm = useConfirmStore((s) => s.confirm);

  // API States
  const [anime, setAnime] = useState<ApiAnime | null>(null);
  const [episodes, setEpisodes] = useState<ApiEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<ApiEpisode | null>(null);
  const [navigation, setNavigation] = useState<ApiEpisodeNavigation | null>(null);
  const [relatedAnimes, setRelatedAnimes] = useState<ApiAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Download Store States & Handlers
  const {
    downloadEpisode,
    cancelDownload,
    deleteDownload,
    isEpisodeDownloaded,
    downloadingState,
    downloadedList,
    initDownloads
  } = useDownloadStore();

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [downloadQualities, setDownloadQualities] = useState<any[]>([]);
  const [loadingQualities, setLoadingQualities] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [offlineVideoUrl, setOfflineVideoUrl] = useState<string | null>(null);

  // Initialize downloads list from DB
  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  // Click outside for download dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch download qualities on demand
  const handleDownloadClick = async () => {
    if (showDownloadDropdown) {
      setShowDownloadDropdown(false);
      return;
    }
    
    setShowDownloadDropdown(true);
    if (!currentEpisode?.id) return;
    
    if (downloadQualities.length === 0) {
      if (!navigator.onLine) {
        useAppStore.getState().addToast('error', 'Anda sedang offline. Tidak dapat memuat daftar kualitas unduhan.');
        setShowDownloadDropdown(false);
        return;
      }
      setLoadingQualities(true);
      try {
        const { fetchEpisodeDownloadLink } = await import('../lib/animeApi');
        const res = await fetchEpisodeDownloadLink(currentEpisode.id);
        if (res && res.data && res.data.qualities) {
          setDownloadQualities(res.data.qualities);
        }
      } catch (e) {
        console.error('Failed to fetch download qualities:', e);
        // Fallback to episode qualities if available
        if (currentEpisode.qualities) {
          setDownloadQualities(currentEpisode.qualities);
        }
      } finally {
        setLoadingQualities(false);
      }
    }
  };

  // Load offline video url if downloaded
  useEffect(() => {
    if (!currentEpisode?.id) {
      setOfflineVideoUrl(null);
      return;
    }
    
    let active = true;
    const loadOfflineVideo = async () => {
      const isDownloaded = isEpisodeDownloaded(currentEpisode.id);
      if (isDownloaded) {
        try {
          const blob = await useDownloadStore.getState().getVideoBlob(currentEpisode.id);
          if (blob && active) {
            const url = URL.createObjectURL(blob);
            setOfflineVideoUrl(url);
            console.log('[Offline Playback] Loaded local video blob URL:', url);
          }
        } catch (e) {
          console.error('Failed to load video blob:', e);
        }
      } else {
        setOfflineVideoUrl(null);
      }
    };

    loadOfflineVideo();

    return () => {
      active = false;
      if (offlineVideoUrl) {
        URL.revokeObjectURL(offlineVideoUrl);
      }
    };
  }, [currentEpisode?.id, downloadedList, isEpisodeDownloaded]);

  // Video Ref & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const pendingSeekRatioRef = useRef<number>(0);
  const pendingShouldPlayRef = useRef<boolean>(false);
  const lastSavedProgressBucketRef = useRef<number>(-1);
  const isPlayingRef = useRef(false);
  const loadedEpisodeKeyRef = useRef<string>('');
  // Cache: simpan {time, wasPlaying} per episode key agar bisa di-restore saat kembali
  const episodeCacheRef = useRef<Record<string, { time: number; wasPlaying: boolean }>>({});
  // AbortController untuk cancel fetch episode yang sudah tidak relevan
  const loadEpisodeAbortRef = useRef<AbortController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [openSettings, setOpenSettings] = useState<'none' | 'quality' | 'speed'>('none');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [floatingXp, setFloatingXp] = useState<{ amount: number; id: number } | null>(null);
  // Watch Tick API state
  const [watchTickData, setWatchTickData] = useState<WatchTickResponse['data'] | null>(null);
  const [rewardProgress, setRewardProgress] = useState(0); // 0-100% progress to next reward

      const handleTimeUpdateRef = useRef<() => void>(() => {});
      useEffect(() => {
        handleTimeUpdateRef.current = handleTimeUpdate;
      });

      // Bind events to global video element
      useEffect(() => {
        let cleanupFunc: (() => void) | null = null;
        let observer: MutationObserver | null = null;

        const bindEvents = (video: HTMLVideoElement) => {
          // Assign to ref so WatchPage controls work
          (videoRef as any).current = video;

          const onWaiting = () => setIsBuffering(true);
          const onSeeking = () => setIsBuffering(true);
          const onCanPlay = () => { setIsBuffering(false); setIsChangingQuality(false); setStreamError(null); };
          const onPlaying = () => { setIsBuffering(false); setIsChangingQuality(false); setIsPlaying(true); setStreamError(null); };
          const onSeeked = () => setIsBuffering(false);
          const onPlay = () => { setIsPlaying(true); setStreamError(null); };
          const onPause = () => setIsPlaying(false);
          const onEnded = () => setIsPlaying(false);
          const onError = (e: any) => {
            const target = e.target as HTMLVideoElement;
            console.error("Video Error:", target.error);
            if (target.error) {
               setStreamError(`Video gagal diputar: Kode error ${target.error.code}. Format tidak didukung atau file rusak.`);
            }
          };

          const onTimeUpdate = () => handleTimeUpdateRef.current();

          video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata as any);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('seeking', onSeeking);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('ended', onEnded);
      video.addEventListener('error', onError);

          cleanupFunc = () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
video.removeEventListener('loadedmetadata', handleLoadedMetadata as any);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('seeking', onSeeking);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('error', onError);
      };
    };

    const attemptBind = () => {
      const video = document.getElementById('global-video-element') as HTMLVideoElement | null;
      if (video) {
        if ((videoRef as any).current !== video) {
          if (cleanupFunc) cleanupFunc();
          bindEvents(video);
        }
        
        // Ensure video is reparented to our portal (fixes orphan issue after loading screen)
        const portal = document.getElementById('global-video-portal');
        if (portal && video.parentElement !== portal) {
          portal.appendChild(video);
        }
      }
    };

    attemptBind();

    observer = new MutationObserver(attemptBind);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (observer) observer.disconnect();
      if (cleanupFunc) cleanupFunc();
    };
  }, []);

  useEffect(() => {
    if (watchTickData) {
      console.log('[Watch Tick State]:', watchTickData, rewardProgress);
    }
  }, [watchTickData, rewardProgress]);

  const bufferWatchdogRef = useRef<number | null>(null);

  
  // Interactive Comments State
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Sticker States
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickers, setStickers] = useState<ApiSticker[]>([]);
  const [stickerTab, setStickerTab] = useState<'owned' | 'store'>('owned');
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [isVipEligible, setIsVipEligible] = useState<boolean | null>(null);

  // Load stickers & check eligibility when picker opens
  useEffect(() => {
    if (!showStickerPicker || !isLoggedIn) return;

    const loadStickerData = async () => {
      setStickerLoading(true);
      setStickerError(null);
      if (!navigator.onLine) {
        setStickerError('Anda sedang offline. Tidak dapat memuat stiker.');
        setStickerLoading(false);
        return;
      }
      try {
        if (isVipEligible === null) {
          const eligibleRes = await fetchVipEligibility();
          if (!eligibleRes.data?.eligible) {
            setIsVipEligible(false);
            setStickerError(eligibleRes.data?.reason || 'Fitur ini khusus VIP');
            setStickerLoading(false);
            return;
          }
          setIsVipEligible(true);
        } else if (!isVipEligible) {
          setStickerError('Fitur ini khusus VIP');
          setStickerLoading(false);
          return;
        }

        const stickersRes = await fetchStickers();
        setStickers(stickersRes.data || []);
      } catch (err: any) {
        console.error('Error fetching sticker data:', err);
        setStickerError(err.message || 'Gagal memuat stiker');
      } finally {
        setStickerLoading(false);
      }
    };

    loadStickerData();
  }, [showStickerPicker, isLoggedIn, isVipEligible]);

  const handleSelectSticker = async (sticker: ApiSticker) => {
    if (!currentEpisode?.id) return;
    if (!navigator.onLine) {
      addToast('error', 'Anda sedang offline. Tidak dapat mengirim stiker.');
      return;
    }
    try {
      const stickerId = (sticker as any).itemId || (sticker as any).sticker_id || (sticker as any).item_id || sticker.id;
      const res = await postComment({
        episode_id: currentEpisode.id,
        content: sticker.image_url,
        kind: 'STICKER',
        sticker_id: stickerId,
        video_second: currentTime
      });
      if (res && res.data) {
        setComments((prev) => {
          if (prev.some((c) => c.id === res.data.id)) return prev;
          return [res.data, ...prev];
        });
      }
      setShowStickerPicker(false);
    } catch (err: any) {
      console.error('Failed to post sticker comment:', err);
      addToast('error', err.message || 'Gagal mengirim stiker');
    }
  };

  const handlePurchaseSticker = async (sticker: ApiSticker) => {
    if (!navigator.onLine) {
      addToast('error', 'Anda sedang offline. Tidak dapat membeli stiker.');
      return;
    }
    const itemId = (sticker as any).itemId || (sticker as any).sticker_id || (sticker as any).item_id || sticker.id;
    console.log('[DEBUG] Sticker Object:', sticker);
    console.log('[DEBUG] Computed itemId:', itemId);
    if (!itemId && itemId !== 0) {
      addToast('error', 'ID Stiker kosong! Lihat Console log (F12) untuk detail struktur stiker.');
    }
    setIsPurchasing(itemId);
    try {
      const res = await purchaseSticker(itemId, sticker.code);
      addToast('success', res.message || 'Stiker berhasil dibeli!');
      // Reload stickers list to update ownership
      const stickersRes = await fetchStickers();
      setStickers(stickersRes.data || []);
    } catch (err: any) {
      console.error('Failed to purchase sticker:', err);
      addToast('error', err.message || 'Gagal membeli stiker');
    } finally {
      setIsPurchasing(null);
    }
  };

  const controlsTimeoutRef = useRef<any | null>(null);
  // 1. Load Full Anime details on ID change (for sidebar episodes list & base metadata)
  useEffect(() => {
    if (!id) return;
    const loadAnimeDetail = async () => {
      if (!useDownloadStore.getState().isInitialized) {
        await useDownloadStore.getState().initDownloads();
      }
      try {
        if (!navigator.onLine) {
          throw new Error('Offline mode');
        }
        const detailRes = await fetchAnimeDetail(id);
        const data = detailRes.data;
        setAnime(data);
        setEpisodes(data.episodes ?? []);
      } catch (err) {
        console.error('Failed to load anime details:', err);
        // Fallback to offline stored data if available
        const offlineEpisode = useDownloadStore.getState().downloadedList.find(
          item => String(item.animeId) === String(id)
        );
        if (offlineEpisode && offlineEpisode.animeData) {
          setAnime(offlineEpisode.animeData);
          const offlineEps = useDownloadStore.getState().downloadedList
            .filter(item => String(item.animeId) === String(id))
            .map(item => item.episodeData);
          setEpisodes(offlineEps);
        }
      }
    };
    loadAnimeDetail();
  }, [id]);

  // 2. Load current episode details & navigation info
  // Use episodes from anime detail (already fetched) to avoid redundant API calls
  useEffect(() => {
    if (!id) return;
    const epKey = `${id}-${currentEpNum}`;

    // ─── FAST PATH: Kembali dari mini mode ─────────────────────────────────────
    // Cek apakah episode yang sama sedang aktif di GlobalMiniPlayer (survive remount)
    const playerState = usePlayerStore.getState();
    const globalVideo = document.getElementById('global-video-element') as HTMLVideoElement | null;
    const isSameEpActive =
      playerState.isActive &&
      playerState.currentEpKey === epKey &&
      playerState.currentEpisode !== null &&
      globalVideo !== null &&
      !globalVideo.error &&
      globalVideo.readyState >= 2; // HAVE_CURRENT_DATA or better

    if (isSameEpActive) {
      // Episode sama masih hidup di player global — sync UI tanpa fetch apapun
      loadedEpisodeKeyRef.current = epKey;
      setCurrentEpisode(playerState.currentEpisode!);
      // Build navigation dari episodes lokal jika tersedia
      if (episodes.length > 0) {
        const sorted = [...episodes].sort((a, b) => a.nomor_episode - b.nomor_episode);
        const idx = sorted.findIndex(e => e.nomor_episode === currentEpNum);
        setNavigation({
          previousEpisode: idx > 0 ? { id: sorted[idx - 1].id, nomor_episode: sorted[idx - 1].nomor_episode, judul_episode: sorted[idx - 1].judul_episode, thumbnail_episode: sorted[idx - 1].thumbnail_episode } : null,
          nextEpisode: idx < sorted.length - 1 ? { id: sorted[idx + 1].id, nomor_episode: sorted[idx + 1].nomor_episode, judul_episode: sorted[idx + 1].judul_episode, thumbnail_episode: sorted[idx + 1].thumbnail_episode } : null,
          totalEpisodes: sorted.length,
          currentEpisodeNumber: currentEpNum
        });
      }
      const nowPlaying = !globalVideo!.paused;
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(nowPlaying);
      setCurrentTime(globalVideo!.currentTime);
      setDuration(globalVideo!.duration || 0);
      // Pastikan video tetap play
      if (!nowPlaying && playerState.isPlaying) {
        globalVideo!.play().catch(() => {});
      }
      return;
    }
    // ───────────────────────────────────────────────────────────────────────────

    // Cancel any in-flight fetch for a previous episode
    if (loadEpisodeAbortRef.current) {
      loadEpisodeAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    loadEpisodeAbortRef.current = abortCtrl;

    // --- Cek global cache: jika episode sudah pernah dimuat dan video masih aktif ---
    const cachedEp = globalEpisodeCache.get(epKey);
    const videoViaRef = (videoRef as any).current as HTMLVideoElement | null;
    const videoViaId = document.getElementById('global-video-element') as HTMLVideoElement | null;
    const video = videoViaRef || videoViaId;
    const videoIsAlive = video && video.src && !video.error && video.readyState >= 2;

    if (
      loadedEpisodeKeyRef.current === epKey &&
      currentEpisode?.qualities?.length &&
      cachedEp &&
      videoIsAlive
    ) {
      // Episode data sudah ada & video hidup — restore posisi langsung tanpa reload HLS
      loadedEpisodeKeyRef.current = epKey;
      pendingSeekTimeRef.current = cachedEp.time > 2 ? cachedEp.time : null;
      pendingShouldPlayRef.current = cachedEp.wasPlaying;
      // Restore langsung ke video jika sudah siap
      Promise.resolve().then(() => {
        const v = (videoRef as any).current as HTMLVideoElement | null ||
                  document.getElementById('global-video-element') as HTMLVideoElement | null;
        if (!v || abortCtrl.signal.aborted) return;
        if (cachedEp.time > 2 && Math.abs(v.currentTime - cachedEp.time) > 1) {
          v.currentTime = cachedEp.time;
        }
        if (cachedEp.wasPlaying && v.paused) {
          v.play().catch(() => {});
        }
        setIsPlaying(cachedEp.wasPlaying);
        setCurrentTime(cachedEp.time);
        setIsBuffering(false);
      });
      return;
    }

    // Tandai episode sedang dimuat
    loadedEpisodeKeyRef.current = epKey;

    const loadEpisode = async () => {
      setIsLoading(true);
      setIsBuffering(true);
      setError(null);
      setComments([]);
      setActiveSourceIndex(0);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setStreamError(null);
      setIsChangingQuality(false);
      pendingSeekTimeRef.current = null;
      pendingSeekRatioRef.current = 0;
      pendingShouldPlayRef.current = false;
      lastSavedProgressBucketRef.current = -1;

      // Pause & reset HLS video untuk episode baru
      const v = (videoRef as any).current as HTMLVideoElement | null;
      if (v) {
        v.pause();
      }

      if (abortCtrl.signal.aborted) return;

      try {
        // Try to find episode from already-fetched episodes list first
        const localEp = episodes.find(e => e.nomor_episode === currentEpNum);
        if (localEp) {
          if (abortCtrl.signal.aborted) return;
          setCurrentEpisode(localEp);
          // Build navigation from local episodes list
          const sorted = [...episodes].sort((a, b) => a.nomor_episode - b.nomor_episode);
          const idx = sorted.findIndex(e => e.nomor_episode === currentEpNum);
          setNavigation({
            previousEpisode: idx > 0 ? { id: sorted[idx - 1].id, nomor_episode: sorted[idx - 1].nomor_episode, judul_episode: sorted[idx - 1].judul_episode, thumbnail_episode: sorted[idx - 1].thumbnail_episode } : null,
            nextEpisode: idx < sorted.length - 1 ? { id: sorted[idx + 1].id, nomor_episode: sorted[idx + 1].nomor_episode, judul_episode: sorted[idx + 1].judul_episode, thumbnail_episode: sorted[idx + 1].thumbnail_episode } : null,
            totalEpisodes: sorted.length,
            currentEpisodeNumber: currentEpNum
          });
          // Fetch full episode detail (with qualities) from API in background
          // Only update if the user is still on the same episode
          // Skip if episode is downloaded — offline blob is already playing, no need to refresh
          const isDownloadedEp = isEpisodeDownloaded(localEp.id);
          if (navigator.onLine && !isDownloadedEp) {
            fetchEpisodeByNumber(id, currentEpNum).then(res => {
              if (res.data?.episode && loadedEpisodeKeyRef.current === epKey && !abortCtrl.signal.aborted) {
                setCurrentEpisode(res.data.episode);
                setNavigation(res.data.navigation);
              }
            }).catch(() => {});
          }
        } else if (navigator.onLine) {
          // Episode not in local list, fetch from API
          const epRes = await fetchEpisodeByNumber(id, currentEpNum);
          if (abortCtrl.signal.aborted) return;
          if (epRes.data?.episode) {
            setCurrentEpisode(epRes.data.episode);
            setNavigation(epRes.data.navigation);
          }
        } else {
          throw new Error('Offline mode');
        }
      } catch (err: any) {
        if (abortCtrl.signal.aborted) return;
        console.error(err);
        // Fallback to offline stored data if available
        const offlineItem = useDownloadStore.getState().downloadedList.find(
          item => String(item.animeId) === String(id) && String(item.episodeNumber) === String(currentEpNum)
        );
        if (offlineItem) {
          setCurrentEpisode(offlineItem.episodeData);
          setNavigation({
            previousEpisode: null,
            nextEpisode: null,
            totalEpisodes: 1,
            currentEpisodeNumber: Number(currentEpNum)
          });
          setError(null);
        } else {
          setError(err.message || 'Gagal memuat detail episode');
        }
      } finally {
        if (!abortCtrl.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadEpisode();
  }, [id, currentEpNum, episodes]);

  // Safety timeout: if buffering doesn't clear within 15s, force-clear it
  useEffect(() => {
    if (!currentEpisode?.id) return;
    const timeout = window.setTimeout(() => {
      setIsBuffering(false);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [currentEpisode?.id]);

  // Simpan episode ID terakhir untuk mencegah reset comments saat episode tidak berubah
  const lastCommentEpIdRef = useRef<number | null>(null);

  // 3. Load comments & start realtime SSE stream on active episode change
  useEffect(() => {
    if (!currentEpisode?.id) {
      // Hanya clear jika benar-benar tidak ada episode
      if (lastCommentEpIdRef.current !== null) {
        setComments([]);
        lastCommentEpIdRef.current = null;
      }
      return;
    }

    // Jika episode ID sama (misal kembali dari mini mode), jangan reset komentar
    const isNewEpisode = lastCommentEpIdRef.current !== currentEpisode.id;
    if (!isNewEpisode) {
      // Episode sama, tidak perlu reload SSE/comments
      return;
    }
    lastCommentEpIdRef.current = currentEpisode.id;

    let cancelled = false;
    setComments([]); // Hanya clear saat ganti episode yang berbeda

    // Fetch initial list
    const loadComments = async () => {
      if (!navigator.onLine) return;
      try {
        const res = await fetchComments({ episodeId: currentEpisode.id, take: 50 });
        if (!cancelled && res.comments) {
          const freshComments = res.comments.filter(c => !c.is_delete);
          // Merge dengan komentar yang sudah ada (optimistic updates) — deduplicate by ID
          setComments(prev => {
            const existingIds = new Set(freshComments.map(c => c.id));
            // Komentar lokal yang belum ada di server (optimistic) tetap dipertahankan di atas
            const localOnly = prev.filter(c => !existingIds.has(c.id));
            return [...localOnly, ...freshComments];
          });
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    };

    loadComments();

    let es: EventSource | null = null;
    
    // Setup SSE connection only if online
    if (navigator.onLine) {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
      es = new EventSource(`${baseUrl}/comments/sse/stream?episodeId=${currentEpisode.id}`);

      es.addEventListener('new_comment', (e) => {
        try {
          const comment = JSON.parse(e.data);
          if (comment && !comment.is_delete) {
            setComments((prev) => {
              if (prev.some((c) => c.id === comment.id)) return prev;
              return [comment, ...prev];
            });
          }
        } catch (err) {
          console.error('Failed to parse SSE comment:', err);
        }
      });

      es.onerror = () => {
        console.warn('SSE EventSource disconnected, browser will auto-reconnect');
      };
    }

    return () => {
      cancelled = true;
      if (es) {
        es.close();
      }
    };
  }, [currentEpisode?.id]);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isDownloaded = currentEpisode ? isEpisodeDownloaded(currentEpisode.id) : false;
  const isLoginRestricted = !isLoggedIn && !isDownloaded && !isOffline;
  const isUserVip = isLoggedIn && !!userProfile?.isVip;
  const isVipRestricted = !isLoginRestricted && !!currentEpisode?.early_access && !isUserVip && !isDownloaded && !isOffline;
  const hasRealSources = !!offlineVideoUrl || !!currentEpisode?.hls_master_url || 
    (currentEpisode?.qualities && currentEpisode.qualities.length > 0 && 
      currentEpisode.qualities.some(q => !!q.source_quality || !!q.hls_url));
  const isSourceNotFound = currentEpisode && !isLoginRestricted && !isVipRestricted && !hasRealSources;

  const getVideoSourceCandidates = () => {
    if (!currentEpisode) return [];
    if (isLoginRestricted) return [];
    if (isVipRestricted) return [];
    
    // Prioritize local offline video URL if available
    if (offlineVideoUrl) {
      return [offlineVideoUrl];
    }

    if (!hasRealSources) return [];

    const candidates: string[] = [];
    const isAutoQuality = String(videoQuality) === 'auto';
    const pushUnique = (value?: string | null) => {
      if (!value) return;
      if (!candidates.includes(value)) candidates.push(value);
    };

    const selectedQuality = currentEpisode.qualities?.find((item) => item.nama_quality === videoQuality);
    const firstQuality = currentEpisode.qualities?.[0];

    // Manual quality selection prioritizes the direct source first so startup is faster.
    if (!isAutoQuality) {
      if (selectedQuality) {
        pushUnique(selectedQuality.source_quality);
        pushUnique(selectedQuality.hls_url);
      } else if (firstQuality) {
        pushUnique(firstQuality.source_quality);
        pushUnique(firstQuality.hls_status === 'DONE' ? firstQuality.hls_url : null);
      }
    }

    // Auto mode prefers the master playlist first.
    if (isAutoQuality) {
      pushUnique(currentEpisode.hls_master_url);
      if (selectedQuality) {
        pushUnique(selectedQuality.hls_status === 'DONE' ? selectedQuality.hls_url : null);
        pushUnique(selectedQuality.source_quality);
      }
    } else {
      // Keep the master playlist as a fallback for manual mode.
      pushUnique(currentEpisode.hls_master_url);
    }

    // Then walk remaining qualities as fallbacks.
    currentEpisode.qualities?.forEach((quality) => {
      pushUnique(quality.hls_status === 'DONE' ? quality.hls_url : null);
      pushUnique(quality.source_quality);
    });

    return candidates;
  };

  const videoSources = getVideoSourceCandidates();
  const videoSource = videoSources[activeSourceIndex] ?? videoSources[0] ?? '';
  const isHls = /\.m3u8(\?|#|$)/i.test(videoSource);

  const advanceToFallbackSource = (reason: string) => {
    setIsChangingQuality(false);
    setIsBuffering(true);
    setStreamError(null);

    const nextIndex = Math.min(activeSourceIndex + 1, Math.max(videoSources.length - 1, 0));
    if (nextIndex > activeSourceIndex) {
      if (videoRef.current) {
        pendingSeekTimeRef.current = videoRef.current.currentTime || pendingSeekTimeRef.current;
        pendingShouldPlayRef.current = !videoRef.current.paused;
      }
      setActiveSourceIndex(nextIndex);
      return;
    }

    setIsBuffering(false);
    setStreamError(reason || 'Stream tidak bisa dimuat. Coba lagi beberapa saat.');
  };

  useEffect(() => {
    if (!isBuffering) {
      if (bufferWatchdogRef.current) {
        window.clearTimeout(bufferWatchdogRef.current);
        bufferWatchdogRef.current = null;
      }
      return;
    }

    if (bufferWatchdogRef.current) {
      window.clearTimeout(bufferWatchdogRef.current);
    }

    bufferWatchdogRef.current = window.setTimeout(() => {
      if (bufferWatchdogRef.current) {
        bufferWatchdogRef.current = null;
      }
      advanceToFallbackSource('Loading terlalu lama, mencoba sumber lain...');
    }, 12000);

    return () => {
      if (bufferWatchdogRef.current) {
        window.clearTimeout(bufferWatchdogRef.current);
        bufferWatchdogRef.current = null;
      }
    };
  }, [isBuffering, videoSource, activeSourceIndex]);

  // Sync with Global Mini Player
  useEffect(() => {
    if (anime && currentEpisode && videoSource) {
      usePlayerStore.getState().setPlayData(anime, currentEpisode, currentEpNum, videoSource);
      usePlayerStore.getState().setIsMiniMode(false);
    }
  }, [anime, currentEpisode, currentEpNum, videoSource]);

  // Activate Mini Mode when unmounting WatchPage
  useEffect(() => {
    return () => {
      const state = usePlayerStore.getState();
      if (state.isActive) {
        if (state.isPlaying) {
          state.setIsMiniMode(true);
        } else {
          state.closePlayer();
        }
      }
    };
  }, []);

  // 3. Removed local HLS.js logic. Now handled by GlobalMiniPlayer.
  useEffect(() => {
    // We still need to handle activeSourceIndex reset if needed, but HLS is done outside.
    let destroyed = false;

    return () => {
      destroyed = true;
    };
  }, [videoSource, activeSourceIndex, videoSources.length]);

  // Reset playback targets when the episode changes so the next metadata load can restore state cleanly
  useEffect(() => {
    if (!currentEpisode || !anime) return;

    const epKey = `${anime.id}-${currentEpNum}`;

    // Cek DOM video element langsung (bukan videoRef yang mungkin belum bind saat mount)
    const liveVideo = (videoRef.current as HTMLVideoElement | null) ||
                      (document.getElementById('global-video-element') as HTMLVideoElement | null);
    const isAlreadyPlayingThisEp = liveVideo &&
      !liveVideo.paused &&
      liveVideo.currentTime > 0 &&
      liveVideo.duration > 0;

    if (isAlreadyPlayingThisEp) {
      // Sinkronkan state UI tanpa memicu reset
      setIsPlaying(true);
      setIsBuffering(false);
      setCurrentTime(liveVideo!.currentTime);
      setDuration(liveVideo!.duration);
      // Update global cache
      globalEpisodeCache.set(epKey, { time: liveVideo!.currentTime, wasPlaying: true });
      return;
    }

    // Cek apakah ada cache global untuk episode ini (user kembali ke episode sebelumnya)
    const cached = globalEpisodeCache.get(epKey);
    if (cached) {
      pendingSeekTimeRef.current = cached.time > 2 ? cached.time : null;
      pendingSeekRatioRef.current = 0;
      pendingShouldPlayRef.current = cached.wasPlaying;
    } else {
      const historyRecord = watchHistory.find(
        (h) => h.animeId === String(anime.id) && h.episodeNumber === currentEpNum
      );

      const searchParams = new URLSearchParams(location.search);
      const targetSecond = searchParams.get('t');

      if (targetSecond && !isNaN(Number(targetSecond))) {
        pendingSeekTimeRef.current = Number(targetSecond);
        pendingSeekRatioRef.current = 0;
      } else {
        pendingSeekTimeRef.current = null;
        pendingSeekRatioRef.current = historyRecord?.progress ?? 0;
      }

      pendingShouldPlayRef.current = true;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setIsBuffering(true);
    lastSavedProgressBucketRef.current = -1;
  }, [anime?.id, currentEpisode?.id, currentEpNum, location.search]);

  useEffect(() => {
    setActiveSourceIndex(0);
    setStreamError(null);
  }, [currentEpisode?.id, videoQuality]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          toggleMiniPlayer();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoVolume, isFullscreen, isPlaying]);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);


  // Fade out controls on idle mouse
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !anime || !currentEpisode) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);

    // Update global episode cache setiap 1 detik agar bertahan lintas mount/unmount
    const epKey = `${anime.id}-${currentEpisode.nomor_episode}`;
    const lastCache = globalEpisodeCache.get(epKey);
    if (!lastCache || Math.abs(current - lastCache.time) >= 1) {
      globalEpisodeCache.set(epKey, { time: current, wasPlaying: !videoRef.current.paused });
    }
    
    // Save progress once per 10-second bucket to avoid spamming storage/backend
    const progressBucket = Math.floor(current / 10);
    if (current > 10 && progressBucket !== lastSavedProgressBucketRef.current) {
      lastSavedProgressBucketRef.current = progressBucket;
      const isCompleted = current / dur > 0.9;
      // Save locally
      addWatchHistory(
        String(anime.id),
        anime.nama_anime,
        String(anime.id),
        currentEpisode.nomor_episode,
        currentEpisode.judul_episode || `Episode ${currentEpisode.nomor_episode}`,
        current / dur,
        anime.gambar_anime
      );

      // Save to backend if authenticated and online
      if (isLoggedIn && navigator.onLine) {
        saveEpisodeProgress(currentEpisode.id, current, isCompleted).catch(console.error);
      }
    }
  };

  // Watch Tick API: send tick every 60 seconds while video is playing
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setDuration(nextDuration);
    setIsBuffering(false);

    const seekTime =
      pendingSeekTimeRef.current ??
      (pendingSeekRatioRef.current > 0 && nextDuration > 0 ? pendingSeekRatioRef.current * nextDuration : null);

    if (seekTime !== null && Number.isFinite(seekTime) && seekTime >= 0) {
      let targetTime = seekTime;
      if (Number.isFinite(nextDuration) && nextDuration > 0) {
        targetTime = Math.min(seekTime, Math.max(0, nextDuration - 0.25));
      }
      try {
        video.currentTime = targetTime;
        setCurrentTime(video.currentTime);
      } catch (e) {
        console.error('Failed to seek video:', e);
      }
    }

    if (pendingShouldPlayRef.current) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    pendingSeekTimeRef.current = null;
    pendingSeekRatioRef.current = 0;
    pendingShouldPlayRef.current = false;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        console.error('Gagal memutar video');
      });
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const adjustVolume = (delta: number) => {
    const newVol = Math.max(0, Math.min(1, videoVolume + delta));
    setVideoVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setMuted(newVol === 0);
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVideoVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !muted;
    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && videoVolume === 0) {
      setVideoVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleProgressSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        console.error('Gagal masuk ke mode Fullscreen');
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMiniPlayer = () => {
    const state = usePlayerStore.getState();
    if (state.isActive && state.isMiniMode) {
      // Return to full player
      state.setIsMiniMode(false);
      navigate(`/watch/${state.currentAnime?.id}/ep/${state.currentEpNum}`);
    } else if (state.isActive && !state.isMiniMode) {
      // Jika fullscreen, keluar dulu
      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => {
          state.setIsMiniMode(true);
          navigate('/');
        }).catch(() => {
          state.setIsMiniMode(true);
          navigate('/');
        });
      } else {
        // Go to mini player
        state.setIsMiniMode(true);
        navigate('/');
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setOpenSettings('none');
  };

  const changeQuality = (quality: any) => {
    if (videoRef.current) {
      pendingSeekTimeRef.current = videoRef.current.currentTime;
      pendingSeekRatioRef.current = 0;
      pendingShouldPlayRef.current = !videoRef.current.paused;
      setIsChangingQuality(true);
      setIsBuffering(true);
    }
    setVideoQuality(quality);
    setOpenSettings('none');
  };

  // Handle Comment Submission dengan Optimistic Update
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      addToast('error', 'Anda sedang offline. Tidak dapat mengirim komentar.');
      return;
    }
    if (!isLoggedIn) {
      addToast('error', 'Login terlebih dahulu untuk berkomentar!');
      return;
    }
    const text = newCommentText.trim();
    if (!text || !currentEpisode?.id) return;

    // Optimistic update: tampilkan komentar langsung di UI sebelum response server
    const tempId = -(Date.now()); // ID negatif sementara agar tidak bentrok dengan ID server
    const optimisticComment: ApiComment = {
      id: tempId,
      content: text,
      kind: 'TEXT',
      video_second: currentTime,
      createdAt: new Date().toISOString(),
      is_delete: false,
      user: {
        id: userProfile?.id ?? 0,
        username: userProfile?.username || '',
        profile: {
          full_name: userProfile?.name || userProfile?.username || '',
          avatar_url: userProfile?.avatarUrl || '',
        } as any,
      } as any,
      _count: { likes: 0 } as any,
      likedByMe: false,
    } as any;

    // Tambahkan ke atas daftar komentar
    setComments(prev => [optimisticComment, ...prev]);
    setNewCommentText(''); // Clear input segera

    try {
      const res = await postComment({
        episode_id: currentEpisode.id,
        content: text,
        kind: 'TEXT',
        video_second: currentTime
      });

      if (res && res.data) {
        // Ganti optimistic comment dengan data asli dari server
        setComments((prev) => {
          const withoutTemp = prev.filter(c => c.id !== tempId);
          if (withoutTemp.some(c => c.id === res.data.id)) return withoutTemp;
          return [res.data, ...withoutTemp];
        });
      }
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      // Hapus optimistic comment jika gagal
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewCommentText(text); // Kembalikan teks ke input
      addToast('error', err.message || 'Gagal mengirim komentar');
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      addToast('error', 'Login terlebih dahulu untuk menyukai komentar!');
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.likedByMe;

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likedByMe: !wasLiked,
          _count: {
            ...c._count,
            likes: (c._count?.likes ?? 0) + (wasLiked ? -1 : 1)
          } as any
        };
      }
      return c;
    }));

    try {
      if (wasLiked) {
        await unlikeComment(commentId);
      } else {
        await likeComment(commentId);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert on error
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likedByMe: wasLiked,
            _count: {
              ...c._count,
              likes: (c._count?.likes ?? 0) + (wasLiked ? 1 : -1)
            } as any
          };
        }
        return c;
      }));
    }
  };

  // Helper variables for intro & outro skip markers
  const introStart = currentEpisode?.intro_start_seconds ?? 0;
  const introEnd = introStart + (currentEpisode?.intro_duration_seconds ?? 0);
  const showSkipIntro = isPlaying &&
                         !isChangingQuality &&
                         !isBuffering &&
                         (currentEpisode?.intro_duration_seconds ?? 0) > 0 && 
                         currentTime >= introStart && 
                         currentTime <= introEnd;

  const outroStart = currentEpisode?.outro_start_seconds ?? 0;
  const outroEnd = outroStart + (currentEpisode?.outro_duration_seconds ?? 0);
  const showSkipOutro = isPlaying &&
                         !isChangingQuality &&
                         !isBuffering &&
                         (currentEpisode?.outro_duration_seconds ?? 0) > 0 && 
                         outroStart > introEnd &&
                         currentTime >= outroStart && 
                         currentTime <= outroEnd;



  // Only show skeleton on initial load (no anime data yet)
  if (isLoading && !anime) {
    return <WatchPageSkeleton />;
  }

  // Show skeleton when anime exists but episode is still loading on first visit
  if (isLoading && anime && !currentEpisode) {
    return <WatchPageSkeleton />;
  }

  if (error || !anime) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold">{error || 'Episode tidak ditemukan!'}</h2>
        <Link to="/" className="text-primary hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const isFilm = anime?.content_type === 'FILM';

  return (
    <div className="pb-16 space-y-6">
      
      {/* Back to details link */}
      {!isMiniMode && (
        <button 
          onClick={() => {
            if (anime) navigate(`/anime/${anime.id}`, { replace: true });
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Detail Anime</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Area: Player, Title, comments */}
        <div className={`${isFilm ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          
          {/* Video Player Box */}
          <div 
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseMove}
            className={`relative w-full bg-black overflow-hidden select-none group/player ${
              isFullscreen ? 'h-screen w-screen border-none rounded-none' : 
              isMiniMode ? 'aspect-[16/9] rounded-2xl border border-border/40 bg-black/50' : 'aspect-[16/9] rounded-2xl border border-border/40 shadow-2xl'
            }`}
          >
            {/* Floating XP Animation */}
            {floatingXp && (
              <div 
                key={floatingXp.id}
                className="absolute top-6 right-6 z-50 animate-float-up pointer-events-none"
              >
                <div className="bg-yellow-500 text-white font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-400/50 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-white" />
                  +{floatingXp.amount} XP
                </div>
              </div>
            )}

            {/* Episode Switch / Buffering Overlay — jangan tampil jika video sudah playing (kembali dari mini) */}
            {((isLoading && !!anime) || (isBuffering && !!currentEpisode && !isChangingQuality && !isPlaying)) && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium animate-pulse text-white tracking-widest">
                  {isLoading ? `MEMUAT EPISODE ${currentEpNum}...` : 'MEMUAT...'}
                </p>
              </div>
            )}

            {/* Custom Video Element from Portal (Always rendered to avoid orphaning the video) */}
            <div 
              id="global-video-portal" 
              className={`w-full h-full flex items-center justify-center cursor-pointer ${
                (isLoginRestricted || isVipRestricted || isSourceNotFound) ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />

            {/* Custom controls overlay wrapper */}
            {(!isLoginRestricted && !isVipRestricted && !isSourceNotFound) && (
              <div 
                className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
              >
                {/* Top bar (Minimalist Header) */}
                <div 
                  className="p-4 sm:p-6 flex items-start gap-4 pointer-events-auto w-full text-left"
                  style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => {
                      if (isFullscreen) {
                        toggleFullscreen();
                      } else if (anime) {
                        navigate(`/anime/${anime.id}`, { replace: true });
                      }
                    }}
                    className="w-8 h-8 bg-black/40 border border-white/10 text-white rounded-lg transition-all focus:outline-none cursor-pointer flex items-center justify-center shadow-lg"
                    title={isFullscreen ? "Keluar Layar Penuh" : "Kembali ke Detail Anime"}
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </button>

                  <div className="flex flex-col select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                        {anime?.label_anime ?? anime?.content_type ?? 'ANIME'}
                      </span>
                      <h2 className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-md">
                        {anime?.nama_anime}
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary mt-0.5 drop-shadow-md">
                      {isFilm ? 'Film Movie' : `Episode ${currentEpisode?.nomor_episode ?? currentEpNum}`} {currentEpisode?.judul_episode ? `• ${currentEpisode.judul_episode}` : ''}
                    </span>
                  </div>
                </div>

                {/* Center buffering or loading spinner space */}
                <div className="flex-1 flex items-center justify-center pointer-events-none" />

                {/* Bottom control panel on gradient background */}
                <div 
                  className="w-full pointer-events-auto mt-auto pt-12 pb-4 px-4 sm:px-6 space-y-3"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Timeline/Progress Bar */}
                  <div className="flex items-center gap-3 group/progress">
                    <span className="text-[10px] font-bold font-mono text-text-secondary min-w-[36px] text-right select-none">
                      {formatDuration(currentTime)}
                    </span>
                    
                    <div className="flex-1 py-1.5 flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleProgressSeek}
                        className="w-full player-progress-slider cursor-pointer focus:outline-none"
                        style={{
                          '--value-percent': `${(currentTime / (duration || 1)) * 100}%`
                        } as React.CSSProperties}
                      />
                    </div>

                    <span className="text-[10px] font-bold font-mono text-text-secondary min-w-[36px] select-none">
                      {formatDuration(duration)}
                    </span>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex items-center justify-between">
                    
                    {/* Left side: Play, Skip backward/forward, Volume, time display */}
                    <div className="flex items-center gap-4">
                      
                      <button 
                        onClick={togglePlay}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                        title={isPlaying ? "Jeda (Spasi)" : "Putar (Spasi)"}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        )}
                      </button>

                      <button 
                        onClick={() => skipTime(-10)}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                        title="Mundur 10 detik (←)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => skipTime(10)}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                        title="Maju 10 detik (→)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {/* Volume controls */}
                      <div className="flex items-center gap-2 group/volume">
                        <button 
                          onClick={toggleMute}
                          className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                          title={muted ? "Nyalakan Suara (M)" : "Senyap (M)"}
                        >
                          {muted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>

                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={muted ? 0 : videoVolume}
                          onChange={handleVolumeSliderChange}
                          className="w-16 sm:w-0 sm:overflow-hidden sm:opacity-0 sm:group-hover/volume:w-16 sm:group-hover/volume:opacity-100 opacity-100 transition-all duration-300 player-volume-slider cursor-pointer focus:outline-none"
                          style={{
                            '--volume-percent': `${(muted ? 0 : videoVolume) * 100}%`
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Timeline duration status badge */}
                      <span className="hidden sm:inline-block text-[10px] font-bold text-text-secondary/70 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md select-none font-mono">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>

                    </div>

                    {/* Right side: Skip Intro/Outro, Settings, Fullscreen */}
                    <div className="flex items-center gap-3">
                      
                      {/* Skip Intro Overlay Button */}
                      {showSkipIntro && (
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = introEnd;
                              setCurrentTime(introEnd);
                            }
                          }}
                          className="bg-primary text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95 shadow-glow flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>LEWATI INTRO</span>
                          <ArrowRight className="w-3.5 h-3.5 text-black" />
                        </button>
                      )}

                      {/* Skip Outro Overlay Button */}
                      {showSkipOutro && (
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = outroEnd;
                              setCurrentTime(outroEnd);
                            }
                          }}
                          className="bg-primary text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95 shadow-glow flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>LEWATI OUTRO</span>
                          <ArrowRight className="w-3.5 h-3.5 text-black" />
                        </button>
                      )}

                      {/* Settings (Speed/Quality) Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenSettings(prev => prev === 'none' ? 'quality' : 'none')}
                          className="text-white transition-all duration-200 focus:outline-none p-1 cursor-pointer active:scale-90"
                          title="Pengaturan"
                        >
                          <Settings className="w-4.5 h-4.5" />
                        </button>

                        {/* Settings Menu Panel */}
                        {openSettings !== 'none' && (
                          <div className="absolute bottom-10 right-0 w-48 bg-bg-elevated dark:bg-black/95 border border-border/40 dark:border-white/10 rounded-xl p-2.5 shadow-2xl z-30 space-y-1 backdrop-blur-md">
                            
                            {/* Quality Menu Header */}
                            <div className="flex justify-between border-b border-border/40 dark:border-white/10 pb-1.5 mb-1.5 select-none text-left">
                              <span className="text-[10px] font-bold text-text-secondary tracking-wider">
                                {openSettings === 'quality' ? 'KUALITAS VIDEO' : 'KECEPATAN'}
                              </span>
                              <button
                                onClick={() => setOpenSettings(openSettings === 'quality' ? 'speed' : 'quality')}
                                className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
                              >
                                {openSettings === 'quality' ? 'Kecepatan' : 'Kualitas'}
                              </button>
                            </div>

                            {/* Menu Options */}
                            {openSettings === 'quality' ? (
                              <div className="space-y-0.5 text-left">
                                <button
                                  onClick={() => changeQuality('auto')}
                                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                    String(videoQuality) === 'auto' ? 'bg-primary text-black font-bold' : 'text-text-primary hover:bg-bg-elevated dark:hover:bg-white/5'
                                  }`}
                                >
                                  Auto Adaptive
                                </button>
                                {currentEpisode?.qualities?.map((q) => (
                                  <button
                                    key={q.id}
                                    onClick={() => changeQuality(q.nama_quality)}
                                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                      String(videoQuality) === q.nama_quality ? 'bg-primary text-black font-bold' : 'text-text-primary hover:bg-bg-elevated dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <span>{q.nama_quality}</span>
                                    {q.hls_size && (
                                      <span className={`text-[8.5px] font-semibold ${String(videoQuality) === q.nama_quality ? 'text-black/75' : 'text-text-secondary'}`}>
                                        {q.hls_size}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-0.5 text-left">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                  <button
                                    key={speed}
                                    onClick={() => changeSpeed(speed)}
                                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                      playbackRate === speed ? 'bg-primary text-black font-bold' : 'text-text-primary hover:bg-bg-elevated dark:hover:bg-white/5'
                                    }`}
                                  >
                                    {speed === 1 ? 'Normal' : `${speed}x`}
                                  </button>
                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </div>

                      {/* Mini Player Button */}
                      <button 
                        onClick={toggleMiniPlayer}
                        className="text-white transition-all duration-200 focus:outline-none p-1 cursor-pointer active:scale-90"
                        title="Mini Player (P)"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H11V15H19V11ZM21 19H3C1.89543 19 1 18.1046 1 17V7C1 5.89543 1.89543 5 3 5H21C22.1046 5 23 5.89543 23 7V17C23 18.1046 22.1046 19 21 19ZM21 17V7H3V17H21Z" />
                        </svg>
                      </button>

                      {/* Fullscreen Button */}
                      <button 
                        onClick={toggleFullscreen}
                        className="text-white transition-all duration-200 focus:outline-none p-1 cursor-pointer active:scale-90"
                        title={isFullscreen ? "Keluar Layar Penuh (F)" : "Layar Penuh (F)"}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-5 h-5" />
                        ) : (
                          <Maximize2 className="w-5 h-5" />
                        )}
                      </button>

                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* Glowing Buffering/Loading Spinner Overlay */}
            {!isLoginRestricted && !isVipRestricted && !isSourceNotFound && (isBuffering || isChangingQuality) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none transition-all duration-300">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}

            {!isLoginRestricted && !isVipRestricted && !isSourceNotFound && streamError && !isBuffering && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 px-6 text-center"
              >
                <div className="max-w-sm space-y-3 rounded-2xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-white">Player bermasalah</h4>
                  <p className="text-xs text-white/70 leading-relaxed">{streamError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStreamError(null);
                      setActiveSourceIndex(0);
                      if (videoRef.current) {
                        pendingSeekTimeRef.current = videoRef.current.currentTime;
                        pendingShouldPlayRef.current = !videoRef.current.paused;
                      }
                      setIsBuffering(true);
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-black hover:bg-primary-light transition-colors"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            )}

            {/* Login Restricted Overlay */}
            {isLoginRestricted && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center backdrop-blur-md">
                <div className="max-w-md space-y-5 p-6 sm:p-8 rounded-3xl border border-primary/20 bg-black/60 shadow-[0_0_50px_rgba(255,102,205,0.1)] animate-scale-up">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 text-primary shadow-[0_0_20px_rgba(255,102,205,0.2)]">
                    <Lock className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Akses Menonton Terbatas
                    </h3>
                    <p className="text-xs sm:text-sm text-primary-light font-bold tracking-wide uppercase font-mono">
                      Harap Login Terlebih Dahulu
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                      Silakan masuk atau buat akun baru terlebih dahulu untuk menikmati pemutaran video dan mengakses fitur interaktif lainnya secara lengkap.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-xs font-black text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,102,205,0.3)] cursor-pointer"
                    >
                      Masuk / Daftar Sekarang
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIP Access Restricted Overlay */}
            {isVipRestricted && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center backdrop-blur-md">
                <div className="max-w-md space-y-5 p-6 sm:p-8 rounded-3xl border border-yellow-500/20 bg-black/60 shadow-[0_0_50px_rgba(234,179,8,0.1)] animate-scale-up">
                  <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <Lock className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Akses Awal (Early Access)
                    </h3>
                    <p className="text-xs sm:text-sm text-yellow-500/90 font-bold tracking-wide uppercase font-mono">
                      Khusus Member VIP
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                      Episode ini baru dirilis sebagai Akses Awal. Upgrade akun Anda ke VIP untuk menikmati episode ini lebih cepat!
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/profile')}
                      className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-6 py-3 text-xs font-black text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_0_25px_rgba(234,179,8,0.3)] cursor-pointer"
                    >
                      Aktifkan VIP Sekarang
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Source Video Not Found Overlay */}
            {isSourceNotFound && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center backdrop-blur-md">
                <div className="max-w-md space-y-5 p-6 sm:p-8 rounded-3xl border border-pink-500/20 bg-black/60 shadow-[0_0_50px_rgba(255,102,205,0.1)] animate-scale-up">
                  <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/30 text-primary shadow-[0_0_20px_rgba(255,102,205,0.2)]">
                    <VideoOff className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Sumber Video Tidak Ditemukan
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                      Maaf, media video untuk episode ini belum tersedia atau sedang dalam perbaikan. Silakan hubungi admin atau coba lagi nanti.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/anime/${anime?.id}`)}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-xs font-black text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,102,205,0.3)] cursor-pointer"
                    >
                      Kembali ke Detail Anime
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <>
              {/* Episode Meta Info and Navigation */}
              <div className="bg-bg-sidebar/65 backdrop-blur-sm border border-border/30 rounded-2xl p-5 sm:p-6 text-left space-y-4 shadow-lg">
                
                {/* Main Title and Navigation Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-pink-600 dark:text-primary uppercase tracking-widest font-mono">Sedang Diputar</span>
                <h1 className="text-xl sm:text-2xl font-black font-heading text-text-primary leading-tight tracking-tight">
                  {anime.nama_anime}
                </h1>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                  <span className="bg-primary/10 dark:bg-primary/20 text-pink-700 dark:text-primary-light font-mono font-bold text-xs px-2 py-0.5 rounded border border-primary/20 whitespace-nowrap">
                    {isFilm ? 'FILM MOVIE' : `EPISODE ${currentEpisode?.nomor_episode ?? currentEpNum}`}
                  </span>
                  <span className="font-semibold text-text-primary truncate">{currentEpisode?.judul_episode ?? `Episode ${currentEpNum}`}</span>
                </div>
              </div>

              {/* Navigation & Download Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Download Controls */}
                {currentEpisode && (
                  <div className="relative" ref={downloadMenuRef}>
                    {downloadingState[currentEpisode.id]?.state === 'downloading' ? (
                      <button
                        onClick={() => cancelDownload(currentEpisode.id)}
                        className="relative flex items-center gap-1.5 px-4 py-2.5 bg-bg-base border border-border/60 text-xs font-bold text-text-primary rounded-xl overflow-hidden hover:border-red-500 hover:text-red-400 transition-all active:scale-95 shadow-sm focus:outline-none cursor-pointer group"
                        title="Batalkan Unduhan"
                      >
                        {/* Background Progress Bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-300 ease-linear z-0" 
                          style={{ width: `${downloadingState[currentEpisode.id]?.progress || 0}%` }}
                        />
                        <div className="relative z-10 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary group-hover:text-red-400" />
                          <span>Mengunduh... {downloadingState[currentEpisode.id]?.progress}%</span>
                        </div>
                      </button>
                    ) : isEpisodeDownloaded(currentEpisode.id) ? (
                      <button
                        onClick={async () => {
                          if (await confirm({
                            title: 'Hapus Unduhan',
                            message: 'Apakah Anda yakin ingin menghapus episode unduhan ini?',
                            confirmText: 'Hapus',
                            variant: 'danger'
                          })) {
                            deleteDownload(currentEpisode.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-xs font-bold text-green-400 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 shadow-sm focus:outline-none cursor-pointer group/dl"
                        title="Hapus Unduhan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-green-400 group-hover/dl:text-white" />
                        <span>Tersimpan</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleDownloadClick}
                          className={`flex items-center gap-1.5 px-4 py-2.5 bg-bg-base hover:bg-bg-elevated border rounded-xl transition-all active:scale-95 shadow-sm focus:outline-none cursor-pointer ${
                            showDownloadDropdown ? 'border-primary text-primary' : 'border-border/60 hover:border-primary/40 text-text-primary'
                          }`}
                          title="Unduh Episode"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>
                        
                        {/* Quality Dropdown Menu */}
                        {showDownloadDropdown && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-bg-elevated dark:bg-black/95 border border-border/40 dark:border-white/10 rounded-xl p-2 shadow-2xl z-40 space-y-1 backdrop-blur-md">
                            <div className="px-2.5 py-1 border-b border-border/40 dark:border-white/10 text-left select-none">
                              <span className="text-[9.5px] font-bold text-text-secondary tracking-wider font-sans">PILIH KUALITAS</span>
                            </div>
                            {loadingQualities ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              </div>
                            ) : downloadQualities.length > 0 ? (
                              <div className="space-y-0.5 text-left">
                                {downloadQualities.map((q) => (
                                  <button
                                    key={q.id}
                                    onClick={() => {
                                      downloadEpisode(anime!, currentEpisode, q.nama_quality, q.source_quality);
                                      setShowDownloadDropdown(false);
                                    }}
                                    className="w-full text-left text-xs px-2.5 py-2 hover:bg-bg-elevated dark:hover:bg-white/5 hover:text-primary rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer text-text-primary"
                                  >
                                    <span>{q.nama_quality}</span>
                                    <Download className="w-3.5 h-3.5 text-muted hover:text-primary" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="px-2.5 py-3 text-center text-xs text-muted">
                                Kualitas tidak tersedia
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Previous/Next buttons */}
                {!isFilm && (
                  <>
                    <button
                      disabled={!navigation?.previousEpisode}
                      onClick={() => navigate(`/watch/${id}/ep/${navigation?.previousEpisode?.nomor_episode}`)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-bg-base hover:bg-bg-elevated border border-border/60 hover:border-primary/40 text-xs font-bold text-text-primary rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-bg-base disabled:hover:border-border/60 active:scale-95 shadow-sm focus:outline-none"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>
                    
                    <button
                      disabled={!navigation?.nextEpisode}
                      onClick={() => navigate(`/watch/${id}/ep/${navigation?.nextEpisode?.nomor_episode}`)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black font-bold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:from-border disabled:to-border shadow-sm focus:outline-none"
                    >
                      <span>Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sub-details & badges row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              
              {/* Left stats: Rating, Studio, Type */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-mono text-text-primary">{(anime.rating_anime ?? 0).toFixed(1)}</span>
                </div>
                <div className="text-xs">
                  Studio: <span className="text-text-primary font-semibold">{(anime.studio_anime ?? []).join(', ') || '-'}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/10 hidden sm:block" />
                <div className="text-xs uppercase">
                  Tipe: <span className="text-text-primary font-semibold">{anime.label_anime ?? anime.content_type ?? 'ANIME'}</span>
                </div>
              </div>

              {/* Right indicators */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="type" className="bg-green-500/10 text-green-700 dark:text-green-400 border-none px-3 py-1 font-bold text-[10px] sm:text-xs">
                  SUBTITLE INDONESIA
                </Badge>
                <Badge variant="type" className="px-3 py-1 font-bold text-[10px] sm:text-xs">
                  {(videoQuality as string) === 'auto' ? 'Auto Adaptive' : videoQuality}
                </Badge>
                <Badge variant="type" className="px-3 py-1 font-bold text-[10px] sm:text-xs">
                  {playbackRate}x Kecepatan
                </Badge>
              </div>

            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 text-left space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-text-primary">
                Komentar ({comments.length})
              </h3>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <UserAvatar 
                src={userProfile?.avatarUrl || ''} 
                name={userProfile?.name || userProfile?.username || '?'} 
                className="w-9 h-9 rounded-full shrink-0 border border-border" 
              />
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder={isLoggedIn ? "Tulis opini Anda tentang episode ini..." : "Login terlebih dahulu untuk menulis komentar..."}
                  disabled={!isLoggedIn}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full h-10 pl-4 pr-20 bg-bg-base border border-border/80 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(prev => !prev)}
                    className={`absolute right-9 p-1.5 transition-colors ${showStickerPicker ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                    aria-label="Pilih stiker"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-2 p-1.5 text-primary hover:text-primary-light transition-colors"
                  aria-label="Kirim komentar"
                >
                  <Send className="w-4 h-4" />
                </button>

                {/* Sticker Picker Popover */}
                {showStickerPicker && (
                  <div className="absolute bottom-12 right-0 w-80 bg-bg-sidebar/95 backdrop-blur-md border border-border/60 rounded-2xl p-4 shadow-2xl z-35 flex flex-col text-left animate-scale-up">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/20 mb-3">
                      <h4 className="text-xs font-bold text-text-primary tracking-wide">Pilih Stiker</h4>
                      <button 
                        type="button" 
                        onClick={() => setShowStickerPicker(false)}
                        className="text-muted hover:text-text-primary text-[10px] font-bold"
                      >
                        Tutup
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setStickerTab('owned')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${stickerTab === 'owned' ? 'bg-primary text-black' : 'bg-bg-elevated dark:bg-white/5 text-text-secondary hover:text-text-primary'}`}
                      >
                        Milik Saya
                      </button>
                      <button
                        type="button"
                        onClick={() => setStickerTab('store')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${stickerTab === 'store' ? 'bg-primary text-black' : 'bg-bg-elevated dark:bg-white/5 text-text-secondary hover:text-text-primary'}`}
                      >
                        Toko Stiker
                      </button>
                    </div>

                    {/* Content */}
                    {stickerLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-[10px] text-muted">Memuat stiker...</span>
                      </div>
                    ) : stickerError ? (
                      <div className="py-6 text-center text-xs text-red-400 font-medium">
                        {stickerError.includes('VIP') ? (
                          <div className="space-y-2">
                            <div className="text-yellow-400 font-bold">Fitur Khusus VIP</div>
                            <p className="text-muted text-[10px]">Tingkatkan tier Anda untuk menggunakan stiker di komentar.</p>
                          </div>
                        ) : (
                          stickerError
                        )}
                      </div>
                    ) : stickerTab === 'owned' ? (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-pink">
                        {stickers.filter(s => s.is_owned).length > 0 ? (
                          stickers.filter(s => s.is_owned).map((sticker) => (
                            <button
                              key={sticker.id}
                              type="button"
                              onClick={() => handleSelectSticker(sticker)}
                              className="aspect-square bg-bg-elevated dark:bg-white/5 hover:bg-bg-surface dark:hover:bg-white/10 border border-border/40 hover:border-primary/40 rounded-xl p-1.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              title={sticker.name}
                            >
                              <img src={getStickerUrl(sticker.image_url)} alt={sticker.name} className="max-w-full max-h-full object-contain" />
                            </button>
                          ))
                        ) : (
                          <div className="col-span-4 py-8 text-center text-[11px] text-muted">
                            Anda belum memiliki stiker. Beli beberapa di Toko Stiker!
                          </div>
                        )}
                      </div>
                    ) : (
                      // Store Tab
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-pink">
                        {stickers.length > 0 ? (
                          stickers.map((sticker) => (
                            <div
                              key={sticker.id}
                              className="relative aspect-square bg-bg-elevated dark:bg-white/5 border border-border/30 rounded-xl p-1.5 flex flex-col items-center justify-center"
                              title={`${sticker.name} - ${sticker.description || ''}`}
                            >
                              <img src={getStickerUrl(sticker.image_url)} alt={sticker.name} className="max-w-8 max-h-8 object-contain mb-1" />
                              
                              {sticker.is_owned ? (
                                <span className="text-[7.5px] font-bold text-green-400 uppercase">Dimiliki</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isPurchasing === sticker.id}
                                  onClick={() => handlePurchaseSticker(sticker)}
                                  className="text-[7.5px] font-extrabold bg-primary hover:bg-primary-light text-black px-1.5 py-0.5 rounded transition-all active:scale-90"
                                >
                                  {isPurchasing === sticker.id ? '...' : 'BELI'}
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 py-8 text-center text-[11px] text-muted">
                            Tidak ada stiker tersedia di toko.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-pink">
              {comments.length > 0 ? (
                comments.map((comment) => {
                  const userAvatar = comment.user?.profile?.avatar_url || '';
                  const userName = comment.user?.profile?.full_name || comment.user?.username || 'Anonim';
                  const timestampStr = (() => {
                    try {
                      const d = new Date(comment.createdAt);
                      if (isNaN(d.getTime())) return 'Baru saja';
                      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    } catch {
                      return 'Baru saja';
                    }
                  })();
                  const bgUrl = comment.user?.comment_background?.url;

                  return (
                    <div 
                      key={comment.id} 
                      style={bgUrl ? {
                        backgroundImage: `linear-gradient(to right, rgba(22, 22, 22, 0.95), rgba(22, 22, 22, 0.8)), url(${bgUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      } : undefined}
                      className={`flex gap-3 text-sm border-b border-border/30 p-3 rounded-xl last:border-none ${bgUrl ? 'border border-primary/20 shadow-glow-sm' : ''}`}
                    >
                      <UserAvatar 
                        src={userAvatar} 
                        name={userName} 
                        className="w-8 h-8 rounded-full shrink-0 border border-border" 
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-xs text-text-primary">{userName}</strong>
                            
                            {/* Super Badge */}
                            {comment.user?.super_badge_active && (
                              <img 
                                src={comment.user.super_badge_active.badge_icon} 
                                alt={comment.user.super_badge_active.badge_name}
                                className="w-4 h-4 object-contain inline-block"
                                title={comment.user.super_badge_active.badge_name}
                              />
                            )}

                            {/* Level Flair */}
                            {comment.user?.level && (
                              <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary-light border border-primary/20">
                                Lv. {comment.user.level.level_number}
                              </span>
                            )}

                            {/* Active Badges */}
                            {comment.user?.activeBadges?.map(badge => (
                              <span 
                                key={badge.name} 
                                className="text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase"
                                style={{ 
                                  color: badge.title_color || '#ffffff', 
                                  backgroundColor: `${badge.title_color || '#ffffff'}15`,
                                  border: `1px solid ${badge.title_color || '#ffffff'}25`
                                }}
                              >
                                {badge.name}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted">{timestampStr}</span>
                        </div>
                        {comment.kind === 'STICKER' ? (
                          (() => {
                            const stickerSrc = comment.content || (comment as any).sticker_url || (comment as any).sticker?.image_url || '';
                            return (
                              <div className="mt-1 max-w-[120px] aspect-square rounded-xl overflow-hidden bg-bg-elevated dark:bg-white/5 border border-border/30 dark:border-white/10 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 transition-transform duration-200">
                                {stickerSrc ? (
                                  <img 
                                    src={getStickerUrl(stickerSrc)} 
                                    alt="Sticker" 
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      // Fallback image if sticker doesn't load
                                      (e.target as HTMLImageElement).src = getStickerUrl('STK_HAPPY_1');
                                    }}
                                  />
                                ) : (
                                  <span className="text-[10px] text-muted">Sticker kosong</span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-text-secondary leading-relaxed pr-2">{comment.content}</p>
                        )}
                        
                        {/* Likes/Engagement */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors focus:outline-none"
                          >
                            <Heart className={`w-3 h-3 transition-colors ${comment.likedByMe ? 'fill-primary text-primary' : 'text-muted hover:text-primary hover:fill-primary'}`} />
                            <span className={comment.likedByMe ? 'text-primary font-semibold' : 'text-muted'}>
                              {comment._count?.likes ?? 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-muted">
                  Belum ada komentar. Jadilah yang pertama memberikan opini!
                </div>
              )}
            </div>
          </div>
          </>

        </div>

        {/* Right Area (Sidebar): Episode List */}
        {!isFilm && (
          <div className="space-y-6 animate-fade-in-up bg-bg-surface border border-border/40 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col text-left">
            <div className="pb-3 border-b border-border/50 mb-3 shrink-0">
              <h3 className="text-sm font-bold text-text-primary tracking-wide">
                Episode {anime.nama_anime}
              </h3>
              <p className="text-[10.5px] text-muted mt-0.5 font-medium">Memutar {currentEpNum} dari {episodes?.length || 0} episode</p>
            </div>

            {/* Episode List Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-pink">
              {episodes?.map((ep) => {
                // Find progress
                const hist = watchHistory?.find(h => h.animeId === String(anime.id) && h.episodeNumber === ep.nomor_episode);
                const prog = hist ? hist.progress : 0;
                const active = currentEpNum === ep.nomor_episode;

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${id}/ep/${ep.nomor_episode}`}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                      active 
                        ? 'bg-bg-active dark:bg-primary/5 border-primary/40' 
                        : 'bg-bg-base border-transparent hover:bg-bg-elevated'
                    }`}
                  >
                    {/* Thumbnail 16:9 */}
                    <div className="relative w-20 aspect-[16/9] bg-bg-surface rounded overflow-hidden shrink-0">
                      <img 
                        src={ep.thumbnail_episode || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200`} 
                        alt={`Ep ${ep.nomor_episode}`} 
                        className="w-full h-full object-cover" 
                      />
                      {prog > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
                          <div className="h-full bg-primary" style={{ width: `${prog * 100}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Title and Badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold font-mono px-1 rounded ${active ? 'bg-primary/20 dark:bg-primary text-pink-700 dark:text-black' : 'bg-bg-surface text-text-primary'}`}>
                          EP {ep.nomor_episode}
                        </span>
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-bold">SUB</span>
                      </div>
                      <p className={`text-xs truncate font-semibold mt-1 ${active ? 'text-pink-600 dark:text-primary' : 'text-text-primary'}`}>
                        {ep.judul_episode}
                      </p>
                      <span className="text-[9.5px] text-muted block mt-0.5 font-mono">{formatDuration(ep.durasi_episode)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Recommended Anime Section below */}
      {relatedAnimes.length > 0 && (
        <div className="space-y-4 text-left">
          <h3 className="text-lg font-bold font-heading text-text-primary">Rekomendasi Lainnya</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedAnimes.map((a) => (
              <div key={a.id} className="animate-fade-in">
                <AnimeCard apiAnime={a} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default WatchPage;
