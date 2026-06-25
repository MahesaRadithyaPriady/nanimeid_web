import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookA, Search, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { fetchAnimeCatalog } from '../lib/animeApi';
import { AnimeCard } from '../components/cards/AnimeCard';
import type { ApiAnime } from '../types';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLetter = searchParams.get('letter') || 'A';

  const [mode, setMode] = useState<'all' | 'single'>('all');
  const [items, setItems] = useState<ApiAnime[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ref, inView } = useInView({ threshold: 0.1 });
  const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Initial load when letter changes
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const opts = { letter: activeLetter, page: 1, limit_per_group: 24 };
        const res = await fetchAnimeCatalog(opts);
        if (active && res.data) {
          setMode(res.data.mode);
          setItems(res.data.catalog?.[activeLetter] || []);
          if (res.data.available_letters) setAvailableLetters(res.data.available_letters);
          if (res.data.pagination) setPagination(res.data.pagination);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat katalog');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [activeLetter]);

  // Load more when scrolled to bottom
  useEffect(() => {
    let active = true;
    if (inView && pagination?.hasNext && !isLoading && !isLoadingMore) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        try {
          const nextPage = pagination.currentPage + 1;
          const opts = { letter: activeLetter, page: nextPage, limit_per_group: 24 };
          const res = await fetchAnimeCatalog(opts);
          if (active && res.data) {
            setItems(prev => [...prev, ...(res.data.catalog?.[activeLetter] || [])]);
            if (res.data.pagination) setPagination(res.data.pagination);
          }
        } catch (err) {
          console.error('Failed to load more items', err);
        } finally {
          if (active) setIsLoadingMore(false);
        }
      };
      loadMore();
    }
    return () => { active = false; };
  }, [inView, pagination, isLoading, isLoadingMore, activeLetter]);

  const handleLetterClick = (l: string) => {
    if (l === activeLetter) return;
    searchParams.set('letter', l);
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto mt-6 px-4 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-bg-surface border border-border/40 p-6 md:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
           <div className="w-16 h-16 rounded-2xl bg-primary/ border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
             <BookA className="w-8 h-8 text-primary drop-shadow-md" />
           </div>
           <div>
             <h1 className="text-3xl md:text-4xl font-black font-heading text-text-primary tracking-tight">
               Katalog <span className="text-primary">A-Z</span>
             </h1>
             <p className="text-sm text-text-secondary font-medium mt-2">
               Jelajahi seluruh koleksi anime berdasarkan urutan abjad.
             </p>
           </div>
        </div>
      </div>

      {/* Letter Navigation */}
      <div className="sticky top-16 z-20 bg-bg-base/90 backdrop-blur-md py-4 border-b border-border/50">
        <div className="flex flex-wrap gap-2 justify-center">
          {LETTERS.map(l => {
            const isActive = activeLetter === l;
            const hasData = mode === 'all' ? availableLetters.includes(l) : true;
            return (
              <button
                key={l}
                onClick={() => handleLetterClick(l)}
                disabled={!hasData && mode === 'all'}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-primary text-black shadow-glow scale-110'
                    : hasData || mode === 'single'
                      ? 'bg-bg-surface text-text-secondary border border-border/50 hover:border-primary/50 hover:text-primary'
                      : 'bg-bg-surface/50 text-text-secondary/30 border border-border/20 cursor-not-allowed'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted text-sm font-medium animate-pulse">Menyusun katalog...</p>
        </div>
      ) : error ? (
        <div className="py-24 text-center border border-dashed border-red-500/30 rounded-2xl bg-red-500/5">
          <p className="text-sm text-red-400 font-medium mb-2">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-primary">{activeLetter}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Anime berawalan "{activeLetter}"</h2>
              {pagination && (
                <p className="text-sm text-text-secondary">Menampilkan {pagination.total} judul</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((anime, index) => (
              <AnimeCard key={`${anime.id}-${index}`} apiAnime={anime} />
            ))}
          </div>

          {items.length === 0 && (
            <div className="py-20 text-center text-muted">Tidak ada anime yang ditemukan untuk huruf ini.</div>
          )}

          {/* Infinite Scroll Sentinel */}
          {pagination?.hasNext && (
            <div ref={ref} className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
