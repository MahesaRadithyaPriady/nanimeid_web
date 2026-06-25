import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls, { FetchLoader } from 'hls.js';
import { Maximize2, X, Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useAppStore } from '../../stores/useAppStore';

export const GlobalMiniPlayer: React.FC = () => {
  const { 
    isActive, 
    isMiniMode, 
    videoSource, 
    currentAnime, 
    currentEpisode, 
    currentEpNum,
    currentEpKey,
    currentTime,
    isPlaying,
    setIsMiniMode,
    closePlayer,
    updateTime,
    setIsPlaying
  } = usePlayerStore();
  
  const navigate = useNavigate();
  // We use a ref to hold the imperative video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 1. Create the video element on mount (so React doesn't manage it in VDOM)
  useEffect(() => {
    const video = document.createElement('video');
    video.className = "w-full h-full object-cover";
    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.autoplay = true;
    video.id = "global-video-element"; // Help WatchPage find it if needed
    // Nonaktifkan PiP bawaan browser
    (video as any).disablePictureInPicture = true;
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
    videoRef.current = video;

    return () => {
      video.remove();
      videoRef.current = null;
    };
  }, []);

  // 2. DOM Reparenting Logic — tanpa jeda (seamless)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reparentSeamless = () => {
      // Simpan state sebelum reparent
      const wasPlaying = !video.paused;
      const savedTime = video.currentTime;

      let target: HTMLElement | null = null;
      if (!isMiniMode) {
        target = document.getElementById('global-video-portal');
      } else {
        target = wrapperRef.current;
      }

      if (!target) return false;
      if (video.parentElement === target) return true; // sudah di tempat yang benar

      // Pindahkan DOM tanpa memicu perubahan src/load
      target.appendChild(video);

      // Restore posisi dan state bermain secara sinkron
      // Gunakan microtask agar browser selesai me-reparent dulu
      Promise.resolve().then(() => {
        if (!video) return;
        // Restore time hanya jika drift > 0.3s (reparent bisa reset currentTime di beberapa browser)
        if (Math.abs(video.currentTime - savedTime) > 0.3) {
          video.currentTime = savedTime;
        }
        if (wasPlaying && video.paused) {
          video.play().catch(() => {});
        }
      });

      return true;
    };

    const success = reparentSeamless();
    
    let observer: MutationObserver | null = null;
    if (!success && !isMiniMode) {
      observer = new MutationObserver(() => {
        if (reparentSeamless()) {
          observer?.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [isMiniMode, isActive]);

  const hlsRef = useRef<Hls | null>(null);
  // Simpan epKey terakhir yang di-load HLS agar tidak double-load
  const lastLoadedEpKeyRef = useRef<string>('');

  // 3. Handle Video Source and HLS — reload saat episode berubah (currentEpKey)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource || !currentEpKey) {
      return;
    }

    // Use proxy on localhost (dev & preview) to avoid CORS issues
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const proxiedSource = isLocalhost && videoSource.startsWith('https://cdn-stable.nanimeid.xyz')
      ? videoSource.replace('https://cdn-stable.nanimeid.xyz', '/cdn-proxy')
      : videoSource;

    const isHls = /\.m3u8(\?|#|$)/i.test(proxiedSource);

    // Jika episode berubah, destroy HLS lama dan buat ulang
    const epChanged = lastLoadedEpKeyRef.current !== currentEpKey;
    if (epChanged && hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    lastLoadedEpKeyRef.current = currentEpKey;

    if (isHls && Hls.isSupported()) {
      if (!hlsRef.current) {
        hlsRef.current = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          loader: FetchLoader,
          startLevel: -1,
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          startFragPrefetch: true,
          testBandwidth: false,
          abrEwmaDefaultEstimate: 1_000_000,
          abrBandWidthFactor: 4,
          abrBandWidthUpFactor: 4,
        });
        hlsRef.current.attachMedia(video);
      }
      
      const loadSrc = () => {
        hlsRef.current?.loadSource(proxiedSource);
      };

      if (hlsRef.current.media === video) {
        loadSrc();
      } else {
        hlsRef.current.once(Hls.Events.MEDIA_ATTACHED, loadSrc);
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = proxiedSource;
      video.load();
    }
  }, [videoSource, currentEpKey]);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // 4. Handle Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => updateTime(video.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedData = () => {
      video.play().catch(() => {});
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadeddata', onLoadedData);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, [updateTime, setIsPlaying]);

  // 5. Watch XP Logic
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    let watchTickInterval: ReturnType<typeof setInterval> | null = null;

    const sendWatchTick = () => {
      if (!currentEpisode?.id) return;
      // Prevent sending tick more than once every 55 seconds
      const now = Date.now();
      if (now - lastTickRef.current < 55_000) return;
      lastTickRef.current = now;
      import('../../lib/watchApi').then(({ postWatchTick }) => {
        postWatchTick(currentEpisode.id)
          .then((res) => {
            if (res.data) {
              const { xp, coin, tick } = res.data;
              if (tick.seconds_rewarded > 0) {
                const appStore = useAppStore.getState();
                if (xp.current_xp !== undefined) appStore.updateProfile({ xp: xp.current_xp });
                if (coin.balance !== undefined) appStore.updateProfile({ coins: coin.balance });
                
                if (isMiniMode) {
                  appStore.addToast('success', `+${xp.gained_this_tick} XP & +${coin.gained_this_tick} Coin dari Mini Player`);
                }
              }
            }
          })
          .catch(err => console.error('[MiniPlayer Watch Tick] Failed:', err));
      });
    };

    if (isPlaying && currentEpisode?.id) {
      // Only start interval, don't send immediately — wait 60s for first tick
      watchTickInterval = setInterval(sendWatchTick, 60_000);
    }

    return () => {
      if (watchTickInterval) {
        clearInterval(watchTickInterval);
      }
    };
  }, [isPlaying, currentEpisode?.id, isMiniMode]);

  if (!isActive) return null;

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    closePlayer();
  };

  const handleExpand = () => {
    if (currentAnime && currentEpNum) {
      navigate(`/watch/${currentAnime.id}/ep/${currentEpNum}`);
      setIsMiniMode(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div id="global-mini-player-root" className="contents">
      <div className={!isMiniMode ? "hidden" : ""}>
        <div 
          className="fixed bottom-3 right-3 w-[180px] sm:w-[400px] aspect-video z-[9999] shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-border/40 transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Default location for video element when in mini mode */}
          <div ref={wrapperRef} className="w-full h-full pointer-events-auto" />
          
          {/* Overlay controls for Mini Player */}
          {isMiniMode && isHovered && (
            <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-between p-2 sm:p-3 transition-opacity">
              <div className="flex justify-between items-start">
                <div className="text-white text-[10px] sm:text-xs font-medium truncate max-w-[65%] sm:max-w-[70%]">
                  {currentAnime?.nama_anime} - Ep {currentEpNum}
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button 
                    onClick={handleExpand}
                    className="p-1 sm:p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all"
                    title="Expand"
                  >
                    <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button 
                    onClick={handleClose}
                    className="p-1 sm:p-1.5 bg-white/20 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-all"
                    title="Close"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-center items-center h-full pb-4 sm:pb-6">
                <button 
                  onClick={togglePlay}
                  className="p-2 sm:p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4 sm:w-6 sm:h-6" /> : <Play className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5 sm:ml-1" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
