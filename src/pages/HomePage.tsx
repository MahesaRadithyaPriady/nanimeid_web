import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Flame, Sparkles, BookOpen, 
  Play, Star, Tv, Clock, TrendingUp, ArrowRight, Loader2,
  Trophy, Crown
} from 'lucide-react';
import { HeroBanner } from '../components/sections/HeroBanner';
import { AnimeCard } from '../components/cards/AnimeCard';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/useAppStore';
import type { ApiAnime, ApiAnimeLatest } from '../types';
import { fetchAnimeByView, fetchAnimeLatest, fetchAnimeRecommendations, fetchAnimeList } from '../lib/animeApi';
import { getLeaderboard } from '../lib/leaderboardApi';
import type { LeaderboardEntry } from '../lib/leaderboardApi';
import { UserAvatar } from '../components/ui/UserAvatar';

/* ─── Skeleton loader for cards ────────────────────────────────────── */
const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="w-full aspect-[2/3] bg-bg-elevated rounded-2xl" />
    <div className="mt-3 space-y-2 px-0.5">
      <div className="h-3.5 bg-bg-elevated rounded w-4/5" />
      <div className="h-2.5 bg-bg-elevated rounded w-3/5" />
    </div>
  </div>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { watchHistory, fetchAndSetMissingCovers } = useAppStore();
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  /* ── API state ── */
  const [trendingAnimes, setTrendingAnimes] = useState<ApiAnime[]>([]);
  const [newReleases, setNewReleases] = useState<ApiAnimeLatest[]>([]);
  const [recommendations, setRecommendations] = useState<ApiAnime[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Leaderboard states ── */
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Fetch Leaderboard Preview
  useEffect(() => {
    let active = true;
    async function loadLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const res = await getLeaderboard(leaderboardPeriod, 1, 5);
        if (!active) return;
        setLeaderboardEntries(res.data?.entries || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        if (!active) return;
        // Fallback mock data
        setLeaderboardEntries([]);
      } finally {
        if (active) setLoadingLeaderboard(false);
      }
    }
    loadLeaderboard();
    return () => { active = false; };
  }, [leaderboardPeriod]);

  /* ── Category Explore Section states ── */
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'ANIME' | 'DONGHUA' | 'FILM'>('semua');
  const [categoryItems, setCategoryItems] = useState<ApiAnime[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [hasMoreCategory, setHasMoreCategory] = useState(true);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingMoreCategory, setIsLoadingMoreCategory] = useState(false);

  // Initial shelves loading
  useEffect(() => {
    let cancelled = false;
    fetchAndSetMissingCovers();
    async function load() {
      setLoading(true);
      try {
        const [viewRes, latestRes, recsRes] = await Promise.allSettled([
          fetchAnimeByView({ limit: 30, type: 'ANIME' }),
          fetchAnimeLatest({ limit: 10, type: 'ANIME' }),
          fetchAnimeRecommendations({ limit: 12, type: 'ANIME' }),
        ]);

        if (cancelled) return;

        if (viewRes.status === 'fulfilled') setTrendingAnimes(viewRes.value.items ?? []);
        if (latestRes.status === 'fulfilled') setNewReleases(latestRes.value.items ?? []);
        if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data ?? []);
      } catch (err) {
        console.error('HomePage data fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Category explore list loading
  useEffect(() => {
    let cancelled = false;

    async function fetchCategoryData() {
      if (categoryPage === 1) {
        setIsLoadingCategory(true);
      } else {
        setIsLoadingMoreCategory(true);
      }

      try {
        const contentType = selectedCategory === 'semua' ? undefined : selectedCategory;
        const res = await fetchAnimeList({
          page: categoryPage,
          limit: 24,
          contentType,
          sortBy: 'id',
          order: 'desc'
        });

        if (cancelled) return;

        const items = res.data || [];
        if (categoryPage === 1) {
          setCategoryItems(items);
        } else {
          setCategoryItems(prev => [...prev, ...items]);
        }

        if (items.length < 24) {
          setHasMoreCategory(false);
        } else {
          setHasMoreCategory(true);
        }
      } catch (err) {
        console.error('Failed to fetch category items:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingCategory(false);
          setIsLoadingMoreCategory(false);
        }
      }
    }

    fetchCategoryData();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, categoryPage]);

  const handleCategoryChange = (cat: 'semua' | 'ANIME' | 'DONGHUA' | 'FILM') => {
    setSelectedCategory(cat);
    setCategoryPage(1);
    setCategoryItems([]);
    setHasMoreCategory(true);
  };

  const handleLoadMoreCategory = () => {
    setCategoryPage(prev => prev + 1);
  };

  // Continue watching from history (persisted in store with covers)
  const recentHistory = watchHistory.slice(0, 4);

  // Featured pick
  const editorPick = recommendations[0] ?? trendingAnimes[0];

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
      <RouterLink 
        to={linkPath}
        className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors shrink-0"
      >
        <span>Lihat Semua</span>
        <ChevronRight className="w-4.5 h-4.5" />
      </RouterLink>
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. HERO SLIDER BANNER                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <HeroBanner />


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. CONTINUE WATCHING — Quick resume list (persisted via store) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {recentHistory.length > 0 && (
        <div className="animate-fade-in text-left">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center shrink-0">
              <Play className="w-4.5 h-4.5 text-primary fill-primary" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                Lanjutkan Menonton
              </h2>
              <span className="text-[11px] text-muted font-medium">Lanjutkan progress tontonan terakhirmu</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recentHistory.map((h) => {
              const percentage = Math.round(h.progress * 100);

              return (
                <RouterLink
                  key={h.id}
                  to={`/watch/${h.animeId}/ep/${h.episodeNumber}`}
                  className="group flex gap-3 bg-bg-surface/50 border border-border/30 hover:border-primary/20 rounded-xl p-2.5 transition-all duration-200"
                >
                  {/* Aspect ratio 16:9 box */}
                  <div className="relative w-24 aspect-[16/10] bg-bg-elevated rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={h.animeCover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop'} 
                      alt={h.animeTitle} 
                      className="w-full h-full object-cover brightness-[0.8] group-hover:scale-105 transition-transform" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  {/* Meta details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                      {h.animeTitle}
                    </h4>
                    <span className="text-[10px] text-text-secondary truncate mt-0.5">
                      Ep {h.episodeNumber} - {h.episodeTitle}
                    </span>
                    <span className="text-[9.5px] text-primary-light font-semibold mt-1">
                      Selesai {percentage}%
                    </span>
                  </div>
                </RouterLink>
              );
            })}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. TRENDING NOW — Horizontal scrolling shelf                  */}
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
              <span className="text-[11px] text-muted font-medium">Anime yang paling banyak ditonton minggu ini</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => scrollTrending('left')}
              className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
              aria-label="Scroll kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollTrending('right')}
              className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
              aria-label="Scroll kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0">
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div 
            ref={trendingScrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2"
          >
            {trendingAnimes.map((anime) => (
              <div key={anime.id} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0 snap-start">
                <AnimeCard apiAnime={anime} />
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 4. EDITOR'S PICK — Big landscape feature card                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {editorPick && !loading && (
        <div className="relative w-full rounded-2xl overflow-hidden border border-border/30 group cursor-pointer"
          onClick={() => navigate(`/anime/${editorPick.id}`)}
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:min-h-[280px]">
              <img 
                src={editorPick.gambar_anime} 
                alt={editorPick.nama_anime}
                className="absolute inset-0 w-full h-full object-cover brightness-[0.7] group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-base/90 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 to-transparent md:hidden" />
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Pilihan Editor</span>
                </div>
              </div>
            </div>
            
            <div className="relative w-full md:w-1/2 bg-bg-surface/80 p-6 sm:p-8 flex flex-col justify-center text-left">
              <div className="flex flex-wrap gap-2 mb-3">
                {(editorPick.genre_anime ?? []).map(g => (
                  <Badge key={g} variant="genre" className="text-[10px]">{g}</Badge>
                ))}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-text-primary leading-tight tracking-tight mb-2 group-hover:text-primary transition-colors">
                {editorPick.nama_anime}
              </h2>
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <strong className="font-mono text-text-primary">{(editorPick.rating_anime ?? 0).toFixed(1)}</strong>
                </span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{(editorPick.studio_anime ?? []).join(', ')}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{editorPick.episodes_count ?? 0} Episode</span>
              </div>
              <p className="text-sm text-text-secondary/80 line-clamp-3 mb-5 leading-relaxed">
                {editorPick.sinopsis_anime}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/watch/${editorPick.id}/ep/1`); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm hover:opacity-90 transition-all shadow-glow active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Tonton
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/anime/${editorPick.id}`); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 hover:border-primary/40 text-text-primary hover:text-primary text-sm font-semibold transition-all active:scale-95"
                >
                  Detail
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LEADERBOARD PREVIEW                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-bg-surface/40 border border-border/30 rounded-2xl p-5 sm:p-6 text-left backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-heading text-text-primary tracking-tight leading-tight">
                Leaderboard Penonton
              </h2>
              <span className="text-[11px] text-muted font-medium">Pengguna teraktif dengan perolehan XP terbanyak</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex bg-bg-elevated/50 p-1 rounded-xl border border-border/40">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setLeaderboardPeriod(period)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    leaderboardPeriod === period
                      ? 'bg-primary text-black shadow-glow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>

            <RouterLink
              to="/leaderboard"
              className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors shrink-0"
            >
              <span>Selengkapnya</span>
              <ChevronRight className="w-4.5 h-4.5" />
            </RouterLink>
          </div>
        </div>

        {loadingLeaderboard ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <p className="text-xs text-muted">Memuat data peringkat...</p>
          </div>
        ) : leaderboardEntries.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Podium Top 3 (col-span 7) */}
            <div className="lg:col-span-7 flex flex-col items-center pt-16 pb-4 bg-bg-base/30 rounded-2xl border border-border/20">
              <div className="flex items-end justify-center w-full max-w-md px-4 mt-2 h-64 select-none">
                {/* 2nd Place */}
                {leaderboardEntries[1] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="relative group flex flex-col items-center">
                      <div className="absolute -top-7 text-text-secondary/70 font-black text-xs font-heading">#2</div>
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={leaderboardEntries[1].user.avatarUrl}
                          name={leaderboardEntries[1].user.fullName || leaderboardEntries[1].user.username}
                          className="w-14 h-14 rounded-full border-2 border-slate-400 shadow-lg group-hover:scale-105 transition-all"
                        />
                        {leaderboardEntries[1].user.activeAvatarBorder && (
                          <img
                            src={leaderboardEntries[1].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-slate-400 mt-2 font-bold text-xs truncate max-w-[80px]">
                        {leaderboardEntries[1].user.fullName || leaderboardEntries[1].user.username}
                      </span>
                      <span className="text-[10px] text-muted font-semibold mt-0.5">
                        {leaderboardEntries[1].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-slate-500/25 to-slate-500/5 border-t border-slate-500/30 rounded-t-xl h-16 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-2xl font-black text-slate-400 font-heading">2</div>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboardEntries[0] && (
                  <div className="flex flex-col items-center w-1/3 z-10 -mx-1">
                    <div className="relative group flex flex-col items-center">
                      <Crown className="absolute -top-8 w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-bounce" />
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={leaderboardEntries[0].user.avatarUrl}
                          name={leaderboardEntries[0].user.fullName || leaderboardEntries[0].user.username}
                          className="w-18 h-18 rounded-full border-4 border-yellow-400 shadow-glow-sm group-hover:scale-105 transition-all"
                        />
                        {leaderboardEntries[0].user.activeAvatarBorder && (
                          <img
                            src={leaderboardEntries[0].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-yellow-400 mt-2 font-black text-sm truncate max-w-[95px] drop-shadow-[0_0_4px_rgba(250,204,21,0.2)]">
                        {leaderboardEntries[0].user.fullName || leaderboardEntries[0].user.username}
                      </span>
                      <span className="text-xs text-yellow-300 font-extrabold mt-0.5">
                        {leaderboardEntries[0].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-yellow-500/25 to-yellow-500/5 border-t border-yellow-500/30 rounded-t-xl h-24 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-3xl font-black text-yellow-400 font-heading">1</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboardEntries[2] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="relative group flex flex-col items-center">
                      <div className="absolute -top-7 text-text-secondary/70 font-black text-xs font-heading">#3</div>
                      <div className="relative flex items-center justify-center shrink-0">
                        <UserAvatar
                          src={leaderboardEntries[2].user.avatarUrl}
                          name={leaderboardEntries[2].user.fullName || leaderboardEntries[2].user.username}
                          className="w-12 h-12 rounded-full border border-amber-600 shadow-lg group-hover:scale-105 transition-all"
                        />
                        {leaderboardEntries[2].user.activeAvatarBorder && (
                          <img
                            src={leaderboardEntries[2].user.activeAvatarBorder.imageUrl}
                            alt="Border"
                            className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                          />
                        )}
                      </div>
                      <span className="text-amber-600 mt-2 font-bold text-xs truncate max-w-[80px]">
                        {leaderboardEntries[2].user.fullName || leaderboardEntries[2].user.username}
                      </span>
                      <span className="text-[10px] text-muted font-semibold mt-0.5">
                        {leaderboardEntries[2].total_xp} XP
                      </span>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full bg-gradient-to-t from-amber-700/25 to-amber-700/5 border-t border-amber-700/30 rounded-t-xl h-12 mt-3 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <div className="text-xl font-black text-amber-600 font-heading">3</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List View for Ranks 4-5 (col-span 5) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2 px-1">
                Peringkat Lainnya
              </span>
              {leaderboardEntries.slice(3, 5).map((entry) => (
                <div
                  key={entry.user.id}
                  className="flex items-center justify-between p-3.5 bg-bg-base/35 border border-border/30 hover:border-primary/10 rounded-xl transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-6 text-sm font-black font-heading text-text-secondary text-center">
                      {entry.rank}
                    </span>
                    <div className="relative flex items-center justify-center shrink-0">
                      <UserAvatar
                        src={entry.user.avatarUrl}
                        name={entry.user.fullName || entry.user.username}
                        className="w-9 h-9 rounded-full"
                      />
                      {entry.user.activeAvatarBorder && (
                        <img
                          src={entry.user.activeAvatarBorder.imageUrl}
                          alt="Border"
                          className="absolute -inset-[15%] w-[130%] h-[130%] max-w-none pointer-events-none z-20"
                        />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary truncate block max-w-[120px] sm:max-w-none">
                          {entry.user.fullName || entry.user.username}
                        </span>
                        {entry.user.vip && entry.user.vip.status === 'ACTIVE' && (
                          <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-gradient-to-r from-yellow-500 to-amber-600 text-black uppercase tracking-wider scale-90">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted font-medium truncate block">
                        @{entry.user.username}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-primary">
                      {entry.total_xp}
                    </span>
                    <span className="text-[9px] text-muted block font-semibold uppercase">
                      XP
                    </span>
                  </div>
                </div>
              ))}
              {leaderboardEntries.length < 4 && (
                <div className="py-8 text-center text-xs text-muted border border-dashed border-border/40 rounded-xl">
                  Selesaikan misi menonton untuk menempati peringkat teratas!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-bg-surface/20">
            <p className="text-sm text-muted font-medium">Belum ada aktivitas di periode ini.</p>
          </div>
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 5. NEW RELEASES — 2x2 Landscape cards grid                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          title="Baru Dirilis"
          subtitle="Episode terbaru yang baru saja tayang"
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          iconBg="bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
          linkPath="/browse?sort=latest"
        />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 bg-bg-surface/60 rounded-xl p-3">
                <div className="w-[100px] sm:w-[120px] aspect-[2/3] bg-bg-elevated rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-bg-elevated rounded w-3/4" />
                  <div className="h-3 bg-bg-elevated rounded w-1/2" />
                  <div className="h-3 bg-bg-elevated rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {newReleases.slice(0, 6).map((anime) => (
              <RouterLink
                key={anime.id}
                to={`/anime/${anime.id}`}
                className="group flex gap-4 bg-bg-surface/60 hover:bg-bg-elevated border border-border/30 hover:border-primary/20 rounded-xl p-3 transition-all"
              >
                <div className="relative w-[100px] sm:w-[120px] shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                  <img src={anime.gambar_anime} alt={anime.nama_anime} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-1.5 right-1.5">
                    <Badge variant="episode" className="bg-black/85 text-[9px] px-1.5 py-0.5">
                      {anime.last_episode ? `Ep ${anime.last_episode.nomor_episode}` : `${anime.episodes_count ?? 0} Ep`}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center text-left py-1">
                  <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
                    {anime.nama_anime}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                    <span className="flex items-center gap-0.5 text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {(anime.rating_anime ?? 0).toFixed(1)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{(anime.studio_anime ?? []).join(', ')}</span>
                  </div>
                  <p className="text-xs text-text-secondary/70 line-clamp-2 leading-relaxed mb-2.5">
                    {anime.sinopsis_anime}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(anime.genre_anime ?? []).slice(0, 2).map(g => (
                      <span key={g} className="text-[9px] font-semibold px-2 py-0.5 bg-white/[0.05] text-muted rounded-md border border-white/[0.06]">{g}</span>
                    ))}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      (anime.status_anime ?? '').toLowerCase().includes('ongoing') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-muted/10 text-muted border border-muted/20'
                    }`}>
                      {anime.status_anime}
                    </span>
                  </div>
                </div>
              </RouterLink>
            ))}
          </div>
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6. EXPLORE BY CATEGORY — Category tabs + Grid + Load More     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <SectionHeader
          title="Katalog Konten"
          subtitle="Telusuri serial anime, donghua, dan film favoritmu"
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          iconBg="bg-gradient-to-br from-primary/20 to-primary-light/20"
          linkPath="/browse"
        />

        {/* Category Tabs / Pills */}
        <div className="flex flex-wrap gap-2.5 pb-2">
          {[
            { id: 'semua', lbl: 'Semua Kategori' },
            { id: 'ANIME', lbl: 'Anime' },
            { id: 'DONGHUA', lbl: 'Donghua' },
            { id: 'FILM', lbl: 'Film' }
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategoryChange(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all duration-300 transform active:scale-95 focus:outline-none border ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-primary-light text-black border-primary shadow-glow-sm hover:opacity-95' 
                    : 'bg-bg-surface/50 border-border/60 text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-bg-elevated'
                }`}
              >
                <span>{tab.lbl}</span>
              </button>
            );
          })}
        </div>

        {/* Grid or Loader */}
        {isLoadingCategory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : categoryItems.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {categoryItems.map((anime, index) => (
                <div 
                  key={`${anime.id}-${index}`} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                >
                  <AnimeCard apiAnime={anime} />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreCategory && (
              <div className="flex justify-center pt-2">
                <button
                  disabled={isLoadingMoreCategory}
                  onClick={handleLoadMoreCategory}
                  className="px-8 py-3 bg-bg-surface border border-border/60 hover:border-primary/40 text-text-primary hover:text-primary font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 hover:shadow-glow/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 focus:outline-none"
                >
                  {isLoadingMoreCategory && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span>{isLoadingMoreCategory ? 'Sedang Memuat...' : 'Muat Lebih Banyak'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl bg-bg-surface/20">
            <p className="text-sm text-muted font-medium">Tidak ada konten yang tersedia di kategori ini.</p>
          </div>
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 7. RECOMMENDED FOR YOU — Grid of recommended anime            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!loading && recommendations.length > 0 && (
        <div>
          <SectionHeader
            title="Rekomendasi Untukmu"
            subtitle="Pilihan anime berdasarkan preferensi kamu"
            icon={<TrendingUp className="w-5 h-5 text-green-400" />}
            iconBg="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
            linkPath="/browse"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
            {recommendations.slice(0, 6).map((anime) => (
              <div key={anime.id} className="animate-fade-in">
                <AnimeCard apiAnime={anime} />
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 8. CTA — Explore more bottom banner                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30">
        <div className="relative px-6 sm:px-10 py-10 sm:py-14 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-bold font-heading text-text-primary mb-2">
              Masih Haus Tontonan?
            </h3>
            <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
              Jelajahi ribuan anime, donghua, dan film lainnya di katalog lengkap NanimeID.
            </p>
            <RouterLink
              to="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
            >
              <Tv className="w-4.5 h-4.5" />
              Jelajahi Semua Konten
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
