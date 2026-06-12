import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
import { AnimeCard } from '../components/cards/AnimeCard';
import type { ApiAnimeLatest } from '../types';
import { fetchAnimeLatest } from '../lib/animeApi';

export const AnimePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('anime-view-mode') as 'grid' | 'list') || 'grid';
  });

  const [animeResults, setAnimeResults] = useState<ApiAnimeLatest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 24;

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('anime-view-mode', mode);
  };

  // Fetch initial page
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchAnimeLatest({ page: 1, limit });
        if (!cancelled) {
          setAnimeResults(res.items ?? []);
          setTotalPages(res.totalPages ?? 1);
          setPage(1);
        }
      } catch (err) {
        console.error('AnimePage fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchAnimeLatest({ page: nextPage, limit });
      setAnimeResults(prev => [...prev, ...(res.items ?? [])]);
      setPage(nextPage);
      setTotalPages(res.totalPages ?? totalPages);
    } catch (err) {
      console.error('AnimePage loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. Page Header Block */}
      <div className="flex items-start justify-between border-b border-border/20 pb-4">
        <div className="flex gap-3 items-start text-left">
          <span className="mt-1.5 shrink-0">
            <Tv className="w-5.5 h-5.5 text-primary" />
          </span>
          <div className="flex flex-col justify-start">
            <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary tracking-tight leading-tight">
              Rilis Anime Terbaru
            </h1>
            <span className="text-xs text-muted font-medium mt-1">Tayangan episode anime terbaru rilis minggu ini</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="text-left">
          <h2 className="text-sm font-bold text-text-primary font-heading">Terbaru</h2>
          <p className="text-xs text-muted mt-0.5">
            {loading ? 'Memuat...' : `Menampilkan ${animeResults.length} konten rilis terbaru`}
          </p>
        </div>

        {/* Grid/List Toggle */}
        <div className="flex items-center gap-1 bg-bg-surface border border-border/60 p-1 rounded-xl">
          <button
            onClick={() => handleToggleViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
              viewMode === 'grid' ? 'bg-primary text-black' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Tampilan Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
              viewMode === 'list' ? 'bg-primary text-black' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Tampilan List"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Feed Viewport */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : animeResults.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {animeResults.map((anime) => (
              <div key={anime.id} className="animate-fade-in">
                <AnimeCard apiAnime={anime} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {animeResults.map((anime) => (
              <Link 
                key={anime.id}
                to={`/anime/${anime.id}`}
                className="group flex flex-col sm:flex-row gap-4 p-3 bg-bg-surface/30 hover:bg-bg-surface border border-border/40 hover:border-primary/20 rounded-2xl transition-all duration-200"
              >
                <div className="relative w-full sm:w-48 md:w-56 aspect-[16/9] bg-bg-base rounded-xl overflow-hidden shrink-0 shadow-sm border border-border/20">
                  <img src={anime.gambar_anime} alt={anime.nama_anime} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white uppercase">
                    {anime.last_episode ? `Ep ${anime.last_episode.nomor_episode}` : `${anime.episodes_count ?? 0} Ep`}
                  </span>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-yellow-400 flex items-center gap-0.5">
                    ★ {(anime.rating_anime ?? 0).toFixed(1)}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-start text-left space-y-2 py-1">
                  <h3 className="text-base md:text-lg font-bold text-text-primary group-hover:text-primary transition-colors duration-150 line-clamp-1 leading-snug">
                    {anime.nama_anime}
                  </h3>
                  
                  <p className="text-xs md:text-sm text-text-secondary line-clamp-2 leading-relaxed">
                    {anime.sinopsis_anime}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-medium pt-1">
                    <span className="font-mono text-[10px] uppercase text-primary-light">{(anime.genre_anime ?? [])[0]}</span>
                    <span className="text-border/60">&bull;</span>
                    <span>Studio: {(anime.studio_anime ?? []).join(', ')}</span>
                    <span className="text-border/60">&bull;</span>
                    <span>{anime.status_anime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20">
          <p className="text-sm text-muted">Tidak ada rilis anime terbaru.</p>
        </div>
      )}

      {/* 4. Load More */}
      {page < totalPages && !loading && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-bg-surface border border-border hover:border-primary text-text-primary hover:text-primary font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
          </button>
        </div>
      )}

    </div>
  );
};

export default AnimePage;
