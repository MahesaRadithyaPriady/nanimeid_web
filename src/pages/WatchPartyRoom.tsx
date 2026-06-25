import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Lock, Unlock, LogOut, Send, Smile, Image, Loader2,
  Mic, MicOff, Tv, Copy, Eye, Globe, PhoneOff, Headphones, List, ChevronRight, SkipBack, SkipForward,
  ArrowLeft, Settings
} from 'lucide-react';
import Hls, { FetchLoader } from 'hls.js';
import { useWatchPartyStore } from '../stores/useWatchPartyStore';
import { useAppStore } from '../stores/useAppStore';
import { watchPartyApi } from '../lib/watchPartyApi';
import type { ChatMessage } from '../lib/watchPartyApi';
import { postWatchTick, type WatchTickResponse } from '../lib/watchApi';
import { fetchStickers, fetchAnimeEpisodes } from '../lib/animeApi';
import type { ApiSticker } from '../types';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Badge } from '../components/ui/Badge';

/** Helper to format time (seconds to mm:ss) */
function formatTime(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Helper to resolve sticker URL */
function getStickerUrl(content?: string | number): string {
  if (!content) return '';
  const strContent = String(content);
  if (strContent.startsWith('http://') || strContent.startsWith('https://')) {
    return strContent;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
  const apiHost = baseUrl.replace(/\/v?\d+\.\d+\.\d+(\/.*)?$/, '').replace(/\/v?\d+(\/.*)?$/, '');
  if (!strContent.includes('/') && !strContent.includes('.')) {
    return `${apiHost}/static/uploads/stickers/${strContent.toLowerCase()}.png`;
  }
  if (strContent.startsWith('/') || strContent.startsWith('static/')) {
    const cleanPath = strContent.startsWith('/') ? strContent : `/${strContent}`;
    return `${apiHost}${cleanPath}`;
  }
  return `${apiHost}/static/uploads/stickers/${strContent}`;
}

export interface WatchPartyRoomProps {
  forceCode?: string;
  isMiniMode?: boolean;
}

export const WatchPartyRoom: React.FC<WatchPartyRoomProps> = ({ forceCode, isMiniMode }) => {
  const params = useParams<{ code: string }>();
  const code = forceCode || params.code;
  const navigate = useNavigate();
  const { userProfile, addToast, isLoggedIn, updateProfile } = useAppStore();

  const {
    session, participants, messages, isHost,
    currentMedia, playbackState, voiceConnected, voiceMicEnabled, voicePeers,
    connect, disconnect, play, pause, seek, speed,
    hostTick, syncFollow, sendChatMessage,
    joinVoice, leaveVoice, setVoiceMicEnabled
  } = useWatchPartyStore();

  // Component UI States
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'episodes'>('chat');
  const [chatText, setChatText] = useState('');
  const [stickers, setStickers] = useState<ApiSticker[]>([]);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  // Episode List State
  const [episodes, setEpisodes] = useState<Array<{
    id: number;
    nomor_episode: number;
    judul_episode: string;
    thumbnail_episode?: string | null;
    qualities: Array<{ id: number; nama_quality: string; source_quality: string }>;
    early_access?: boolean;
  }>>([]); 
  const [switchingEpisode, setSwitchingEpisode] = useState(false);

  // Player Elements Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Custom Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Mouse Idle State for Controls
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = () => {
    setIsMouseIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsMouseIdle(true), 2500);
  };

  const handleTouch = () => {
    setIsMouseIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsMouseIdle(true), 3500);
  };

  const handleMouseLeave = () => {
    setIsMouseIdle(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  // Prevention of Sync Loop (Feedback)
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch Tick interval ref (XP/coin rewards every 60s)
  const watchTickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Double-click detection & skip indicator refs
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipIndicator, setSkipIndicator] = useState<{ direction: 'forward' | 'backward'; seconds: number } | null>(null);
  const skipIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastTimeTargetRef = useRef<number | null>(null);
  const lastSpeedTargetRef = useRef<number | null>(null);
  const lastSeekTimestampRef = useRef<number | undefined>(undefined);
  const isProgrammaticSeekRef = useRef(false);
  const programmaticSeekFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  // 1. Establish Socket Connection
  useEffect(() => {
    if (!code) return;
    if (!isLoggedIn) {
      addToast('error', 'Silakan login terlebih dahulu untuk bergabung Watch Party.');
      navigate('/login');
      return;
    }

    connect(code);

    return () => {
      disconnect();
    };
  }, [code, isLoggedIn]);

  // 2. Fetch Stickers
  useEffect(() => {
    const loadStickers = async () => {
      try {
        const res = await fetchStickers();
        if (res?.data) {
          setStickers(res.data);
        }
      } catch (err) {
        console.error('Failed to load stickers:', err);
      }
    };
    if (isLoggedIn) {
      loadStickers();
    }
  }, [isLoggedIn]);

  // 2b. Fetch ALL Anime Episodes when session has anime_id
  useEffect(() => {
    if (!session?.anime_id) {
      setEpisodes([]);
      return;
    }

    let cancelled = false;

    const loadEpisodes = async () => {
      try {
        // Primary: use watchPartyApi.getAnimeDetails — reliably returns full episode list with qualities
        const wpRes = await watchPartyApi.getAnimeDetails(session.anime_id!);
        if (cancelled) return;

        let episodeList: any[] = (wpRes?.episodes && Array.isArray(wpRes.episodes)) ? wpRes.episodes : [];

        // Fallback: try animeApi fetchAnimeEpisodes if watchPartyApi returned 0
        if (episodeList.length === 0) {
          try {
            const epRes = await fetchAnimeEpisodes(session.anime_id!);
            if (!cancelled && epRes?.data && Array.isArray(epRes.data)) {
              episodeList = epRes.data;
            }
          } catch (fallbackErr) {
            console.warn('fetchAnimeEpisodes fallback failed:', fallbackErr);
          }
        }

        if (!cancelled && episodeList.length > 0) {
          setEpisodes(episodeList.map((ep: any) => ({
            id: ep.id,
            nomor_episode: ep.nomor_episode ?? ep.episode_number ?? 0,
            judul_episode: ep.judul_episode ?? ep.title ?? '',
            thumbnail_episode: ep.thumbnail_episode ?? ep.thumbnail ?? null,
            qualities: (ep.qualities || []).map((q: any) => ({
              id: q.id,
              nama_quality: q.nama_quality,
              source_quality: q.source_quality,
            })),
            early_access: ep.early_access,
          })));
        } else if (!cancelled) {
          setEpisodes([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load episodes:', err);
          setEpisodes([]);
        }
      }
    };

    loadEpisodes();

    return () => { cancelled = true; };
  }, [session?.anime_id]);

  // 3. Scroll Chat to Bottom on New Messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Initialize & Update Player Source
  const currentVideoUrl = currentMedia?.url;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    // Fix CORS issue for HLS by proxying through vite dev server
    let finalUrl = currentVideoUrl;
    if (finalUrl.startsWith('https://cdn-stable.nanimeid.xyz')) {
      finalUrl = finalUrl.replace('https://cdn-stable.nanimeid.xyz', '/cdn-proxy');
    }

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (finalUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ loader: FetchLoader });
      hls.loadSource(finalUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = finalUrl;
    }
  }, [currentVideoUrl]);

  // 5. Synchronize HTML5 Player to state (broadcast)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const activeState = playbackState;

    // Block native event handlers from emitting back to server during sync
    isSyncingRef.current = true;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      isSyncingRef.current = false;
      syncTimeoutRef.current = null;
    }, 1000);

    // Check Pause State
    if (activeState.is_paused && !video.paused) {
      video.pause();
    } else if (!activeState.is_paused && video.paused) {
      video.play().catch(() => {});
    }

    // Check Playback Speed Rate (override if explicitly changed by host)
    if (activeState.speed !== lastSpeedTargetRef.current) {
      video.playbackRate = activeState.speed;
      lastSpeedTargetRef.current = activeState.speed;
    }

    // Check Current Time (drift correction)
    const activeStateAny = activeState as any;
    const isExplicitSeek = activeStateAny.seek_timestamp !== lastSeekTimestampRef.current;
    
    // Only drift correct if we have a NEW target time, explicit seek, or video is paused
    if (activeState.current_time !== lastTimeTargetRef.current || activeState.is_paused || isExplicitSeek) {
      const diff = activeState.current_time - video.currentTime;
      const absDrift = Math.abs(diff);

      // Only hard seek if it's an explicit SEEK event, massive drift (> 5s), or paused
      if (isExplicitSeek || absDrift > 5.0 || activeState.is_paused) {
        if (isExplicitSeek) {
          lastSeekTimestampRef.current = activeStateAny.seek_timestamp;
        }

        // Hard seek
        if (video.currentTime !== activeState.current_time) {
          isProgrammaticSeekRef.current = true;
          if (programmaticSeekFallbackRef.current) clearTimeout(programmaticSeekFallbackRef.current);
          programmaticSeekFallbackRef.current = setTimeout(() => { isProgrammaticSeekRef.current = false; }, 10000);
          video.currentTime = activeState.current_time;
        }
        if (!activeState.is_paused) video.playbackRate = activeState.speed;
      } else if (!isHost && !activeState.is_paused) {
        // Soft Sync (Playback Rate Adjustment) for minor tick drift
        if (diff > 1.5) {
          // Way behind -> Catch up very fast (e.g. 1.6x)
          video.playbackRate = activeState.speed + 0.6;
        } else if (diff > 0.3) {
          // Slightly behind -> Fine tune (e.g. 1.2x)
          video.playbackRate = activeState.speed + 0.2;
        } else if (diff < -1.5) {
          // Way ahead -> Wait fast
          video.playbackRate = Math.max(0.25, activeState.speed - 0.6);
        } else if (diff < -0.3) {
          // Slightly ahead -> Fine tune
          video.playbackRate = Math.max(0.25, activeState.speed - 0.2);
        } else {
          // Perfectly in sync
          video.playbackRate = activeState.speed;
        }
      }
      lastTimeTargetRef.current = activeState.current_time;
    }
  }, [playbackState]);

  // Cleanup sync timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // 6. Monitor time update of the video element locally
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video) return;
      if (!isDraggingRef.current) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  // 7. Host periodic time broadcaster
  useEffect(() => {
    if (!isHost) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        hostTick(video.currentTime);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, hostTick]);

  // 7b. Watch Tick API: send tick every 60 seconds while video is playing (XP/coin rewards)
  // Reward only given after 60 seconds accumulated on the same episode
  // First tick always 0 reward — server can't verify watch time before first tick
  const episodeId = currentMedia?.episode?.id ?? currentMedia?.episode_id;

  const sendWatchTick = () => {
    if (!isLoggedIn || !episodeId || !session || playbackState.is_paused || !navigator.onLine) return;

    postWatchTick(episodeId, { seconds: 60 })
      .then((res) => {
        console.log('[WatchParty Tick] Response:', res.data);
        const { tick, xp, coin, watch_reward } = res.data;

        const vipInfo = xp.is_vip ? `VIP ${xp.vip_tier} (${xp.xp_per_minute} XP/min)` : 'Non-VIP (10 XP/min)';
        console.log(
          `[WatchParty Tick] Accumulated: ${tick.seconds_accumulated}s | ` +
          `Next reward in: ${tick.seconds_until_next_reward}s | ` +
          `First tick: ${tick.is_first_tick ?? false} | ${vipInfo}`
        );

        if (tick.seconds_rewarded > 0) {
          // Update XP and coins in store
          if (xp.current_xp !== undefined) updateProfile({ xp: xp.current_xp });
          if (coin.balance !== undefined) updateProfile({ coins: coin.balance });

          const tierBadge = xp.is_vip ? ` [${xp.vip_tier}]` : '';
          const levelInfo = xp.level ? ` Lv.${xp.level.level_number}` : '';
          addToast('success', `+${xp.gained_this_tick} XP${tierBadge}${levelInfo} & +${coin.gained_this_tick} Coin`);

          console.log(`[WatchParty Tick] Leaderboard XP: +${xp.gained_leaderboard_this_tick} (Rank: ${res.data.leaderboard?.rank_today ?? 'N/A'})`);

          if (watch_reward?.pending_coins && watch_reward.pending_coins > 0) {
            addToast('info', `🎁 Watch reward: ${watch_reward.pending_coins} coins available to claim!`);
          }
        } else {
          console.log(
            `[WatchParty Tick] No reward yet. Accumulated: ${tick.seconds_accumulated}s, ` +
            `Need: ${tick.seconds_until_next_reward}s more`
          );
        }
      })
      .catch((err) => {
        console.error('[WatchParty Tick] Failed:', err);
      });
  };

  // Start/stop watch tick based on playback state, episode, and session
  useEffect(() => {
    const isPlaying = !playbackState.is_paused;
    if (isPlaying && isLoggedIn && episodeId && session) {
      console.log('[WatchParty Tick] Starting interval (60s) for episode', episodeId);
      // Send first tick immediately, then every 60 seconds
      sendWatchTick();
      watchTickIntervalRef.current = setInterval(sendWatchTick, 60_000);
    } else {
      if (watchTickIntervalRef.current) {
        console.log('[WatchParty Tick] Stopping interval');
        clearInterval(watchTickIntervalRef.current);
        watchTickIntervalRef.current = null;
      }
    }

    return () => {
      if (watchTickIntervalRef.current) {
        clearInterval(watchTickIntervalRef.current);
        watchTickIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState.is_paused, episodeId, isLoggedIn, session]);

  // Show skip indicator animation (auto-hide after 600ms)
  const showSkipIndicator = (direction: 'forward' | 'backward', seconds: number) => {
    setSkipIndicator({ direction, seconds });
    if (skipIndicatorTimerRef.current) clearTimeout(skipIndicatorTimerRef.current);
    skipIndicatorTimerRef.current = setTimeout(() => {
      setSkipIndicator(null);
      skipIndicatorTimerRef.current = null;
    }, 600);
  };

  // Host seek helper: seek video and broadcast
  const doSeek = (delta: number) => {
    const video = videoRef.current;
    if (!video || !isHost) return;
    const newTime = Math.max(0, Math.min((video.duration || 0), video.currentTime + delta));
    video.currentTime = newTime;
    seek(newTime);
    showSkipIndicator(delta > 0 ? 'forward' : 'backward', Math.abs(delta));
  };

  // Video click handler: single click = play/pause, double click center = play/pause, double click left/right = skip 10s
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isHost) return; // Non-hosts cannot trigger video clicks
    
    if (clickTimerRef.current) {
      // Double click detected
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;

      const rect = (e.currentTarget as HTMLVideoElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const third = rect.width / 3;

      if (x < third && isHost) {
        // Left third: rewind 10s
        doSeek(-10);
      } else if (x > third * 2 && isHost) {
        // Right third: forward 10s
        doSeek(10);
      } else {
        // Center: play/pause
        handlePlayPause();
      }
    } else {
      // Wait for possible double click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click: play/pause
        handlePlayPause();
      }, 250);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          doSeek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          doSeek(10);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, playbackState.is_paused]);

  // Cleanup skip indicator timer on unmount
  useEffect(() => {
    return () => {
      if (skipIndicatorTimerRef.current) clearTimeout(skipIndicatorTimerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  // 8. Video Player Controls (Host only)
  const handlePlayPause = () => {
    if (!isHost) {
      // Members cannot pause/play, we trigger a manual resync
      syncFollow();
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      play(video.currentTime);
    } else {
      pause(video.currentTime);
    }
  };

  const handleSpeedChange = (rate: number) => {
    if (!isHost) return;
    speed(rate);
    setShowSpeedMenu(false);
  };

  // Video Native Listeners (Captures User interaction if Host)
  // These only fire for USER-initiated actions (keyboard, native controls),
  // NOT for sync-effect changes (blocked by isSyncingRef).
  const handleNativePlay = () => {
    if (isSyncingRef.current) return;
    if (isHost && videoRef.current) {
      play(videoRef.current.currentTime);
    } else if (!isHost && videoRef.current) {
      // Non-host: revert to host state and resync
      if (playbackState.is_paused) {
        isSyncingRef.current = true;
        videoRef.current.pause();
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; syncTimeoutRef.current = null; }, 1000);
      }
      syncFollow();
    }
  };

  const handleNativePause = () => {
    if (isSyncingRef.current) return;
    if (isHost && videoRef.current) {
      pause(videoRef.current.currentTime);
    } else if (!isHost && videoRef.current) {
      // Non-host: revert to host state and resync
      if (!playbackState.is_paused) {
        isSyncingRef.current = true;
        videoRef.current.play().catch(() => {});
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; syncTimeoutRef.current = null; }, 1000);
      }
      syncFollow();
    }
  };

  const handleNativeSeeked = () => {
    if (isProgrammaticSeekRef.current) {
      isProgrammaticSeekRef.current = false;
      if (programmaticSeekFallbackRef.current) clearTimeout(programmaticSeekFallbackRef.current);
      return;
    }
    
    if (isSyncingRef.current) return;
    if (isHost && videoRef.current) {
      seek(videoRef.current.currentTime);
    } else if (!isHost && videoRef.current) {
      // Non-host: revert seek and resync
      isSyncingRef.current = true;
      
      // Since this is a programmatic revert, flag it too to avoid loops
      isProgrammaticSeekRef.current = true;
      if (programmaticSeekFallbackRef.current) clearTimeout(programmaticSeekFallbackRef.current);
      programmaticSeekFallbackRef.current = setTimeout(() => { isProgrammaticSeekRef.current = false; }, 10000);
      
      videoRef.current.currentTime = playbackState.current_time;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => { isSyncingRef.current = false; syncTimeoutRef.current = null; }, 1000);
      syncFollow();
    }
  };

  // 9. Media Session API for OS Media Controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentMedia?.anime?.nama_anime || 'NanimeID Watch Party',
        artist: currentMedia?.episode ? `Episode ${currentMedia.episode.nomor_episode}: ${currentMedia.episode.judul_episode}` : 'Menunggu Media...',
        album: 'Nobar',
        artwork: currentMedia?.anime?.gambar_anime ? [
          { src: currentMedia.anime.gambar_anime, sizes: '512x512', type: 'image/jpeg' },
          { src: currentMedia.anime.gambar_anime, sizes: '256x256', type: 'image/jpeg' }
        ] : undefined
      });

      if (!isHost) {
        // Non-host: disable all media session controls
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } else {
        navigator.mediaSession.setActionHandler('play', () => { handlePlayPause(); });
        navigator.mediaSession.setActionHandler('pause', () => { handlePlayPause(); });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          if (videoRef.current) {
            const t = Math.max(0, videoRef.current.currentTime - 10);
            videoRef.current.currentTime = t;
            seek(t);
          }
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
          if (videoRef.current) {
            const t = Math.min(videoRef.current.duration || 100, videoRef.current.currentTime + 10);
            videoRef.current.currentTime = t;
            seek(t);
          }
        });
      }
    }
  }, [currentMedia, isHost, syncFollow, seek]);

  // Local Mute Toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  // Local Volume adjustment
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  // Local Fullscreen toggle
  const toggleFullscreen = () => {
    if (isMiniMode) {
      navigate(`/watch-party/${code}`);
      return;
    }
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Chat Submission (Text)
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatText.trim();
    if (!text) return;

    sendChatMessage(text, 'TEXT');
    setChatText('');
  };

  // Chat Submission (Sticker)
  const handleSendSticker = (stickerCode: string) => {
    sendChatMessage('', 'STICKER', stickerCode as any);
    setShowStickerPanel(false);
  };

  // Chat Submission (Image Upload via REST)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !code) return;

    setUploadingImage(true);
    try {
      const res = await watchPartyApi.sendChatMessage(code, {
        kind: 'IMAGE',
        image: file
      });
      if (res?.ok) {
        addToast('success', 'Gambar terkirim.');
      }
    } catch (err: any) {
      addToast('error', `Gagal kirim gambar: ${err.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Copy room link / code
  const handleCopyCode = () => {
    if (!session?.code) return;
    navigator.clipboard.writeText(session.code);
    addToast('success', 'Kode Room berhasil disalin ke clipboard.');
  };

  // Host Action: Lock / Visibility toggle
  const handleToggleLock = async () => {
    if (!session || !isHost) return;
    try {
      const newMode = session.access_mode === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      const password = newMode === 'PRIVATE' ? 'watchparty-rahasia' : undefined;

      const res = await watchPartyApi.lockSession(session.code, {
        access_mode: newMode as any,
        password
      });

      if (res?.ok) {
        addToast('success', `Room sekarang bertipe ${newMode}`);
      }
    } catch (err: any) {
      addToast('error', `Gagal mengubah lock state: ${err.message}`);
    }
  };

  // Host Action: Switch Episode
  const handleSwitchEpisode = async (episodeId: number, quality?: string) => {
    if (!session || !isHost || switchingEpisode) return;
    setSwitchingEpisode(true);
    
    // Explicitly pause and reset time locally and for others when switching episodes
    pause(0);

    try {
      const res = await watchPartyApi.switchEpisode(session.code, {
        episode_id: episodeId,
        quality: quality || session.quality || undefined,
        anime_id: session.anime_id || undefined,
        reset_time: true,
      });
      if (res?.ok) {
        const ep = episodes.find(e => e.id === episodeId);
        addToast('success', `Pindah ke Episode ${ep?.nomor_episode || episodeId}`);
        // The server will broadcast MEDIA_UPDATED to all participants
      }
    } catch (err: any) {
      addToast('error', `Gagal pindah episode: ${err.message}`);
    } finally {
      setSwitchingEpisode(false);
    }
  };

  // Host Action: Kick Participant
  const handleKickParticipant = async (userId: number, username: string) => {
    if (!session || !isHost) return;
    try {
      const res = await watchPartyApi.kickParticipant(session.code, userId);
      if (res?.ok) {
        addToast('success', `@${username} dikeluarkan dari room.`);
      }
    } catch (err: any) {
      addToast('error', `Gagal mengeluarkan peserta: ${err.message}`);
    }
  };

  // Leave room or End room
  const handleLeaveOrEnd = async () => {
    if (!session) return;
    try {
      const res = await watchPartyApi.leaveSession(session.code);
      if (res?.ok) {
        addToast('info', isHost ? 'Sesi Nobar diakhiri.' : 'Keluar dari Nobar.');
        disconnect(); // Terminate local connection so PiP doesn't show
        navigate('/watch-party');
      }
    } catch (err: any) {
      addToast('error', `Gagal meninggalkan room: ${err.message}`);
    }
  };

  // Access badge renderer
  const renderAccessBadge = (mode: string) => {
    switch (mode) {
      case 'PUBLIC':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1"><Globe className="w-3 h-3" /> Publik</Badge>;
      case 'PRIVATE':
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 gap-1"><Lock className="w-3 h-3" /> Private</Badge>;
      case 'FRIENDS':
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 gap-1"><Users className="w-3 h-3" /> Teman</Badge>;
      case 'FOLLOWERS':
        return <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 gap-1"><Users className="w-3 h-3" /> Follower</Badge>;
      default:
        return <Badge>{mode}</Badge>;
    }
  };

  // Render a single message
  const renderMessageBubble = (msg: ChatMessage) => {
    const isMe = msg.user_id === userProfile?.id;
    const isMsgHost = msg.user_id === session?.host_user_id;

    return (
      <div key={msg.id} className={`flex items-start gap-2.5 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
        <UserAvatar
          src={msg.avatar_url || ''}
          name={msg.full_name || msg.username}
          className="w-7 h-7 rounded-full shrink-0 border border-white/10"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary leading-none">
            <span className="font-bold text-white max-w-[120px] truncate">
              {msg.full_name || `@${msg.username}`}
            </span>
            {isMsgHost && <Badge className="bg-primary/20 text-primary border border-primary/20 scale-90 px-1 py-0 select-none">Host</Badge>}
            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className={`p-3 rounded-2xl text-xs text-left shadow ${
            isMe
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-white/5 border border-white/5 text-white rounded-tl-none'
          }`}>
            {msg.kind === 'TEXT' && <p className="leading-relaxed whitespace-pre-wrap break-all">{msg.message}</p>}
            {msg.kind === 'STICKER' && (
              <img
                src={getStickerUrl(msg.sticker)}
                alt="Sticker"
                className="max-w-[80px] object-contain rounded hover:scale-105 transition-transform"
              />
            )}
            {msg.kind === 'IMAGE' && (
              <img
                src={msg.image_url}
                alt="Uploaded"
                onClick={() => setSelectedZoomImage(msg.image_url || null)}
                className="max-w-[150px] max-h-[150px] object-cover rounded-lg bg-white/5 border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Next/Prev Episode calculation
  const sortedEpisodes = [...episodes].sort((a, b) => a.nomor_episode - b.nomor_episode);
  const currentEpIndex = sortedEpisodes.findIndex(e => e.id === session?.episode_id);
  const prevEpisode = currentEpIndex > 0 ? sortedEpisodes[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex !== -1 && currentEpIndex < sortedEpisodes.length - 1 ? sortedEpisodes[currentEpIndex + 1] : null;

  return (
    <div className={isMiniMode ? "w-full h-full relative group/mini" : "grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 text-left relative"}>
      {/* LEFT COLUMN: Player & Metadata */}
      <div className={isMiniMode ? "w-full h-full" : "lg:col-span-2 space-y-4"}>
        {/* Video Box Container */}
        <div
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouch}
          className={`relative w-full bg-black overflow-hidden group/player ${
            isMiniMode ? "h-full rounded-xl" : "aspect-[16/9] rounded-2xl border border-border/40 shadow-2xl"
          } ${isMouseIdle ? "cursor-none" : ""}`}
        >
          {/* Main Video element */}
          <video
            ref={videoRef}
            onPlay={handleNativePlay}
            onPause={handleNativePause}
            onSeeked={handleNativeSeeked}
            className={`w-full h-full cursor-pointer select-none ${isMiniMode ? "object-cover" : "object-contain"}`}
            onClick={handleVideoClick}
          />

          {/* Mini Mode Overlay Controls */}
          {isMiniMode && !isHost && (
            <div 
              className="absolute inset-0 z-20 cursor-pointer bg-transparent hover:bg-black/40 transition-colors flex items-center justify-center group/minihover"
              onClick={() => navigate(`/watch-party/${code}`)}
              title="Klik untuk kembali ke Nobar"
            >
              <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover/minihover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          )}

          {/* ─── Skip Zone Hints (visible on hover) ─── */}
          {currentVideoUrl && isHost && (
            <>
              <div className={`absolute left-0 top-0 bottom-0 w-1/5 flex items-center justify-center opacity-0 ${!isMouseIdle ? 'group-hover/player:opacity-100' : ''} transition-opacity duration-300 pointer-events-none z-[5]`}>
                <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 sm:p-4 flex flex-col items-center gap-1 border border-white/10 shadow-xl">
                  <svg width="20" height="20" className="sm:w-8 sm:h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                  <span className="text-white font-bold text-[9px] sm:text-xs opacity-80">10s</span>
                </div>
              </div>
              <div className={`absolute right-0 top-0 bottom-0 w-1/5 flex items-center justify-center opacity-0 ${!isMouseIdle ? 'group-hover/player:opacity-100' : ''} transition-opacity duration-300 pointer-events-none z-[5]`}>
                <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 sm:p-4 flex flex-col items-center gap-1 border border-white/10 shadow-xl">
                  <svg width="20" height="20" className="sm:w-8 sm:h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                  <span className="text-white font-bold text-[9px] sm:text-xs opacity-80">10s</span>
                </div>
              </div>
            </>
          )}

          {/* ═══ Controls Overlay ═══ */}
          {(!isMiniMode || isHost) && currentVideoUrl && (
            <div 
              className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300 ${
                !isMouseIdle ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Top bar */}
              <div 
                className="p-4 sm:p-6 flex items-start gap-4 pointer-events-auto w-full text-left"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
              >
              <div className="flex flex-col select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                      NOBAR
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-md">
                      {currentMedia?.anime?.nama_anime || 'Nobar'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary mt-0.5 drop-shadow-md">
                    {currentMedia?.episode ? `Episode ${currentMedia.episode.nomor_episode} • ${currentMedia.episode.judul_episode}` : 'Menunggu media...'}
                  </span>
                </div>
              </div>

              {/* Center space */}
              <div className="flex-1 flex items-center justify-center pointer-events-none" />

              {/* Bottom control panel */}
              <div 
                className="w-full pointer-events-auto mt-auto pt-12 pb-4 px-4 sm:px-6 space-y-3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}
              >
                {/* Timeline/Progress Bar */}
                <div className="flex items-center gap-3 group/progress">
                  <span className="text-[10px] font-bold font-mono text-text-secondary min-w-[36px] text-right select-none">
                    {formatTime(currentTime)}
                  </span>
                  
                  <div className="flex-1 py-1.5 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        if (!isHost) return;
                        setCurrentTime(parseFloat(e.target.value));
                      }}
                      onMouseDown={() => { if(isHost) isDraggingRef.current = true; }}
                      onTouchStart={() => { if(isHost) isDraggingRef.current = true; }}
                      onMouseUp={(e) => {
                        if (!isHost) return;
                        isDraggingRef.current = false;
                        const to = parseFloat((e.target as HTMLInputElement).value);
                        if (videoRef.current) videoRef.current.currentTime = to;
                        seek(to);
                      }}
                      onTouchEnd={(e) => {
                        if (!isHost) return;
                        isDraggingRef.current = false;
                        const to = parseFloat((e.target as HTMLInputElement).value);
                        if (videoRef.current) videoRef.current.currentTime = to;
                        seek(to);
                      }}
                      disabled={!isHost}
                      className="w-full player-progress-slider cursor-pointer focus:outline-none"
                      style={{
                        '--value-percent': `${duration ? (currentTime / duration) * 100 : 0}%`
                      } as React.CSSProperties}
                    />
                  </div>

                  <span className="text-[10px] font-bold font-mono text-text-secondary min-w-[36px] select-none">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                  {/* Left side */}
                  <div className="flex items-center gap-4">
                    {isHost && (
                      <button 
                        onClick={() => prevEpisode && handleSwitchEpisode(prevEpisode.id)}
                        disabled={!prevEpisode || switchingEpisode}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Episode Sebelumnya"
                      >
                        <SkipBack className="w-5 h-5 fill-current" />
                      </button>
                    )}

                    <button 
                      onClick={handlePlayPause}
                      className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                      title={isHost ? "Putar/Jeda" : "Resync"}
                    >
                      {playbackState.is_paused
                        ? <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        : <Pause className="w-5 h-5 fill-current" />}
                    </button>

                    {isHost && (
                      <button 
                        onClick={() => nextEpisode && handleSwitchEpisode(nextEpisode.id)}
                        disabled={!nextEpisode || switchingEpisode}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Episode Selanjutnya"
                      >
                        <SkipForward className="w-5 h-5 fill-current" />
                      </button>
                    )}

                    {/* Volume controls */}
                    <div className="flex items-center gap-2 group/volume">
                      <button 
                        onClick={toggleMute}
                        className="text-white transition-all duration-200 focus:outline-none cursor-pointer p-1 active:scale-90"
                        title={muted ? "Nyalakan Suara" : "Senyap"}
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
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-0 sm:overflow-hidden sm:opacity-0 sm:group-hover/volume:w-16 sm:group-hover/volume:opacity-100 opacity-100 transition-all duration-300 player-volume-slider cursor-pointer focus:outline-none"
                        style={{
                          '--volume-percent': `${(muted ? 0 : volume) * 100}%`
                        } as React.CSSProperties}
                      />
                    </div>

                    {/* Time badge */}
                    <span className="hidden sm:inline-block text-[10px] font-bold text-text-secondary/70 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md select-none font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right side: Speed, Fullscreen */}
                  <div className="flex items-center gap-3">
                    {isHost && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="text-white transition-all duration-200 focus:outline-none p-1 cursor-pointer active:scale-90"
                          title="Kecepatan"
                        >
                          <Settings className="w-4.5 h-4.5" />
                        </button>

                        {showSpeedMenu && (
                          <div className="absolute bottom-10 right-0 w-48 bg-bg-elevated dark:bg-black/95 border border-border/40 dark:border-white/10 rounded-xl p-2.5 shadow-2xl z-30 space-y-1 backdrop-blur-md">
                            <div className="flex justify-between border-b border-border/40 dark:border-white/10 pb-1.5 mb-1.5 select-none text-left">
                              <span className="text-[10px] font-bold text-text-secondary tracking-wider">KECEPATAN</span>
                            </div>
                            <div className="space-y-0.5 text-left">
                              {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => handleSpeedChange(rate)}
                                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                    playbackState.speed === rate
                                      ? 'bg-primary text-black font-bold'
                                      : 'text-text-primary hover:bg-bg-elevated dark:hover:bg-white/5'
                                  }`}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fullscreen Button */}
                    <button 
                      onClick={toggleFullscreen}
                      className="text-white transition-all duration-200 focus:outline-none p-1 cursor-pointer active:scale-90"
                      title="Layar Penuh"
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skip Indicator Animation */}
          {skipIndicator && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${skipIndicator.direction === 'forward' ? 'right-1/4' : 'left-1/4'} z-20 pointer-events-none`}>
              <div className={`flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 text-white text-xl font-black border border-white/20 shadow-2xl animate-fade-in`}>
                {skipIndicator.direction === 'backward' ? (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
                    <span>-{skipIndicator.seconds}s</span>
                  </>
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                    <span>+{skipIndicator.seconds}s</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {!currentVideoUrl && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Tv className="w-7 h-7 text-white/15" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border border-primary/20 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white/40 text-xs font-medium">Menunggu host memutar media...</p>
                <p className="text-white/20 text-[10px]">Video akan muncul secara otomatis</p>
              </div>
            </div>
          )}
        </div>

        {/* Video metadata & Host Panel below player */}
        {!isMiniMode && (
        <>
          <div className="bg-bg-sidebar/60 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-bold text-white line-clamp-1">
                  {currentMedia?.anime?.nama_anime || 'Bioskop Nobar'}
                </h2>
                <p className="text-text-secondary text-xs">
                  {currentMedia?.episode ? `Episode ${currentMedia.episode.nomor_episode}: ${currentMedia.episode.judul_episode}` : 'Menunggu pemilihan anime/episode...'}
                </p>
              </div>

              {/* Quick Share Code */}
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/5 rounded-xl px-4 py-2 text-xs w-fit">
                <span className="text-text-secondary font-mono uppercase tracking-wider">KODE:</span>
                <span className="text-white font-bold font-mono text-sm tracking-widest">{code}</span>
                <button
                  onClick={handleCopyCode}
                  className="text-text-secondary hover:text-white transition-colors"
                  title="Salin Kode Room"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                {/* Visibilitas status */}
                {session && renderAccessBadge(session.access_mode)}

                {/* Viewer count */}
                <div className="text-xs text-text-secondary flex items-center gap-1 select-none">
                  <Users className="w-4 h-4" />
                  <span>{participants.length} Terhubung</span>
                </div>
              </div>

              {/* Room operations buttons */}
              <div className="flex items-center gap-2">
                {/* Voice Controls */}
                {!voiceConnected ? (
                  <button 
                    onClick={joinVoice}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 text-xs font-bold"
                    title="Gabung Voice Chat"
                  >
                    <Headphones className="w-4 h-4" />
                    <span className="hidden sm:inline">Gabung Voice</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => setVoiceMicEnabled(!voiceMicEnabled)}
                      className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                        voiceMicEnabled 
                          ? 'hover:bg-white/10 text-white' 
                          : 'bg-rose-500/20 border border-rose-500/20 text-rose-500'
                      }`}
                      title={voiceMicEnabled ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
                    >
                      {voiceMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={leaveVoice}
                      className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all"
                      title="Keluar Voice Chat"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isHost && session && (
                  <>
                    <button
                      onClick={handleToggleLock}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-xs"
                      title={session.access_mode === 'PUBLIC' ? 'Kunci Room (Private)' : 'Buka Room (Publik)'}
                    >
                      {session.access_mode === 'PRIVATE' ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </>
                )}
                <button
                  onClick={handleLeaveOrEnd}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <LogOut className="w-4 h-4" />
                  {isHost ? 'Akhiri Sesi' : 'Keluar Room'}
                </button>
              </div>
            </div>
          </div>

          {/* ═══ Floating Voice Chat Bar ═══ */}
          {voiceConnected && (
            <div className="bg-bg-sidebar/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Voice Chat Aktif</span>
                  <span className="text-[10px] text-text-secondary">({voicePeers.length + 1} orang)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVoiceMicEnabled(!voiceMicEnabled)}
                    className={`p-2 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${
                      voiceMicEnabled
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    }`}
                    title={voiceMicEnabled ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
                  >
                    {voiceMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    <span className="hidden sm:inline text-[10px]">{voiceMicEnabled ? 'Mute' : 'Unmute'}</span>
                  </button>
                  <button
                    onClick={leaveVoice}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white transition-all"
                    title="Putuskan Voice Chat"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Connected Peers */}
              <div className="flex flex-wrap gap-2">
                {/* Self */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold ${
                  voiceMicEnabled
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.02] border-white/10 text-text-secondary'
                }`}>
                  <UserAvatar
                    src={userProfile?.avatarUrl || ''}
                    name={userProfile?.name || 'Anda'}
                    className="w-5 h-5 rounded-full"
                  />
                  <span>Anda</span>
                  {voiceMicEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                </div>
                {/* Remote Peers */}
                {voicePeers.map((peer) => {
                  const pInfo = participants.find(p => p.user_id === peer.user_id);
                  return (
                    <div
                      key={peer.user_id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold ${
                        peer.mic_enabled
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                          : 'bg-white/[0.02] border-white/10 text-text-secondary'
                      }`}
                    >
                      <UserAvatar
                        src={pInfo?.avatar || ''}
                        name={pInfo?.username || peer.username || `User #${peer.user_id}`}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="max-w-[80px] truncate">{pInfo?.username || peer.username || `User #${peer.user_id}`}</span>
                      {peer.mic_enabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* RIGHT COLUMN: Sidebar (Tabs, Chat, Participants, Voice Controls) */}
      {!isMiniMode && (
      <>
        <div className="bg-bg-sidebar/40 rounded-2xl flex flex-col h-[60vh] sm:h-[calc(100vh-140px)] min-h-[400px] sm:min-h-[500px] overflow-hidden">
          {/* Tab Headers */}
          <div className="grid grid-cols-3 border-b border-white/5 shrink-0 bg-white/[0.02]">
            {[
              { id: 'chat', label: 'Chat' },
              { id: 'participants', label: 'Peserta' },
              { id: 'episodes', label: 'Episode' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-[11px] font-bold border-b-2 text-center transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* TAB 1: Chat Message List */}
            {activeTab === 'chat' && (
              <>
                {/* Message scroll list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col no-scrollbar">
                  {messages.length === 0 ? (
                    <div className="my-auto text-center space-y-2 p-6 text-text-secondary">
                      <Users className="w-10 h-10 mx-auto text-white/5" />
                      <p className="font-semibold text-white/60 text-xs">Selamat Datang di Nobar!</p>
                      <p className="text-[10px] leading-relaxed max-w-xs mx-auto">
                        Gunakan chat di bawah untuk mengobrol, mengirim stiker, atau membagikan gambar real-time.
                      </p>
                    </div>
                  ) : (
                    messages.map(renderMessageBubble)
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input panel */}
                <div className="p-3 border-t border-white/5 bg-black/40 relative">
                  <form onSubmit={handleSendChat} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tulis pesan..."
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-white"
                    />
                    <button
                      type="submit"
                      disabled={!chatText.trim()}
                      className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all disabled:opacity-40 disabled:hover:bg-primary"
                    >
                      <Send className="w-4 h-4 fill-white/10" />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* TAB 2: Participants list */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-text-secondary">Daftar Penonton ({participants.length})</h4>
                <div className="divide-y divide-white/5">
                  {participants.map((p) => {
                    const isParticipantHost = p.user_id === session?.host_user_id;
                    const hasMic = p.mic_enabled !== undefined;

                    return (
                      <div key={p.user_id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            src={p.avatar || (p as any).avatar_url || ''}
                            name={p.username}
                            className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 text-left leading-tight">
                            <span className="font-bold text-white text-xs block truncate">{p.username}</span>
                            <span className="text-[10px] text-text-secondary block">
                              {isParticipantHost ? 'Host Room' : 'Peserta'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mic Icon indicator */}
                          {hasMic && (
                            <div className={`p-1.5 rounded-lg border ${
                              p.mic_enabled
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-text-secondary'
                            }`} title={p.mic_enabled ? 'Mikrofon Aktif' : 'Mikrofon Mati'}>
                              {p.mic_enabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                            </div>
                          )}

                          {/* Kick Button (Only Host can kick members, cannot kick self) */}
                          {isHost && !isParticipantHost && (
                            <button
                              onClick={() => handleKickParticipant(p.user_id, p.username)}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-[10px] font-bold transition-all active:scale-95"
                            >
                              Kick
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}



            {/* TAB 3: Episode List */}
            {activeTab === 'episodes' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-bold text-text-secondary">Daftar Episode</h4>
                {episodes.length === 0 ? (
                  <div className="text-center text-text-secondary py-8">
                    <List className="w-8 h-8 mx-auto text-white/10 mb-2" />
                    <p className="text-xs">Tidak ada episode tersedia</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {episodes.map((ep) => {
                      const isCurrentEp = ep.id === session?.episode_id;
                      return (
                        <div
                          key={ep.id}
                          className={`rounded-xl border p-3 transition-all ${
                            isCurrentEp
                              ? 'border-primary bg-primary/10'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isCurrentEp ? 'text-primary' : 'text-white'}`}>
                                Episode {ep.nomor_episode}
                              </p>
                              {ep.judul_episode && (
                                <p className="text-[10px] text-text-secondary truncate mt-0.5">{ep.judul_episode}</p>
                              )}
                            </div>
                            {isCurrentEp ? (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">Sedang Diputar</span>
                            ) : isHost ? (
                              <button
                                onClick={() => handleSwitchEpisode(ep.id)}
                                disabled={switchingEpisode}
                                className="text-[10px] font-bold text-white bg-white/10 hover:bg-primary hover:text-white px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 shrink-0 flex items-center gap-1"
                              >
                                {switchingEpisode ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                                Putar
                              </button>
                            ) : null}
                          </div>
                          {/* Quality selector for host */}
                          {isHost && !isCurrentEp && ep.qualities && ep.qualities.length > 1 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {ep.qualities.map((q) => (
                                <button
                                  key={q.id}
                                  onClick={() => handleSwitchEpisode(ep.id, q.source_quality)}
                                  disabled={switchingEpisode}
                                  className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-primary/20 border border-white/10 text-text-secondary hover:text-primary transition-all disabled:opacity-50"
                                >
                                  {q.nama_quality}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* --- IMAGE ZOOM / LIGHTBOX MODAL --- */}
        {selectedZoomImage && (
          <div
            onClick={() => setSelectedZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          >
            <img
              src={selectedZoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded shadow-2xl animate-scale-up"
            />
          </div>
        )}
      </>
      )}
    </div>
  );
};

export default WatchPartyRoom;
