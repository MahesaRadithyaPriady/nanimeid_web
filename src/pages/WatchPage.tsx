import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, Settings, ArrowLeft, ArrowRight, Heart, Send, MessageSquare, Star } from 'lucide-react';
import { MOCK_ANIMES, MOCK_EPISODES, MOCK_COMMENTS } from '../constants/mockData';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';
import { AnimeCard } from '../components/cards/AnimeCard';

export const WatchPage: React.FC = () => {
  const { slug, episodeNumber } = useParams<{ slug: string; episodeNumber: string }>();
  const navigate = useNavigate();
  const currentEpNum = parseInt(episodeNumber || '1', 10);

  const { 
    videoVolume, setVideoVolume, 
    videoQuality, setVideoQuality, 
    subtitleLang, setSubtitleLang,
    addWatchHistory, watchHistory, 
    addToast 
  } = useAppStore();

  // Find Anime and Episodes
  const anime = MOCK_ANIMES.find(a => a.slug === slug);
  if (!anime) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold">Anime tidak ditemukan!</h2>
        <Link to="/" className="text-primary hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const episodes = MOCK_EPISODES[anime.id] || [];
  const currentEpisode = episodes.find(e => e.episodeNumber === currentEpNum) || episodes[0];

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
  
  // Interactive Comments State
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');

  const controlsTimeoutRef = useRef<any | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in comment input
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

  // Track progress and update history
  useEffect(() => {
    if (!videoRef.current || !currentEpisode) return;

    // Reset video source on episode change
    videoRef.current.load();
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);

    // Auto-play when changing episode (standard playlist behavior)
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    // Load last progress if watched recently
    const historyRecord = watchHistory.find(
      h => h.animeId === anime.id && h.episodeNumber === currentEpNum
    );
    if (historyRecord && videoRef.current) {
      videoRef.current.currentTime = historyRecord.progress * (videoRef.current.duration || 1450);
    }
  }, [currentEpNum, slug]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);
    
    // Save progress periodically to global store
    if (current > 10 && current % 10 < 1) {
      addWatchHistory(
        anime.id,
        anime.title,
        anime.slug,
        currentEpisode.episodeNumber,
        currentEpisode.title,
        current / dur
      );
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
    setVideoQuality(quality);
    setOpenSettings('none');
    addToast('success', `Kualitas video diubah ke ${quality}`);
  };

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle Comment Submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `comment-new-${Date.now()}`,
      userName: 'Andi Pratama (Anda)',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      content: newCommentText.trim(),
      timestamp: 'Baru saja',
      likes: 0
    };

    setComments(prev => [newComment, ...prev]);
    setNewCommentText('');
    addToast('success', 'Komentar Anda berhasil dikirim!');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        addToast('success', 'Menyukai komentar');
        return { ...c, likes: c.likes + 1 };
      }
      return c;
    }));
  };

  // Related anime recommendations
  const relatedAnimes = MOCK_ANIMES
    .filter(a => a.id !== anime.id)
    .slice(0, 4);

  return (
    <div className="pb-16 space-y-6">
      
      {/* Back to details link */}
      <Link 
        to={`/anime/${anime.slug}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors focus:outline-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Detail Anime</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Area: Player, Title, comments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player Box */}
          <div 
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            className={`relative aspect-[16/9] w-full bg-black rounded-2xl overflow-hidden border border-border/40 select-none group/player ${
              isFullscreen ? 'h-screen w-screen border-none rounded-none' : ''
            }`}
          >
            {/* Native Video Element */}
            <video
              ref={videoRef}
              src={currentEpisode?.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Custom Overlay Controls */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 flex flex-col justify-end p-4 transition-opacity duration-300 z-10 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              
              {/* Play state big center display */}
              <div 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent"
              >
                {!isPlaying && (
                  <div className="p-4 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-full hover:scale-105 transition-all shadow-glow">
                    <Play className="w-8 h-8 fill-primary" />
                  </div>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="flex items-center gap-3 w-full mb-3.5 z-20">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressSeek}
                  className="w-full player-progress-slider accent-primary bg-white/20 cursor-pointer"
                />
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between w-full z-20">
                
                {/* Left controls: Play, Skip (desktop), Volume (desktop), Time */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button 
                    onClick={togglePlay} 
                    className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white" /> : <Play className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white" />}
                  </button>

                  <button 
                    onClick={() => skipTime(-10)} 
                    className="hidden sm:flex p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                    aria-label="Kembali 10 detik"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>

                  <button 
                    onClick={() => skipTime(10)} 
                    className="hidden sm:flex p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                    aria-label="Maju 10 detik"
                  >
                    <RotateCw className="w-4.5 h-4.5" />
                  </button>

                  {/* Volume block (Icon visible on all devices, slider expands on hover on desktop) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 group/volume">
                    <button 
                      onClick={toggleMute} 
                      className="p-1 sm:p-1.5 hover:bg-white/10 hover:text-primary rounded-lg text-white transition-all active:scale-90"
                      aria-label="Bisukan suara"
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
                      className="w-0 sm:group-hover/volume:w-16 transition-all duration-300 accent-primary bg-white/20 h-1 rounded cursor-pointer hidden sm:block focus:outline-none"
                    />
                  </div>

                  {/* Time indicator (smaller font, no wrap on mobile) */}
                  <span className="text-[10px] sm:text-xs font-mono text-white/90 whitespace-nowrap">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right controls: Quality, Speed, Subtitle, Fullscreen */}
                <div className="flex items-center gap-1 sm:gap-1.5 relative">
                  
                  {/* Settings / Controls */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenSettings(prev => prev === 'quality' ? 'none' : 'quality')}
                      className={`p-1 sm:p-1.5 rounded-lg text-white transition-colors ${openSettings === 'quality' ? 'bg-white/20 text-primary' : 'hover:bg-white/10'}`}
                      aria-label="Kualitas video"
                    >
                      <Settings className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </button>

                    {/* Quality panel */}
                    {openSettings === 'quality' && (
                      <div className="absolute bottom-10 right-0 w-32 bg-bg-elevated border border-border rounded-xl py-1 z-35 shadow-lg flex flex-col text-left">
                        <span className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase">Resolusi</span>
                        {['360p', '480p', '720p', '1080p'].map(q => (
                          <button
                            key={q}
                            onClick={() => changeQuality(q as any)}
                            className={`px-3 py-1.5 text-xs hover:bg-bg-surface text-left ${videoQuality === q ? 'text-primary font-semibold' : 'text-text-primary'}`}
                          >
                            {q}
                          </button>
                        ))}
                        <div className="border-t border-border/50 my-1" />
                        <button
                          onClick={() => setOpenSettings('speed')}
                          className="px-3 py-1.5 text-xs hover:bg-bg-surface text-left text-primary-light font-medium"
                        >
                          Kecepatan &gt;
                        </button>
                      </div>
                    )}

                    {/* Speed panel */}
                    {openSettings === 'speed' && (
                      <div className="absolute bottom-10 right-0 w-32 bg-bg-elevated border border-border rounded-xl py-1 z-35 shadow-lg flex flex-col text-left">
                        <span className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase">Kecepatan</span>
                        {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => changeSpeed(speed)}
                            className={`px-3 py-1.5 text-xs hover:bg-bg-surface text-left ${playbackRate === speed ? 'text-primary font-semibold' : 'text-text-primary'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                        <div className="border-t border-border/50 my-1" />
                        <button
                          onClick={() => setOpenSettings('quality')}
                          className="px-3 py-1.5 text-xs hover:bg-bg-surface text-left text-muted"
                        >
                          &lt; Kembali
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subtitle language select (compact style on mobile) */}
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
                  {anime.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                  <span className="bg-primary/20 text-primary-light font-mono font-bold text-xs px-2 py-0.5 rounded border border-primary/20 whitespace-nowrap">
                    EPISODE {currentEpisode?.episodeNumber}
                  </span>
                  <span className="font-semibold text-text-primary truncate">{currentEpisode?.title}</span>
                </div>
              </div>

              {/* Navigation prev/next episode */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={currentEpNum <= 1}
                  onClick={() => navigate(`/watch/${slug}/ep/${currentEpNum - 1}`)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-bg-base hover:bg-bg-elevated border border-border/60 hover:border-primary/40 text-xs font-bold text-text-primary rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-bg-base disabled:hover:border-border/60 active:scale-95 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
                
                <button
                  disabled={currentEpNum >= episodes.length}
                  onClick={() => navigate(`/watch/${slug}/ep/${currentEpNum + 1}`)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black font-bold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:from-border disabled:to-border shadow-sm"
                >
                  <span>Berikutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-details & badges row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              
              {/* Left stats: Rating, Studio, Type */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-mono text-text-primary">{anime.rating.toFixed(1)}</span>
                </div>
                <div className="text-xs">
                  Studio: <span className="text-text-primary font-semibold">{anime.studio}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/10 hidden sm:block" />
                <div className="text-xs uppercase">
                  Tipe: <span className="text-text-primary font-semibold">{anime.type}</span>
                </div>
              </div>

              {/* Right indicators */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="type" className="bg-green-500/10 text-green-400 border-none px-3 py-1 font-bold text-[10px] sm:text-xs">
                  SUBTITLE INDONESIA
                </Badge>
                <Badge variant="type" className="px-3 py-1 font-bold text-[10px] sm:text-xs">
                  {videoQuality}
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
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Tulis opini Anda tentang episode ini..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 bg-bg-base border border-border/80 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-muted"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 text-primary hover:text-primary-light transition-colors"
                  aria-label="Kirim komentar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-pink">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-sm border-b border-border/30 pb-3 last:border-none">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border">
                    <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-text-primary">{comment.userName}</strong>
                      <span className="text-[10px] text-muted">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pr-2">{comment.content}</p>
                    
                    {/* Likes/Engagement */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors focus:outline-none"
                      >
                        <Heart className="w-3 h-3 hover:fill-primary text-muted hover:text-primary" />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Area (Sidebar): Episode List */}
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col text-left">
          <div className="pb-3 border-b border-border/50 mb-3 shrink-0">
            <h3 className="text-sm font-bold text-text-primary tracking-wide">
              Episode {anime.title}
            </h3>
            <p className="text-[10.5px] text-muted mt-0.5">Memutar {currentEpNum} dari {episodes.length} episode</p>
          </div>

          {/* Episode List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-pink">
            {episodes.map((ep) => {
              // Find progress
              const hist = watchHistory.find(h => h.animeId === anime.id && h.episodeNumber === ep.episodeNumber);
              const prog = hist ? hist.progress : 0;
              const active = currentEpNum === ep.episodeNumber;

              return (
                <Link
                  key={ep.id}
                  to={`/watch/${slug}/ep/${ep.episodeNumber}`}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                    active 
                      ? 'bg-primary/5 border-primary/40' 
                      : 'bg-bg-base border-transparent hover:bg-bg-elevated'
                  }`}
                >
                  {/* Thumbnail 16:9 */}
                  <div className="relative w-20 aspect-[16/9] bg-bg-surface rounded overflow-hidden shrink-0">
                    <img src={ep.thumbnailUrl} alt={`Ep ${ep.episodeNumber}`} className="w-full h-full object-cover" />
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
                        EP {ep.episodeNumber}
                      </span>
                      {ep.subAvailable && <span className="text-[9px] text-green-400 font-bold">SUB</span>}
                    </div>
                    <p className={`text-xs truncate font-semibold mt-1 ${active ? 'text-primary' : 'text-text-primary'}`}>
                      {ep.title}
                    </p>
                    <span className="text-[9.5px] text-muted block mt-0.5 font-mono">{ep.duration}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recommended Anime Section below */}
      <div className="space-y-4 text-left">
        <h3 className="text-lg font-bold font-heading text-text-primary">Rekomendasi Lainnya</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {relatedAnimes.map((a) => (
            <div key={a.id} className="animate-fade-in">
              <AnimeCard anime={a} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
export default WatchPage;
