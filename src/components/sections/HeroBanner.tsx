import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Badge } from '../ui/Badge';
import { fetchAnimeRecommendations, fetchAnimeByView } from '../../lib/animeApi';
import type { ApiAnime, Anime } from '../../types';

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
    return (
      <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] bg-[#050505] rounded-2xl overflow-hidden border border-border/40 animate-pulse flex flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12">
        <div className="space-y-4 max-w-2xl text-left z-10">
          <div className="flex gap-2">
            <div className="h-5 bg-bg-elevated rounded w-16 animate-pulse" />
            <div className="h-5 bg-bg-elevated rounded w-16 animate-pulse" />
          </div>
          <div className="h-8 bg-bg-elevated rounded w-3/4 sm:w-2/3 animate-pulse" />
          <div className="h-4 bg-bg-elevated rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-bg-elevated rounded w-full animate-pulse" />
          <div className="h-4 bg-bg-elevated rounded w-5/6 animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 bg-bg-elevated rounded-lg w-32 animate-pulse" />
            <div className="h-10 bg-bg-elevated rounded-lg w-24 animate-pulse" />
          </div>
        </div>
      </div>
    );
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
    <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] bg-[#050505] rounded-2xl overflow-hidden group border border-border/40">
      
      {/* Background Poster (Blurred & Scaled) */}
      <div className="absolute inset-0 z-0 overflow-hidden transition-all duration-700 ease-out">
        <img
          src={currentAnime.gambar_anime}
          alt={currentAnime.nama_anime}
          className="w-full h-full object-cover scale-[1.05] filter blur-[2px] brightness-[0.7]"
        />
        {/* Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-base/80 via-transparent to-transparent hidden md:block" />
      </div>

      {/* Hero Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 lg:p-12 z-10 text-left flex flex-col items-start max-w-2xl">
        {/* Genre Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(currentAnime.genre_anime ?? []).map((g) => (
            <Badge key={g} variant="genre" className="bg-primary/20 text-primary-light font-semibold uppercase tracking-wider text-[10px]">
              {g}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold font-heading text-text-primary leading-tight tracking-tight drop-shadow-md mb-2">
          {currentAnime.nama_anime}
        </h1>

        {/* Rating and Info */}
        <div className="flex items-center gap-3 text-xs sm:text-sm text-text-secondary font-sans mb-3 font-medium">
          <span className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <strong className="text-text-primary font-mono">{(currentAnime.rating_anime ?? 0).toFixed(1)}</strong>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>{(currentAnime.studio_anime ?? []).join(', ') || '-'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>{currentAnime.episodes_count ?? 0} Episode</span>
        </div>

        {/* Short Synopsis */}
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed drop-shadow-sm line-clamp-2 mb-6 max-w-lg">
          {currentAnime.sinopsis_anime ?? 'Belum ada sinopsis.'}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(`/watch/${currentAnime.id}/ep/1`)}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg bg-gradient-to-r from-primary to-primary-light text-black font-bold text-xs sm:text-sm whitespace-nowrap hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all shadow-glow hover:shadow-primary/30"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black" />
            <span>Tonton Sekarang</span>
          </button>
          
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg border text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              bookmarked 
                ? 'bg-primary/10 border-primary text-primary-light' 
                : 'bg-black/35 border-border hover:border-primary text-text-primary'
            }`}
          >
            {bookmarked ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-light" />
                <span>Tersimpan</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/75 hover:scale-105 rounded-full text-white border border-border/30 opacity-0 group-hover:opacity-100 transition-all z-20 focus:outline-none"
        aria-label="Anime sebelumnya"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/75 hover:scale-105 rounded-full text-white border border-border/30 opacity-0 group-hover:opacity-100 transition-all z-20 focus:outline-none"
        aria-label="Anime berikutnya"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 right-6 sm:right-8 z-20 flex gap-2">
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
                : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Pindah ke slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroBanner;
