import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Compass, Sliders, X, Loader2, Search,
  Sparkles, Filter, RotateCcw
} from 'lucide-react';
import { GENRES } from '../constants/mockData';
import { AnimeCard } from '../components/cards/AnimeCard';
import { SkeletonGrid } from '../components/cards/SkeletonCard';
import { 
  fetchAnimeList, 
  fetchAnimeByGenre, 
  fetchAnimeGenres 
} from '../lib/animeApi';
import type { ApiAnime } from '../types';

type FilterType = 'semua' | 'anime' | 'donghua' | 'film';
type FilterStatus = 'semua' | 'ongoing' | 'completed' | 'upcoming';
type FilterSort = 'latest' | 'rating' | 'popular';

const PAGE_SIZE = 30;

interface BrowseResult {
  isAnime: boolean;
  [key: string]: any;
}

export const BrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('semua');
  const [filterGenre, setFilterGenre] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua');
  const [filterSort, setFilterSort] = useState<FilterSort>('latest');
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [results, setResults] = useState<BrowseResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);

  // Infinite scroll refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  // Sync from URL params
  useEffect(() => {
    const type = searchParams.get('type') as FilterType;
    const genre = searchParams.get('genre');
    const status = searchParams.get('status') as FilterStatus;
    const sort = searchParams.get('sort') as FilterSort;

    setFilterType(['anime', 'donghua', 'film'].includes(type) ? type : 'semua');
    setFilterGenre(genre || 'Semua');
    setFilterStatus(status || 'semua');
    setFilterSort(sort || 'latest');
    setPage(1);
    setResults([]);
    setHasMore(true);
  }, [searchParams]);

  // Load genres
  useEffect(() => {
    fetchAnimeGenres()
      .then(res => setGenres(res.data?.genres || []))
      .catch(() => setGenres(GENRES.filter(g => g !== 'Semua')));
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let animeItems: ApiAnime[] = [];
      let total = 0;

      // Determine content type for server-side filtering
      let contentType: string | undefined = undefined;
      if (filterType === 'anime') contentType = 'ANIME';
      if (filterType === 'donghua') contentType = 'DONGHUA';
      if (filterType === 'film') contentType = 'FILM';
      const typeParam = contentType;

      // Determine status for server-side filtering
      let statusParam: string | undefined = undefined;
      if (filterStatus === 'ongoing') statusParam = 'ONGOING';
      if (filterStatus === 'completed') statusParam = 'COMPLETED';
      if (filterStatus === 'upcoming') statusParam = 'UPCOMING';

      // Determine sort parameters
      let sortBy = 'id';
      let order = 'desc';
      if (filterSort === 'rating') { sortBy = 'rating_anime'; }
      if (filterSort === 'popular') { sortBy = 'view_anime'; }

      if (filterGenre !== 'Semua') {
        // Genre endpoint — supports type, status, sortBy, order
        const res = await fetchAnimeByGenre(filterGenre, {
          page: pageNum,
          limit: PAGE_SIZE,
          type: typeParam,
          contentType,
          status: statusParam,
          sortBy,
          order,
        });
        animeItems = res.items || [];
        total = res.total || animeItems.length;
      } else {
        // Main list endpoint — all filters sent server-side
        const res = await fetchAnimeList({
          page: pageNum,
          limit: PAGE_SIZE,
          type: typeParam,
          contentType,
          status: statusParam,
          sortBy,
          order,
        });
        animeItems = res.data || [];
        total = res.meta?.total || animeItems.length;
      }

      const formatted: BrowseResult[] = animeItems.map(a => ({ ...a, isAnime: true }));

      if (isLoadMore) {
        setResults(prev => [...prev, ...formatted]);
      } else {
        setResults(formatted);
      }
      setTotalResults(total);
      setHasMore(formatted.length >= PAGE_SIZE && formatted.length > 0);
    } catch (err) {
      console.error('Browse fetch error:', err);
      if (!isLoadMore) setResults([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [filterType, filterGenre, filterStatus, filterSort]);

  // Initial load and filter changes — always fetch page 1 on filter change
  useEffect(() => {
    setPage(1);
    setResults([]);
    setHasMore(true);
    fetchData(1, false);
  }, [filterType, filterGenre, filterStatus, filterSort]);

  // Load more on page change
  useEffect(() => {
    if (page > 1) {
      fetchData(page, true);
    }
  }, [page]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '400px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // URL update helpers
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'semua' || value === 'Semua' || (key === 'sort' && value === 'latest')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  const isFilterActive = filterGenre !== 'Semua';

  const genreList = genres.length > 0 ? genres : GENRES.filter(g => g !== 'Semua');

  // Content header title
  const getContentTitle = () => {
    if (filterGenre !== 'Semua') return filterGenre;
    return 'Semua Konten';
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface border border-border/30">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                  <Compass className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-heading text-text-primary tracking-tight">
                    Jelajahi
                  </h1>
                  <p className="text-xs sm:text-sm text-muted font-medium mt-0.5">
                    Temukan anime favoritmu
                  </p>
                </div>
              </div>
            </div>
            
            {/* Search shortcut */}
            <button 
              onClick={() => navigate('/search')}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-bg-base/60 border border-border/40 rounded-xl text-xs text-muted hover:text-text-primary hover:border-primary/30 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Cari anime...</span>
              <kbd className="ml-2 px-1.5 py-0.5 bg-bg-elevated border border-border/50 rounded text-[10px] font-mono">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Genre Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showFilters 
                ? 'bg-primary text-black' 
                : 'bg-bg-surface border border-border/40 text-text-secondary hover:border-primary/30'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showFilters ? 'Tutup' : 'Genre'}</span>
          </button>

          {filterGenre !== 'Semua' && (
            <button
              onClick={() => updateParam('genre', 'Semua')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary hover:text-primary-light transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Genre Panel */}
        {showFilters && (
          <div className="bg-bg-surface/80 backdrop-blur-sm border border-border/30 rounded-2xl p-5 sm:p-6 animate-scale-up space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Genre
              </h4>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-pink">
                <button
                  onClick={() => updateParam('genre', 'Semua')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    filterGenre === 'Semua'
                      ? 'bg-primary text-black'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border/30 hover:border-primary/30'
                  }`}
                >
                  Semua
                </button>
                {genreList.map(g => (
                  <button
                    key={g}
                    onClick={() => updateParam('genre', g)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      filterGenre === g
                        ? 'bg-primary text-black'
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border/30 hover:border-primary/30'
                  }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Genre Tag */}
        {filterGenre !== 'Semua' && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Filter:</span>
            <FilterTag label={`Genre: ${filterGenre}`} onRemove={() => updateParam('genre', 'Semua')} />
          </div>
        )}
      </div>

      {/* Content Section Header */}
      <div className="flex items-end justify-between border-b border-border/20 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-text-primary flex items-center gap-2">
            {getContentTitle()}
          </h2>
          <p className="text-xs text-muted mt-1">
            {isLoading ? 'Memuat konten...' : `${totalResults} judul ditemukan`}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
          <SkeletonGrid count={PAGE_SIZE} />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
          {results.map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 15, 150)}ms` }}
            >
              {item.isAnime ? (
                <AnimeCard apiAnime={item as any} />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border border-dashed border-border/40 rounded-2xl bg-bg-surface/20">
          <Filter className="w-12 h-12 text-muted/30 mx-auto mb-4" />
          <p className="text-sm text-muted font-medium mb-2">Tidak ada konten yang ditemukan</p>
          <p className="text-xs text-muted/70 mb-4">Coba ubah filter atau kata kunci pencarian</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
          >
            Reset semua filter
          </button>
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-muted font-medium">Memuat lebih banyak...</span>
        </div>
      )}

      {/* End of List */}
      {!hasMore && results.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted">
          <div className="h-px w-12 bg-border/30" />
          <span className="text-xs font-medium">Semua konten telah dimuat</span>
          <div className="h-px w-12 bg-border/30" />
        </div>
      )}

    </div>
  );
};

// Filter Tag component
const FilterTag: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg border border-primary/20">
    <span>{label}</span>
    <button onClick={onRemove} className="hover:text-white transition-colors p-0.5">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default BrowsePage;
