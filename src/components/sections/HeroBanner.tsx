import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Badge } from '../ui/Badge';
import { fetchAnimeRecommendations, fetchAnimeByView } from '../../lib/animeApi';
import type { ApiAnime, Anime } from '../../types';
import { SkeletonHeroBanner } from '../cards/SkeletonCard';

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, addToast, isLoggedIn } = useAppStore();
  const [animes, setAnimes] = useState<ApiAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<any | null>(null);

  // Load featured/recommended anime from backend API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let items: ApiAnime[] = [];
        try {
          const recsRes = await fetchAnimeRecommendations({ limit: 5, type: 'ANIME' });
          items = recsRes.data ?? [];
        } catch (recsErr) {
          console.warn('Failed to fetch anime recommendations, trying fallback:', recsErr);
        }

        // Fallback to trending by view if recommendations failed or is empty
        if (items.length === 0) {
          const viewRes = await fetchAnimeByView({ limit: 5, type: 'ANIME' });
          items = viewRes.items ?? [];
        }

        if (cancelled) return;
        setAnimes(items);
      } catch (err) {
        console.error('Failed to load HeroBanner backend data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-play timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animes.length === 0) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % animes.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [animes.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (animes.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + animes.length) % animes.length);
    startTimer();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (animes.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % animes.length);
    startTimer();
  };

  if (loading) {
    return <SkeletonHeroBanner />;
  }

  if (animes.length === 0) return null;

  const currentAnime = animes[activeIndex];
  const bookmarked = isBookmarked(String(currentAnime.id), 'anime');

  const handleBookmarkToggle = () => {
    if (!isLoggedIn) {
      addToast('info', 'Login dulu untuk menyimpan konten!');
      return;
    }
    if (bookmarked) {
      removeBookmark(String(currentAnime.id), 'anime');
      addToast('info', `Dihapus dari simpanan: ${currentAnime.nama_anime}`);
    } else {
      const mappedAnime: Anime = {
        id: String(currentAnime.id),
        title: currentAnime.nama_anime,
        slug: String(currentAnime.id),
        description: currentAnime.sinopsis_anime ?? '',
        type: 'anime',
        status: (currentAnime.status_anime ?? '').toLowerCase().includes('ongoing') ? 'ongoing' : 'completed',
        releaseDate: currentAnime.tanggal_rilis_anime ?? '',
        studio: (currentAnime.studio_anime ?? []).join(', ') || '-',
        rating: currentAnime.rating_anime ?? 0,
        episodeCount: currentAnime.episodes_count ?? 0,
        genres: currentAnime.genre_anime ?? [],
        coverUrl: currentAnime.gambar_anime,
        posterUrl: currentAnime.gambar_anime,
      };
      addBookmark(mappedAnime);
      addToast('success', `Disimpan ke daftar: ${currentAnime.nama_anime}`);
    }
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] md:h-[420px] lg:h-[480px] bg-bg-base rounded-2xl overflow-hidden group border border-border/40">
      
      {/* Background Poster */}
      <div className="absolute inset-0 z-0 overflow-hidden transition-all duration-700 ease-out">
        <img
          src={currentAnime.gambar_anime}
          alt={currentAnime.nama_anime}
          className="w-full h-full object-cover scale-[1.02] brightness-[0.85] transition-all duration-700"
        />
        {/* Bottom vignette untuk keterbacaan teks — pakai inline style agar tidak kena override */}
        <div style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)' }} className="absolute inset-0" />
        {/* Side vignette desktop */}
        <div style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 60%)' }} className="absolute inset-0 hidden md:block" />
      </div>

      {/* Hero Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-10 lg:p-12 z-10 text-left flex flex-col items-start max-w-2xl">
        {/* Genre Badges */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {(currentAnime.genre_anime ?? []).slice(0, 3).map((g) => (
            <Badge key={g} variant="genre" className="bg-white/15 dark:bg-primary/20 text-white/90 dark:text-primary-light font-semibold uppercase tracking-wider text-[10px] backdrop-blur-sm border border-white/25 dark:border-primary/20">
              {g}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold font-heading text-white leading-tight tracking-tight drop-shadow-md mb-1.5 sm:mb-2 line-clamp-2">
          {currentAnime.nama_anime}
        </h1>

        {/* Rating and Info */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-white/70 font-sans mb-2 sm:mb-3 font-medium">
          <span className="flex items-center gap-1 text-yellow-400">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <strong className="text-white font-mono">{(currentAnime.rating_anime ?? 0).toFixed(1)}</strong>
          </span>
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/30" />
          <span className="hidden sm:inline">{(currentAnime.studio_anime ?? []).join(', ') || '-'}</span>
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/30 hidden sm:block" />
          <span>{currentAnime.episodes_count ?? 0} Ep</span>
        </div>

        {/* Short Synopsis */}
        <p className="hidden sm:block text-sm text-white/60 leading-relaxed drop-shadow-sm line-clamp-2 mb-6 max-w-lg">
          {currentAnime.sinopsis_anime ?? 'Belum ada sinopsis.'}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-0">
          <button
            onClick={() => navigate(`/watch/${currentAnime.id}/ep/1`)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg bg-primary text-black font-bold text-[11px] sm:text-sm whitespace-nowrap hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-black text-black" />
            <span>Tonton</span>
          </button>
          
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg border text-[11px] sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              bookmarked 
                ? 'bg-primary/10 border-primary text-pink-700 dark:text-primary-light' 
                : 'bg-white/20 dark:bg-black/35 backdrop-blur-sm border-white/40 dark:border-border hover:border-primary text-white'
            }`}
          >
            {bookmarked ? (
              <>
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-light" />
                <span>Tersimpan</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 dark:bg-black/45 hover:bg-white/35 dark:hover:bg-black/75 hover:scale-105 rounded-full text-white border border-white/40 dark:border-border/30 opacity-0 group-hover:opacity-100 transition-all z-20 focus:outline-none backdrop-blur-sm"
        aria-label="Anime sebelumnya"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 dark:bg-black/45 hover:bg-white/35 dark:hover:bg-black/75 hover:scale-105 rounded-full text-white border border-white/40 dark:border-border/30 opacity-0 group-hover:opacity-100 transition-all z-20 focus:outline-none backdrop-blur-sm"
        aria-label="Anime berikutnya"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 right-4 sm:right-8 z-20 flex gap-1.5 sm:gap-2">
        {animes.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveIndex(index);
              startTimer();
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === activeIndex 
                ? 'bg-primary w-6 shadow-glow' 
                : 'bg-black/25 dark:bg-white/40 hover:bg-black/45 dark:hover:bg-white/70'
            }`}
            aria-label={`Pindah ke slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroBanner;
