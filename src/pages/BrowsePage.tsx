import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  RotateCcw, X, Flame, Clock, Tv, Trophy, BookOpen, Sliders, 
  Filter, Star, Play, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Zap
} from 'lucide-react';
import { MOCK_ANIMES, MOCK_MANGAS, GENRES } from '../constants/mockData';
import { AnimeCard } from '../components/cards/AnimeCard';
import { MangaCard } from '../components/cards/MangaCard';
import { Badge } from '../components/ui/Badge';

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const topRatedScrollRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [filterType, setFilterType] = useState<'semua' | 'anime' | 'manga' | 'manhwa' | 'manhua'>('semua');
  const [filterGenre, setFilterGenre] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'ongoing' | 'completed' | 'upcoming'>('semua');
  const [filterSort, setFilterSort] = useState<'latest' | 'rating' | 'popular'>('latest');

  // Collapsible Filters Drawer
  const [showFilters, setShowFilters] = useState(false);

  // Sync state from query parameters on mount or change
  useEffect(() => {
    const type = searchParams.get('type') as any;
    const genre = searchParams.get('genre');
    const status = searchParams.get('status') as any;
    const sort = searchParams.get('sort') as any;

    if (type && ['anime', 'manga', 'manhwa', 'manhua'].includes(type)) {
      setFilterType(type);
    } else {
      setFilterType('semua');
    }
    if (genre) setFilterGenre(genre);
    else setFilterGenre('Semua');
    
    if (status) setFilterStatus(status);
    else setFilterStatus('semua');
    
    if (sort) setFilterSort(sort);
    else setFilterSort('latest');
  }, [searchParams]);

  // Set URL search params when state changes
  const updateParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'semua' || value === 'Semua' || (key === 'sort' && value === 'latest')) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setFilterType('semua');
    setFilterGenre('Semua');
    setFilterStatus('semua');
    setFilterSort('latest');
    setSearchParams({});
  };

  const isFilterActive = 
    filterType !== 'semua' || 
    filterGenre !== 'Semua' || 
    filterStatus !== 'semua' || 
    filterSort !== 'latest';

  // Perform Filtering
  const getFilteredResults = () => {
    let results: Array<{ id: string; title: string; rating: number; type: string; status: string; genres: string[]; releaseDate: string; isAnime: boolean; item: any }> = [];

    // Add Anime
    if (filterType === 'semua' || filterType === 'anime') {
      MOCK_ANIMES.forEach(anime => {
        results.push({
          id: anime.id,
          title: anime.title,
          rating: anime.rating,
          type: anime.type,
          status: anime.status,
          genres: anime.genres,
          releaseDate: anime.releaseDate,
          isAnime: true,
          item: anime
        });
      });
    }

    // Add Manga / Manhwa / Manhua
    if (filterType === 'semua' || ['manga', 'manhwa', 'manhua'].includes(filterType)) {
      MOCK_MANGAS.forEach(manga => {
        // Apply type constraints
        if (filterType === 'manhwa' && manga.type !== 'manhwa') return;
        if (filterType === 'manhua' && manga.type !== 'manhua') return;
        if (filterType === 'manga' && manga.type !== 'manga') return;

        results.push({
          id: manga.id,
          title: manga.title,
          rating: manga.rating,
          type: manga.type,
          status: manga.status,
          genres: manga.genres,
          releaseDate: manga.releaseDate,
          isAnime: false,
          item: manga
        });
      });
    }

    // Filter by Genre
    if (filterGenre !== 'Semua') {
      results = results.filter(r => r.genres.includes(filterGenre));
    }

    // Filter by Status
    if (filterStatus !== 'semua') {
      results = results.filter(r => r.status === filterStatus);
    }

    // Sort Results
    if (filterSort === 'latest') {
      results.sort((a, b) => b.id.localeCompare(a.id));
    } else if (filterSort === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (filterSort === 'popular') {
      results.sort((a, b) => (b.isAnime ? 1 : 0) - (a.isAnime ? 1 : 0));
    }

    return results;
  };

  const filteredResults = getFilteredResults();
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [filterType, filterGenre, filterStatus, filterSort]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  // Data for sections
  const topRated = [...MOCK_ANIMES].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const spotlightAnime = MOCK_ANIMES.find(a => a.isFeatured) || MOCK_ANIMES[0];
  const ongoingAnimes = MOCK_ANIMES.filter(a => a.status === 'ongoing');

  // Quick filter chips (YouTube-style)
  const quickChips = [
    { lbl: 'Semua', active: !isFilterActive, onClick: handleResetFilters },
    { lbl: 'Anime', active: filterType === 'anime', onClick: () => updateParams('type', filterType === 'anime' ? 'semua' : 'anime') },
    { lbl: 'Manga', active: filterType === 'manga', onClick: () => updateParams('type', filterType === 'manga' ? 'semua' : 'manga') },
    { lbl: 'Manhwa', active: filterType === 'manhwa', onClick: () => updateParams('type', filterType === 'manhwa' ? 'semua' : 'manhwa') },
    { lbl: 'Ongoing', active: filterStatus === 'ongoing', onClick: () => updateParams('status', filterStatus === 'ongoing' ? 'semua' : 'ongoing') },
    { lbl: 'Tamat', active: filterStatus === 'completed', onClick: () => updateParams('status', filterStatus === 'completed' ? 'semua' : 'completed') },
    { lbl: 'Rating Tertinggi', active: filterSort === 'rating', onClick: () => updateParams('sort', filterSort === 'rating' ? 'latest' : 'rating') },
  ];

  const scrollTopRated = (dir: 'left' | 'right') => {
    if (!topRatedScrollRef.current) return;
    const amount = 320;
    topRatedScrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. SPOTLIGHT FEATURED BANNER — Big visual hero for Jelajahi */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[260px] xs:h-[300px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden group cursor-pointer border border-border/30">
        {/* BG Image */}
        <img 
          src={spotlightAnime.coverUrl} 
          alt={spotlightAnime.title}
          className="absolute inset-0 w-full h-full object-cover brightness-[0.55] group-hover:scale-[1.03] transition-transform duration-700"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-base/70 via-transparent to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8 z-10 text-left max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Sorotan Jelajahi</span>
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold font-heading text-text-primary leading-tight tracking-tight mb-2">
            {spotlightAnime.title}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-yellow-400" />
              <strong className="font-mono text-text-primary">{spotlightAnime.rating.toFixed(1)}</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{spotlightAnime.studio}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{spotlightAnime.genres.slice(0, 2).join(', ')}</span>
          </div>
          <p className="hidden xs:block text-xs sm:text-sm text-text-secondary/80 line-clamp-2 mb-4 max-w-md leading-relaxed">
            {spotlightAnime.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to={`/anime/${spotlightAnime.slug}`}
              className="flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-light text-black font-bold text-xs sm:text-sm hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Lihat Detail</span>
            </Link>
          </div>
        </div>

        {/* Floating genre tags (top-right, hidden on mobile to avoid layout overlap) */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex gap-2">
          {spotlightAnime.genres.slice(0, 3).map(g => (
            <Badge key={g} variant="genre" className="bg-black/50 backdrop-blur-md text-white/90 border border-white/10 text-[10px] font-semibold px-2.5 py-0.5">
              {g}
            </Badge>
          ))}
        </div>
      </div>



      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. TOP RATED SHELF — Horizontal scroll with rank badges       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2.5 items-center text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                Rating Tertinggi
              </h2>
              <span className="text-[11px] text-muted font-medium">Konten dengan penilaian terbaik komunitas</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => scrollTopRated('left')} className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTopRated('right')} className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll */}
        <div 
          ref={topRatedScrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
        >
          {topRated.map((anime, index) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.slug}`}
              className="relative shrink-0 w-[260px] sm:w-[300px] snap-start group"
            >
              {/* Horizontal card with rank */}
              <div className="relative h-[140px] sm:h-[160px] rounded-2xl overflow-hidden border border-border/30 group-hover:border-primary/30 transition-all group-hover:shadow-glow">
                <img 
                  src={anime.coverUrl} 
                  alt={anime.title}
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.5] group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Rank number watermark */}
                <div className="absolute -left-2 -bottom-4 z-10">
                  <span className={`text-[72px] font-black font-heading leading-none tracking-tighter ${
                    index === 0 ? 'text-yellow-400/40' : index === 1 ? 'text-gray-300/30' : index === 2 ? 'text-orange-400/30' : 'text-white/15'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pl-12 z-10">
                  <h3 className="text-sm font-bold text-text-primary line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {anime.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-0.5 text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      {anime.rating.toFixed(1)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span>{anime.genres[0]}</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span>{anime.episodeCount} Ep</span>
                  </div>
                </div>

                {/* Play button on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-all">
                    <Play className="w-4 h-4 fill-black text-black translate-x-[0.5px]" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. ONGOING NOW — Small horizontal shelf with status indicator */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {ongoingAnimes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2.5 items-center text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Tv className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                  Sedang Tayang
                </h2>
                <span className="text-[11px] text-muted font-medium">Episode baru setiap minggu</span>
              </div>
            </div>
            <Link to="/browse?status=ongoing" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors shrink-0">
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2">
            {ongoingAnimes.map((anime) => (
              <div key={anime.id} className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0 snap-start">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 5. EXPLORE SHORTCUT CARDS — Visual category hubs              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
              Pintasan Jelajah
            </h2>
            <span className="text-[11px] text-muted font-medium">Akses cepat ke kategori favorit</span>
          </div>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { lbl: 'Trending', icon: <Flame className="w-5 h-5" />, onClick: () => updateParams('sort', 'rating'), gradient: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
            { lbl: 'Rilis Terbaru', icon: <Clock className="w-5 h-5" />, onClick: () => updateParams('sort', 'latest'), gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
            { lbl: 'Ongoing', icon: <Tv className="w-5 h-5" />, onClick: () => updateParams('status', 'ongoing'), gradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
            { lbl: 'Tamat', icon: <Trophy className="w-5 h-5" />, onClick: () => updateParams('status', 'completed'), gradient: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-400' },
            { lbl: 'Manga Only', icon: <BookOpen className="w-5 h-5" />, onClick: () => updateParams('type', 'manga'), gradient: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-400' },
          ].map((sc) => (
            <button
              key={sc.lbl}
              onClick={sc.onClick}
              className="flex flex-col items-center justify-center p-4 bg-bg-surface hover:bg-bg-elevated border border-border/40 hover:border-white/10 rounded-2xl transition-all duration-200 group text-center focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sc.gradient} ${sc.iconColor} flex items-center justify-center mb-2.5 transition-all group-hover:shadow-lg group-hover:scale-110 shrink-0`}>
                {sc.icon}
              </div>
              <span className="text-xs font-bold text-text-primary group-hover:text-white transition-colors leading-none">
                {sc.lbl}
              </span>
            </button>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6. MAIN RESULTS — Filter bar + varied grid                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        {/* Section Header + Filter Toggle */}
        <div className="flex items-center justify-between border-t border-border/20 pt-6">
          <div className="flex gap-2.5 items-center text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary-deep/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                Semua Konten
              </h2>
              <span className="text-[11px] text-muted font-medium">{filteredResults.length} judul ditemukan</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-light font-bold focus:outline-none transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all focus:outline-none ${
                showFilters ? 'bg-primary text-black border-primary' : 'bg-bg-surface border-border/60 hover:border-primary/40 text-text-primary'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">{showFilters ? 'Sembunyikan' : 'Filter'}</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips — YouTube-style inline */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickChips.map((chip) => (
            <button
              key={chip.lbl}
              onClick={chip.onClick}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 ${
                chip.active
                  ? 'bg-text-primary text-bg-base'
                  : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface hover:text-text-primary border border-border/50'
              }`}
            >
              {chip.lbl}
            </button>
          ))}
        </div>

        {/* Expandable Filters Grid */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-bg-sidebar/60 backdrop-blur-sm p-6 border border-border/30 rounded-2xl relative animate-scale-up text-left">
            {/* Column 1: TIPE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" />
                Tipe
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'semua', lbl: 'Semua Konten' },
                  { val: 'anime', lbl: 'Anime' },
                  { val: 'manga', lbl: 'Manga' },
                  { val: 'manhwa', lbl: 'Manhwa' },
                  { val: 'manhua', lbl: 'Manhua' }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => updateParams('type', item.val)}
                    className={`text-xs text-left font-medium px-2.5 py-1.5 rounded-lg transition-all focus:outline-none ${
                      filterType === item.val 
                        ? 'text-primary bg-primary/10 font-bold' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: GENRE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Genre
              </h4>
              <div className="grid grid-cols-2 gap-x-1 gap-y-1 max-h-48 overflow-y-auto scrollbar-pink pr-1">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => updateParams('genre', g)}
                    className={`text-xs text-left font-medium px-2.5 py-1.5 rounded-lg transition-all focus:outline-none truncate ${
                      filterGenre === g 
                        ? 'text-primary bg-primary/10 font-bold' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: STATUS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-primary" />
                Status
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'semua', lbl: 'Semua Status' },
                  { val: 'ongoing', lbl: 'Sedang Tayang' },
                  { val: 'completed', lbl: 'Selesai' },
                  { val: 'upcoming', lbl: 'Mendatang' }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => updateParams('status', item.val)}
                    className={`text-xs text-left font-medium px-2.5 py-1.5 rounded-lg transition-all focus:outline-none ${
                      filterStatus === item.val 
                        ? 'text-primary bg-primary/10 font-bold' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 4: URUTKAN */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Urutkan
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'latest', lbl: 'Rilis Terbaru' },
                  { val: 'rating', lbl: 'Rating Tertinggi' },
                  { val: 'popular', lbl: 'Terpopuler' }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => updateParams('sort', item.val)}
                    className={`text-xs text-left font-medium px-2.5 py-1.5 rounded-lg transition-all focus:outline-none ${
                      filterSort === item.val 
                        ? 'text-primary bg-primary/10 font-bold' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Tag Pills */}
        {isFilterActive && (
          <div className="flex flex-wrap gap-2 items-center text-left">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider mr-1">Aktif:</span>
            {filterType !== 'semua' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary-light text-xs font-semibold rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>Tipe: {filterType}</span>
                <button onClick={() => updateParams('type', 'semua')} className="hover:text-white transition-colors" aria-label="Clear tipe filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterGenre !== 'Semua' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary-light text-xs font-semibold rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>Genre: {filterGenre}</span>
                <button onClick={() => updateParams('genre', 'Semua')} className="hover:text-white transition-colors" aria-label="Clear genre filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterStatus !== 'semua' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary-light text-xs font-semibold rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>Status: {filterStatus}</span>
                <button onClick={() => updateParams('status', 'semua')} className="hover:text-white transition-colors" aria-label="Clear status filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterSort !== 'latest' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary-light text-xs font-semibold rounded-full border border-primary/20 hover:bg-primary/20 transition-colors">
                <span>Urutan: {filterSort === 'rating' ? 'Rating' : 'Populer'}</span>
                <button onClick={() => updateParams('sort', 'latest')} className="hover:text-white transition-colors" aria-label="Clear sort filter"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results Grid */}
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {filteredResults.slice(0, visibleCount).map((item, index) => (
              <div 
                key={item.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                {item.isAnime ? (
                  <AnimeCard anime={item.item} />
                ) : (
                  <MangaCard manga={item.item} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border/60 rounded-2xl bg-bg-surface/20">
            <Filter className="w-10 h-10 text-muted/40 mx-auto mb-4" />
            <p className="text-sm text-muted font-medium">Tidak ada konten yang cocok dengan filter yang dipilih.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs text-primary hover:text-primary-light font-semibold transition-colors"
            >
              Reset semua filter
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredResults.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-bg-surface border border-border/60 hover:border-primary/40 text-text-primary hover:text-primary font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 hover:shadow-glow/20"
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default BrowsePage;
