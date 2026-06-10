import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Flame, Sparkles, BookOpen, 
  Play, Star, Tv, Clock, TrendingUp, ArrowRight
} from 'lucide-react';
import { HeroBanner } from '../components/sections/HeroBanner';
import { AnimeCard } from '../components/cards/AnimeCard';
import { MangaCard } from '../components/cards/MangaCard';
import { MOCK_ANIMES, MOCK_MANGAS } from '../constants/mockData';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/useAppStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { watchHistory } = useAppStore();
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  // Data
  const trendingAnimes = [...MOCK_ANIMES].sort((a, b) => b.rating - a.rating);
  const popularMangas = MOCK_MANGAS.slice(0, 6);
  const newReleases = [...MOCK_ANIMES].filter(a => a.status !== 'upcoming').slice(0, 4);
  const upcomingAnimes = MOCK_ANIMES.filter(a => a.status === 'upcoming');
  const completedAnimes = MOCK_ANIMES.filter(a => a.status === 'completed').slice(0, 6);

  // Continue watching from history
  const recentHistory = watchHistory.slice(0, 4);
  const continueAnimes = recentHistory
    .map(h => MOCK_ANIMES.find(a => a.id === h.animeId))
    .filter(Boolean) as typeof MOCK_ANIMES;

  // Featured pick (second highest rated for variety from hero)
  const editorPick = trendingAnimes[1] || trendingAnimes[0];

  const scrollTrending = (dir: 'left' | 'right') => {
    if (!trendingScrollRef.current) return;
    trendingScrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  // Section header component
  const SectionHeader = ({ title, subtitle, icon, linkPath, iconBg }: { 
    title: string; subtitle: string; icon: React.ReactNode; linkPath: string; iconBg: string 
  }) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex gap-3 items-center text-left">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
            {title}
          </h2>
          <span className="text-[11px] text-muted font-medium">{subtitle}</span>
        </div>
      </div>
      <Link 
        to={linkPath}
        className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors shrink-0"
      >
        <span>Lihat Semua</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-10 pb-16">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. HERO CAROUSEL BANNER                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <HeroBanner />


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. CONTINUE WATCHING — Personal shelf (if user has history)   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {continueAnimes.length > 0 && (
        <div>
          <SectionHeader
            title="Lanjut Menonton"
            subtitle="Lanjutkan dari terakhir kali kamu nonton"
            icon={<Play className="w-5 h-5 text-blue-400" />}
            iconBg="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
            linkPath="/history"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {continueAnimes.map((anime) => (
              <Link
                key={anime.id}
                to={`/anime/${anime.slug}`}
                className="group relative rounded-xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all"
              >
                <div className="relative aspect-video">
                  <img src={anime.coverUrl} alt={anime.title} className="w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.5] group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-all">
                      <Play className="w-5 h-5 fill-black text-black translate-x-[1px]" />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className="h-full bg-primary" style={{ width: `${(recentHistory.find(h => h.animeId === anime.id)?.progress || 0) * 100}%` }} />
                  </div>
                </div>
                <div className="p-3 bg-bg-surface">
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{anime.title}</h4>
                  <span className="text-[10px] text-muted mt-0.5 block">
                    Episode {recentHistory.find(h => h.animeId === anime.id)?.episodeNumber || '?'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. TRENDING — Horizontal scroll shelf with nav arrows         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-3 items-center text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                Trending Sekarang
              </h2>
              <span className="text-[11px] text-muted font-medium">Paling banyak ditonton minggu ini</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scrollTrending('left')} className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTrending('right')} className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div 
          ref={trendingScrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
        >
          {trendingAnimes.map((anime) => (
            <div key={anime.id} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0 snap-start">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. EDITOR'S PICK — Big landscape feature card (visual break)  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border/30 group cursor-pointer"
        onClick={() => navigate(`/anime/${editorPick.slug}`)}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image side */}
          <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:min-h-[280px]">
            <img 
              src={editorPick.coverUrl} 
              alt={editorPick.title}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.7] group-hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-base/90 hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 to-transparent md:hidden" />
            {/* Rank label */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Pilihan Editor</span>
              </div>
            </div>
          </div>
          
          {/* Content side */}
          <div className="relative w-full md:w-1/2 bg-bg-surface/80 p-6 sm:p-8 flex flex-col justify-center text-left">
            <div className="flex flex-wrap gap-2 mb-3">
              {editorPick.genres.map(g => (
                <Badge key={g} variant="genre" className="text-[10px]">{g}</Badge>
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-text-primary leading-tight tracking-tight mb-2 group-hover:text-primary transition-colors">
              {editorPick.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <strong className="font-mono text-text-primary">{editorPick.rating.toFixed(1)}</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{editorPick.studio}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{editorPick.episodeCount} Episode</span>
            </div>
            <p className="text-sm text-text-secondary/80 line-clamp-3 mb-5 leading-relaxed">
              {editorPick.description}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/watch/${editorPick.slug}/ep/1`); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm hover:opacity-90 transition-all shadow-glow active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                Tonton
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/anime/${editorPick.slug}`); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 hover:border-primary/40 text-text-primary hover:text-primary text-sm font-semibold transition-all active:scale-95"
              >
                Detail
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 5. NEW RELEASES — 2x2 Landscape cards grid                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Baru Dirilis"
          subtitle="Episode dan chapter terbaru yang baru saja tayang"
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          iconBg="bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
          linkPath="/browse?sort=latest"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {newReleases.map((anime) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.slug}`}
              className="group flex gap-4 bg-bg-surface/60 hover:bg-bg-elevated border border-border/30 hover:border-primary/20 rounded-xl p-3 transition-all"
            >
              {/* Poster thumbnail */}
              <div className="relative w-[100px] sm:w-[120px] shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                <img src={anime.posterUrl} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-1.5 right-1.5">
                  <Badge variant="episode" className="bg-black/85 text-[9px] px-1.5 py-0.5">
                    {anime.status === 'ongoing' ? `Ep ${anime.episodeCount}` : 'Tamat'}
                  </Badge>
                </div>
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-center text-left py-1">
                <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
                  {anime.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    {anime.rating.toFixed(1)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{anime.studio}</span>
                </div>
                <p className="text-xs text-text-secondary/70 line-clamp-2 leading-relaxed mb-2.5">
                  {anime.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.slice(0, 2).map(g => (
                    <span key={g} className="text-[9px] font-semibold px-2 py-0.5 bg-white/[0.05] text-muted rounded-md border border-white/[0.06]">{g}</span>
                  ))}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    anime.status === 'ongoing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-muted/10 text-muted border border-muted/20'
                  }`}>
                    {anime.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6. MANGA TERPOPULER — Horizontal shelf                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Manga & Manhwa Terpopuler"
          subtitle="Rekomendasi pilihan pembaca yang wajib dibaca"
          icon={<BookOpen className="w-5 h-5 text-purple-400" />}
          iconBg="bg-gradient-to-br from-purple-500/20 to-violet-500/20"
          linkPath="/manga"
        />
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2">
          {popularMangas.map((manga) => (
            <div key={manga.id} className="w-[140px] sm:w-[165px] md:w-[185px] shrink-0 snap-start">
              <MangaCard manga={manga} />
            </div>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 7. UPCOMING — Announcement cards with countdown style         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {upcomingAnimes.length > 0 && (
        <div>
          <SectionHeader
            title="Segera Hadir"
            subtitle="Anime yang dinantikan komunitas"
            icon={<Sparkles className="w-5 h-5 text-primary" />}
            iconBg="bg-gradient-to-br from-primary/20 to-primary-light/20"
            linkPath="/browse?status=upcoming"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAnimes.map((anime) => (
              <Link
                key={anime.id}
                to={`/anime/${anime.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all hover:shadow-glow"
              >
                <div className="relative aspect-video">
                  <img src={anime.coverUrl} alt={anime.title} className="w-full h-full object-cover brightness-[0.5] group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Upcoming badge overlay */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Coming Soon</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {anime.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <span>{anime.studio}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="text-primary-light font-semibold">{anime.releaseDate}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 8. COMPLETED — Grid of finished anime                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Selesai Ditonton"
          subtitle="Seri yang sudah tamat dan bisa dinikmati seutuhnya"
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          iconBg="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
          linkPath="/browse?status=completed"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {completedAnimes.map((anime) => (
            <div key={anime.id} className="animate-fade-in">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 9. CTA — Explore more bottom banner                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30">
        <div className="relative px-6 sm:px-10 py-10 sm:py-14 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface text-center">
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-bold font-heading text-text-primary mb-2">
              Masih Haus Tontonan?
            </h3>
            <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
              Jelajahi ribuan anime, manga, dan manhwa lainnya di katalog lengkap NanimeID.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
            >
              <Tv className="w-4.5 h-4.5" />
              Jelajahi Semua Konten
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
