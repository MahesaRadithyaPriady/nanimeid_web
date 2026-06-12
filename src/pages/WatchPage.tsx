import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, 
  Minimize2, Settings, ArrowLeft, ArrowRight, Heart, Send, 
  MessageSquare, Star, Loader2, Smile 
} from 'lucide-react';
import Hls from 'hls.js';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';
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
          <div className="relative aspect-[16/9] w-full bg-[#0d0d0d] rounded-2xl overflow-hidden border border-border/30 flex items-center justify-center group/player">
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
                <div className="w-3/4 h-7 bg-white/10 rounded animate-pulse" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-5 bg-white/5 rounded animate-pulse" />
                  <div className="w-36 h-4 bg-white/5 rounded animate-pulse" />
                </div>
              </div>

              {/* Prev / Next buttons skeletons */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-10 bg-white/5 border border-border/40 rounded-xl animate-pulse" />
                <div className="w-24 h-10 bg-white/10 rounded-xl animate-pulse" />
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

export const WatchPage: React.FC = () => {
  const { id, episodeNumber } = useParams<{ id: string; episodeNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentEpNum = parseInt(episodeNumber || '1', 10);

  const { 
    videoVolume, setVideoVolume, 
    videoQuality, setVideoQuality, 
    subtitleLang, setSubtitleLang,
    addWatchHistory, watchHistory, 
    isLoggedIn, userProfile
  } = useAppStore();

  // Silence all toast notifications on WatchPage as requested
  const addToast = (..._args: any[]) => {};

  // API States
  const [anime, setAnime] = useState<ApiAnime | null>(null);
  const [episodes, setEpisodes] = useState<ApiEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<ApiEpisode | null>(null);
  const [navigation, setNavigation] = useState<ApiEpisodeNavigation | null>(null);
  const [relatedAnimes, setRelatedAnimes] = useState<ApiAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video Ref & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [openSettings, setOpenSettings] = useState<'none' | 'quality' | 'speed'>('none');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
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
    try {
      const res = await postComment({
        episode_id: currentEpisode.id,
        content: sticker.image_url,
        kind: 'STICKER',
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
      window.alert(err.message || 'Gagal mengirim stiker');
    }
  };

  const handlePurchaseSticker = async (sticker: ApiSticker) => {
    const itemId = (sticker as any).itemId || sticker.id;
    setIsPurchasing(sticker.id);
    try {
      const res = await purchaseSticker(itemId);
      window.alert(res.message || 'Stiker berhasil dibeli!');
      // Reload stickers list to update ownership
      const stickersRes = await fetchStickers();
      setStickers(stickersRes.data || []);
    } catch (err: any) {
      console.error('Failed to purchase sticker:', err);
      window.alert(err.message || 'Gagal membeli stiker');
    } finally {
      setIsPurchasing(null);
    }
  };

  const controlsTimeoutRef = useRef<any | null>(null);
  const qualityChangingTimeRef = useRef<number>(0);
  const qualityChangingPlayingRef = useRef<boolean>(false);

  // 1. Load Full Anime details on ID change (for sidebar episodes list & base metadata)
  useEffect(() => {
    if (!id) return;
    const loadAnimeDetail = async () => {
      try {
        const detailRes = await fetchAnimeDetail(id);
        const data = detailRes.data;
        setAnime(data);
        setEpisodes(data.episodes ?? []);
      } catch (err) {
        console.error('Failed to load anime details:', err);
      }
    };
    loadAnimeDetail();
  }, [id]);

  // 2. Load current episode details & navigation info
  useEffect(() => {
    if (!id) return;
    const loadEpisode = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [epRes, similarRes] = await Promise.allSettled([
          fetchEpisodeByNumber(id, currentEpNum),
          fetchSimilarAnime(id, { limit: 4 })
        ]);

        if (epRes.status === 'fulfilled') {
          setCurrentEpisode(epRes.value.data.episode);
          setNavigation(epRes.value.data.navigation);
        } else {
          throw epRes.reason;
        }

        if (similarRes.status === 'fulfilled') {
          setRelatedAnimes(similarRes.value.data ?? []);
        } else {
          console.warn('Failed to fetch similar anime:', similarRes.reason);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Gagal memuat detail episode');
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisode();
  }, [id, currentEpNum]);

  // 3. Load comments & start realtime SSE stream on active episode change
  useEffect(() => {
    if (!currentEpisode?.id) {
      setComments([]);
      return;
    }

    let cancelled = false;

    // Fetch initial list
    const loadComments = async () => {
      try {
        const res = await fetchComments({ episodeId: currentEpisode.id, take: 50 });
        if (!cancelled && res.comments) {
          setComments(res.comments.filter(c => !c.is_delete));
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    };

    loadComments();

    // Setup SSE connection
    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
    const es = new EventSource(`${baseUrl}/comments/sse/stream?episodeId=${currentEpisode.id}`);

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

    return () => {
      cancelled = true;
      es.close();
    };
  }, [currentEpisode?.id]);

  // Get active video url based on selected quality and HLS status
  const getVideoSource = () => {
    if (!currentEpisode) return '';

    // If episode is VIP restricted early access, load fallback stream
    if (currentEpisode.early_access) {
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }

    // A. Check if Master HLS Playlist exists for auto-adaptive quality
    if (currentEpisode.hls_master_url) {
      return currentEpisode.hls_master_url;
    }

    // B. Find matching quality selection
    const q = currentEpisode.qualities?.find(item => item.nama_quality === videoQuality);
    if (q) {
      if (q.hls_status === 'DONE' && q.hls_url) {
        return q.hls_url;
      }
      return q.source_quality;
    }

    // C. Fallback to any quality available
    if (currentEpisode.qualities && currentEpisode.qualities.length > 0) {
      const firstQ = currentEpisode.qualities[0];
      if (firstQ.hls_status === 'DONE' && firstQ.hls_url) {
        return firstQ.hls_url;
      }
      return firstQ.source_quality;
    }

    // D. Final hard fallback to public stream
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  const videoSource = getVideoSource();
  const isHls = videoSource.includes('.m3u8');

  // 3. Connect Video Element with HLS.js or native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource) return;

    let hls: Hls | null = null;

    // Cache parameters from refs and reset them
    const targetTime = qualityChangingTimeRef.current;
    const shouldPlay = qualityChangingPlayingRef.current;
    qualityChangingTimeRef.current = 0;
    qualityChangingPlayingRef.current = false;

    const restorePlayback = () => {
      setIsChangingQuality(false);
      setIsBuffering(false);
      if (targetTime > 0) {
        video.currentTime = targetTime;
      }
      if (shouldPlay) {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        if (isPlaying) {
          video.play().catch(() => setIsPlaying(false));
        }
      }
    };

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 30, // Optimize buffering
        });
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          restorePlayback();
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                break;
            }
          }
        });
      } else if (video.canPlayType('application/x-mpegURL')) {
        // Native HLS (Safari/iOS)
        video.src = videoSource;
        const handleLoadedMetadata = () => {
          restorePlayback();
        };
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
    } else {
      // Direct MP4 playback
      video.src = videoSource;
      const handleLoadedMetadata = () => {
        restorePlayback();
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoSource]);

  // Sync state on episode change
  useEffect(() => {
    if (!videoRef.current || !currentEpisode || !anime) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);

    // Auto-play next episode
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    // Load progress from watchHistory in local store
    const historyRecord = watchHistory.find(
      h => h.animeId === String(anime.id) && h.episodeNumber === currentEpNum
    );
    if (historyRecord && videoRef.current) {
      videoRef.current.currentTime = historyRecord.progress * (videoRef.current.duration || 1450);
    }
  }, [currentEpNum, id]);

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
    
    // Save progress periodically to global store and backend
    if (current > 10 && current % 10 < 1) {
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

      // Save to backend if authenticated
      if (isLoggedIn) {
        saveEpisodeProgress(currentEpisode.id, current, isCompleted).catch(console.error);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      addToast('info', 'Video dijeda');
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        addToast('success', 'Memutar video');
      }).catch(() => {
        addToast('error', 'Gagal memutar video');
      });
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    addToast('info', seconds > 0 ? `Lompat maju ${seconds}s` : `Lompat mundur ${Math.abs(seconds)}s`);
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
    addToast('info', nextMuted ? 'Suara dimatikan' : 'Suara dinyalakan');
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
        addToast('error', 'Gagal masuk ke mode Fullscreen');
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
    addToast('info', `Kecepatan diubah menjadi ${speed}x`);
  };

  const changeQuality = (quality: any) => {
    if (videoRef.current) {
      qualityChangingTimeRef.current = videoRef.current.currentTime;
      qualityChangingPlayingRef.current = !videoRef.current.paused;
      setIsChangingQuality(true);
    }
    setVideoQuality(quality);
    setOpenSettings('none');
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.alert('Login terlebih dahulu untuk berkomentar!');
      return;
    }
    if (!newCommentText.trim() || !currentEpisode?.id) return;

    try {
      const res = await postComment({
        episode_id: currentEpisode.id,
        content: newCommentText.trim(),
        kind: 'TEXT',
        video_second: currentTime
      });

      if (res && res.data) {
        setComments((prev) => {
          if (prev.some((c) => c.id === res.data.id)) return prev;
          return [res.data, ...prev];
        });
      }
      setNewCommentText('');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      window.alert(err.message || 'Gagal mengirim komentar');
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      window.alert('Login terlebih dahulu untuk menyukai komentar!');
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



  if (isLoading) {
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

  const isFilm = anime.content_type === 'FILM';

  return (
    <div className="pb-16 space-y-6">
      
      {/* Back to details link */}
      <button 
        onClick={() => {
          if (location.state?.fromDetail && window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(`/anime/${anime.id}`);
          }
        }}
        className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors focus:outline-none cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Detail Anime</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Area: Player, Title, comments */}
        <div className={`${isFilm ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          
          {/* Video Player Box */}
          <div 
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            className={`relative aspect-[16/9] w-full bg-black rounded-2xl overflow-hidden border border-border/40 select-none group/player shadow-2xl hover:shadow-[0_0_35px_rgba(255,102,205,0.15)] transition-shadow duration-500 ${
              isFullscreen ? 'h-screen w-screen border-none rounded-none' : ''
            }`}
          >
            {/* Native Video Element */}
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onSeeked={() => setIsBuffering(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Fullscreen Video Metadata Header */}
            {isFullscreen && (
              <div 
                className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/30 to-transparent flex flex-col gap-1 text-left transition-all duration-300 z-20 ${
                  showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-[9px] font-bold bg-primary text-black rounded uppercase tracking-wider font-mono">
                    {anime.content_type}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">
                    {anime.nama_anime}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  {isFilm ? 'Film Lengkap' : `Episode ${currentEpisode?.nomor_episode}: ${currentEpisode?.judul_episode || ''}`}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/60 font-medium font-sans">
                  <span>Rating: {anime.rating_anime || 'N/A'}</span>
                  <span>•</span>
                  <span>Tipe: {anime.label_anime || 'N/A'}</span>
                  <span>•</span>
                  <span>Status: {anime.status_anime || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Buffering/Loading Spinner Overlay */}
            {(isBuffering || isChangingQuality) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-15 pointer-events-none">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            )}

            {/* Premium skips markers overlay */}
            {showSkipIntro && (
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = introEnd;
                  }
                }}
                className="absolute bottom-16 right-4 z-20 px-4 py-2.5 bg-black/80 hover:bg-primary border border-primary/30 hover:border-primary text-primary hover:text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(255,102,205,0.3)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Skip Intro &gt;&gt;
              </button>
            )}

            {showSkipOutro && (
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = outroEnd;
                  }
                }}
                className="absolute bottom-16 right-4 z-20 px-4 py-2.5 bg-black/80 hover:bg-primary border border-primary/30 hover:border-primary text-primary hover:text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(255,102,205,0.3)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Skip Outro &gt;&gt;
              </button>
            )}

            {/* Custom Overlay Controls */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/50 flex flex-col justify-end p-4 transition-opacity duration-300 z-10 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              
              {/* Play state big center display */}
              <div 
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent"
              >
                {!isPlaying && (
                  <div className="p-5 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-primary/40 text-primary rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(255,102,205,0.4)] flex items-center justify-center group/playbtn">
                    <Play className="w-9 h-9 fill-primary text-primary group-hover/playbtn:scale-105 transition-transform" />
                  </div>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="flex items-center gap-3 w-full mb-3 z-20">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressSeek}
                  className="w-full player-progress-slider accent-primary cursor-pointer"
                  style={{ '--value-percent': `${(currentTime / (duration || 1)) * 100}%` } as React.CSSProperties}
                />
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between w-full z-20">
                
                {/* Left controls: Play, Skip, Volume, Time */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button 
                    onClick={togglePlay} 
                    className="p-1.5 hover:bg-white/15 hover:text-primary rounded-xl text-white transition-all active:scale-90"
                    aria-label={isPlaying ? "Jeda video" : "Putar video"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>

                  <button 
                    onClick={() => skipTime(-10)} 
                    className="hidden sm:flex p-1.5 hover:bg-white/15 hover:text-primary rounded-xl text-white transition-all active:scale-90"
                    aria-label="Kembali 10 detik"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>

                  <button 
                    onClick={() => skipTime(10)} 
                    className="hidden sm:flex p-1.5 hover:bg-white/15 hover:text-primary rounded-xl text-white transition-all active:scale-90"
                    aria-label="Maju 10 detik"
                  >
                    <RotateCw className="w-4.5 h-4.5" />
                  </button>

                  {/* Volume block */}
                  <div className="flex items-center gap-1 sm:gap-2 group/volume">
                    <button 
                      onClick={toggleMute} 
                      className="p-1.5 hover:bg-white/15 hover:text-primary rounded-xl text-white transition-all active:scale-90"
                      aria-label={muted ? "Nyalakan suara" : "Senapkan suara"}
                    >
                      {muted ? (
                        <VolumeX className="w-5 h-5 text-primary drop-shadow-[0_0_4px_rgba(255,102,205,0.6)]" />
                      ) : (
                        <Volume2 className="w-5 h-5 transition-transform duration-150 hover:scale-105" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : videoVolume}
                      onChange={handleVolumeSliderChange}
                      className="w-0 overflow-hidden opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 transition-all duration-300 player-volume-slider cursor-pointer hidden sm:block focus:outline-none"
                      style={{ '--volume-percent': `${(muted ? 0 : videoVolume) * 100}%` } as React.CSSProperties}
                    />
                  </div>

                  {/* Time indicator */}
                  <span className="text-[10px] sm:text-xs font-mono text-white/95 whitespace-nowrap ml-1 bg-black/45 px-2.5 py-1 rounded-lg border border-white/5">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                {/* Right controls: Quality, Speed, Subtitle, Fullscreen */}
                <div className="flex items-center gap-1 sm:gap-1.5 relative">
                  
                  {/* Settings / Controls */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenSettings(prev => prev === 'quality' ? 'none' : 'quality')}
                      className={`p-1.5 hover:bg-white/15 rounded-xl text-white transition-all active:scale-90 ${openSettings === 'quality' ? 'bg-white/20 text-primary' : ''}`}
                      aria-label="Kualitas video"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Quality panel */}
                    {openSettings === 'quality' && (
                      <div className="absolute bottom-12 right-0 w-40 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl py-2 z-35 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col text-left transform scale-100 transition-all animate-scale-up">
                        <span className="px-3.5 py-1 text-[9px] font-bold text-muted uppercase tracking-wider">Resolusi</span>
                        {isHls ? (
                          <button
                            onClick={() => changeQuality('auto')}
                            className={`px-3.5 py-2 text-xs hover:bg-white/10 text-left transition-colors ${(videoQuality as string) === 'auto' ? 'text-primary font-semibold' : 'text-white/80'}`}
                          >
                            Auto (Adaptive)
                          </button>
                        ) : null}
                        {['360p', '480p', '720p', '1080p'].map(q => (
                          <button
                            key={q}
                            onClick={() => changeQuality(q as any)}
                            className={`px-3.5 py-2 text-xs hover:bg-white/10 text-left transition-colors ${videoQuality === q ? 'text-primary font-semibold' : 'text-white/80'}`}
                          >
                            {q}
                          </button>
                        ))}
                        <div className="border-t border-white/10 my-1" />
                        <button
                          onClick={() => setOpenSettings('speed')}
                          className="px-3.5 py-1.5 text-xs hover:bg-white/10 text-left text-primary font-medium transition-colors flex items-center justify-between"
                        >
                          <span>Kecepatan</span>
                          <span>&gt;</span>
                        </button>
                      </div>
                    )}

                    {/* Speed panel */}
                    {openSettings === 'speed' && (
                      <div className="absolute bottom-12 right-0 w-40 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl py-2 z-35 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col text-left transform scale-100 transition-all animate-scale-up">
                        <span className="px-3.5 py-1 text-[9px] font-bold text-muted uppercase tracking-wider">Kecepatan</span>
                        {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => changeSpeed(speed)}
                            className={`px-3.5 py-2 text-xs hover:bg-white/10 text-left transition-colors ${playbackRate === speed ? 'text-primary font-semibold' : 'text-white/80'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                        <div className="border-t border-white/10 my-1" />
                        <button
                          onClick={() => setOpenSettings('quality')}
                          className="px-3.5 py-1.5 text-xs hover:bg-white/10 text-left text-white/60 transition-colors flex items-center gap-1"
                        >
                          <span>&lt;</span>
                          <span>Kembali</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subtitle language select */}
                  <select
                    value={subtitleLang}
                    onChange={(e) => {
                      setSubtitleLang(e.target.value as any);
                      addToast('info', `Bahasa subtitle: ${e.target.value.toUpperCase()}`);
                    }}
                    className="bg-black/60 border border-white/20 text-white rounded px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-mono font-medium focus:outline-none"
                  >
                    <option value="id">SUB ID</option>
                    <option value="en">SUB EN</option>
                    <option value="off">MATI</option>
                  </select>

                  {/* Fullscreen Button */}
                  <button 
                    onClick={toggleFullscreen} 
                    className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Episode Meta Info and Navigation */}
          <div className="bg-bg-sidebar/65 backdrop-blur-sm border border-border/30 rounded-2xl p-5 sm:p-6 text-left space-y-4 shadow-lg">
            
            {/* Main Title and Navigation Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">Sedang Diputar</span>
                <h1 className="text-xl sm:text-2xl font-black font-heading text-text-primary leading-tight tracking-tight">
                  {anime.nama_anime}
                </h1>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                  <span className="bg-primary/20 text-primary-light font-mono font-bold text-xs px-2 py-0.5 rounded border border-primary/20 whitespace-nowrap">
                    {isFilm ? 'FILM MOVIE' : `EPISODE ${currentEpisode?.nomor_episode ?? currentEpNum}`}
                  </span>
                  <span className="font-semibold text-text-primary truncate">{currentEpisode?.judul_episode ?? `Episode ${currentEpNum}`}</span>
                </div>
              </div>

              {/* Navigation prev/next episode */}
              {!isFilm && (
                <div className="flex items-center gap-2 shrink-0">
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
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black font-bold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:from-border disabled:to-border shadow-sm focus:outline-none"
                  >
                    <span>Berikutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                <Badge variant="type" className="bg-green-500/10 text-green-400 border-none px-3 py-1 font-bold text-[10px] sm:text-xs">
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
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border">
                <img src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Tulis opini Anda tentang episode ini..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full h-10 pl-4 pr-20 bg-bg-base border border-border/80 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-muted"
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
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${stickerTab === 'owned' ? 'bg-primary text-black' : 'bg-white/5 text-text-secondary hover:text-text-primary'}`}
                      >
                        Milik Saya
                      </button>
                      <button
                        type="button"
                        onClick={() => setStickerTab('store')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${stickerTab === 'store' ? 'bg-primary text-black' : 'bg-white/5 text-text-secondary hover:text-text-primary'}`}
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
                              className="aspect-square bg-white/5 hover:bg-white/10 border border-border/40 hover:border-primary/40 rounded-xl p-1.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
                              className="relative aspect-square bg-white/5 border border-border/30 rounded-xl p-1.5 flex flex-col items-center justify-center"
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
                  const userAvatar = comment.user?.profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
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
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border">
                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                      </div>
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
                              <div className="mt-1 max-w-[120px] aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 transition-transform duration-200">
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

        </div>

        {/* Right Area (Sidebar): Episode List */}
        {!isFilm && (
          <div className="bg-bg-surface border border-border/40 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col text-left">
            <div className="pb-3 border-b border-border/50 mb-3 shrink-0">
              <h3 className="text-sm font-bold text-text-primary tracking-wide">
                Episode {anime.nama_anime}
              </h3>
              <p className="text-[10.5px] text-muted mt-0.5 font-medium">Memutar {currentEpNum} dari {episodes.length} episode</p>
            </div>

            {/* Episode List Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-pink">
              {episodes.map((ep) => {
                // Find progress
                const hist = watchHistory.find(h => h.animeId === String(anime.id) && h.episodeNumber === ep.nomor_episode);
                const prog = hist ? hist.progress : 0;
                const active = currentEpNum === ep.nomor_episode;

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${id}/ep/${ep.nomor_episode}`}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                      active 
                        ? 'bg-primary/5 border-primary/40' 
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
                        <span className={`text-[10px] font-bold font-mono px-1 rounded ${active ? 'bg-primary text-black' : 'bg-bg-surface text-text-primary'}`}>
                          EP {ep.nomor_episode}
                        </span>
                        <span className="text-[9px] text-green-400 font-bold">SUB</span>
                      </div>
                      <p className={`text-xs truncate font-semibold mt-1 ${active ? 'text-primary' : 'text-text-primary'}`}>
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
