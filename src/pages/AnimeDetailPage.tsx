import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Star, Search, ArrowUpDown, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';
import { AnimeCard } from '../components/cards/AnimeCard';
import { EpisodeCard } from '../components/cards/EpisodeCard';
import type { ApiAnime, ApiEpisode } from '../types';
import { fetchAnimeDetail, fetchSimilarAnime } from '../lib/animeApi';

export const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast, watchHistory } = useAppStore();

  const [epSearch, setEpSearch] = useState('');
  const [epSortOrder, setEpSortOrder] = useState<'asc' | 'desc'>('asc');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  /* ── API State ── */
  const [anime, setAnime] = useState<ApiAnime | null>(null);
  const [episodes, setEpisodes] = useState<ApiEpisode[]>([]);
  const [relatedAnimes, setRelatedAnimes] = useState<ApiAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, similarRes] = await Promise.allSettled([
          fetchAnimeDetail(id!),
          fetchSimilarAnime(id!, { limit: 6 }),
        ]);

        if (cancelled) return;

        if (detailRes.status === 'fulfilled') {
          setAnime(detailRes.value.data);
          setEpisodes(detailRes.value.data.episodes ?? []);
        } else {
          setError(detailRes.reason?.message ?? 'Gagal memuat data anime');
        }

        if (similarRes.status === 'fulfilled') {
          setRelatedAnimes(similarRes.value.data ?? []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Terjadi kesalahan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold">{error ?? 'Anime tidak ditemukan!'}</h2>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Tautan halaman berhasil disalin!');
  };

  // Filter episodes
  const filteredEpisodes = episodes.filter(ep => 
    (ep.judul_episode ?? '').toLowerCase().includes(epSearch.toLowerCase()) ||
    ep.nomor_episode.toString() === epSearch.trim()
  );

  // Sort episodes
  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    return epSortOrder === 'asc' 
      ? a.nomor_episode - b.nomor_episode 
      : b.nomor_episode - a.nomor_episode;
  });

  // Check last watched episode from history
  const historyForThisAnime = watchHistory
    .filter(h => h.animeId === String(anime.id))
    .sort((a, b) => b.watchedAt - a.watchedAt);
  
  const lastWatchedEpisodeNum = historyForThisAnime.length > 0 
    ? historyForThisAnime[0].episodeNumber 
    : 1;

  // Normalize status
  const statusNorm = (anime.status_anime ?? '').toLowerCase();
  const statusVariant = statusNorm.includes('ongoing') ? 'ongoing' : statusNorm.includes('upcoming') ? 'upcoming' : 'completed';

  return (
    <div className="pb-16 space-y-8">
      {/* Back Button */}
      <div className="flex justify-start">
        <button 
          onClick={() => {
            if (window.history.length > 1 && location.key !== 'default') {
              navigate(-1);
            } else {
              navigate('/');
            }
          }} 
          className="group inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-text-secondary hover:text-primary bg-bg-surface/30 hover:bg-bg-surface/80 backdrop-blur-md border border-border/40 hover:border-primary/30 rounded-xl transition-all duration-300 active:scale-95 shadow-sm hover:shadow-[0_0_20px_rgba(255,102,205,0.12)] focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Hero Header Section */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-bg-surface">
        {/* Backdrop Blurred Cover */}
        <div className="absolute inset-0 h-[220px] sm:h-[280px] md:h-[320px] w-full z-0 overflow-hidden">
          <img
            src={anime.gambar_anime}
            alt={anime.nama_anime}
            className="w-full h-full object-cover filter blur-3xl opacity-30 scale-125 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
        </div>

        {/* Detail Content Overlay */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 pt-20 sm:pt-28 md:pt-36">
          {/* Poster Card */}
          <div className="relative w-44 sm:w-48 aspect-[2/3] bg-bg-base rounded-xl overflow-hidden border border-border shrink-0 shadow-2xl">
            <img
              src={anime.gambar_anime}
              alt={anime.nama_anime}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Meta Text */}
          <div className="flex-1 text-center md:text-left min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={statusVariant} className="uppercase text-[10px]">
                {anime.status_anime}
              </Badge>
              <Badge variant="type">{anime.label_anime ?? anime.content_type ?? 'ANIME'}</Badge>
              <span className="text-xs font-semibold text-text-secondary">{anime.tanggal_rilis_anime}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-text-primary leading-tight tracking-tight">
              {anime.nama_anime}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-text-secondary font-medium">
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4.5 h-4.5 fill-yellow-400 text-yellow-400" />
                <strong className="text-text-primary text-sm font-mono">{(anime.rating_anime ?? 0).toFixed(1)}</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>Studio: <strong className="text-text-primary">{(anime.studio_anime ?? []).join(', ')}</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>{anime.episodes_count ?? episodes.length} Episode</span>
              {anime.view_anime !== undefined && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>{anime.view_anime} views</span>
                </>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {(anime.genre_anime ?? []).map((g) => (
                <Badge key={g} variant="genre">
                  {g}
                </Badge>
              ))}
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {anime.content_type === 'FILM' ? (
                <button
                  onClick={() => navigate(`/watch/${anime.id}/ep/1`, { state: { fromDetail: true } })}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl shadow-glow hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>Tonton Film</span>
                </button>
              ) : episodes.length > 0 ? (
                <button
                  onClick={() => navigate(`/watch/${anime.id}/ep/${lastWatchedEpisodeNum}`, { state: { fromDetail: true } })}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl shadow-glow hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>
                    {lastWatchedEpisodeNum > 1 ? `Lanjutkan Ep ${lastWatchedEpisodeNum}` : 'Tonton Ep 1'}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-border text-muted font-semibold text-sm rounded-xl cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-muted text-muted" />
                  <span>Segera Hadir</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-3 bg-black/35 hover:bg-bg-elevated border border-border text-text-primary hover:text-primary rounded-xl transition-all active:scale-95 focus:outline-none"
                aria-label="Bagikan halaman"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Details Synopsis & Info */}
      <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 space-y-4 text-left">
        <h3 className="text-lg font-bold font-heading text-text-primary">Sinopsis</h3>
        <p className={`text-sm text-text-secondary leading-relaxed ${synopsisExpanded ? '' : 'line-clamp-3'}`}>
          {anime.sinopsis_anime ?? 'Belum ada sinopsis.'}
        </p>
        {(anime.sinopsis_anime ?? '').length > 200 && (
          <button
            onClick={() => setSynopsisExpanded(!synopsisExpanded)}
            className="text-xs font-semibold text-primary hover:text-primary-light focus:outline-none transition-colors"
          >
            {synopsisExpanded ? 'Sembunyikan' : 'Baca Selengkapnya ▼'}
          </button>
        )}
      </div>

      {/* Episode Playlist Section */}
      {episodes.length > 0 && anime.content_type !== 'FILM' && (
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 space-y-6 text-left">
          
          {/* Episode Header & Filter Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <h3 className="text-lg font-bold font-heading text-text-primary">Daftar Episode</h3>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Cari nomor/judul..."
                  value={epSearch}
                  onChange={(e) => setEpSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-bg-base border border-border/80 rounded-lg text-xs text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/50 max-w-[180px]"
                />
              </div>

              <button
                onClick={() => setEpSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1.5 px-3 py-2 bg-bg-base hover:bg-bg-elevated border border-border text-xs font-semibold text-text-primary rounded-lg transition-colors focus:outline-none"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                <span>{epSortOrder === 'asc' ? 'Terlama' : 'Terbaru'}</span>
              </button>
            </div>
          </div>

          {/* Episode List viewport */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-pink">
            {sortedEpisodes.length > 0 ? (
              sortedEpisodes.map((ep) => {
                const historyRecord = watchHistory.find(
                  h => h.animeId === String(anime.id) && h.episodeNumber === ep.nomor_episode
                );
                const progress = historyRecord ? historyRecord.progress : 0;
                const isWatching = lastWatchedEpisodeNum === ep.nomor_episode;

                return (
                  <EpisodeCard
                    key={ep.id}
                    apiEpisode={ep}
                    animeSlug={String(anime.id)}
                    progress={progress}
                    isActive={isWatching && historyRecord !== undefined}
                  />
                );
              })
            ) : (
              <div className="py-12 text-center text-sm text-muted">
                Tidak ada episode yang sesuai pencarian.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Similar Anime recommendations */}
      {relatedAnimes.length > 0 && (
        <div className="space-y-4 text-left">
          <h3 className="text-lg font-bold font-heading text-text-primary">Anime Serupa</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
            {relatedAnimes.map((a) => (
              <div key={a.id} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0 snap-start animate-fade-in">
                <AnimeCard apiAnime={a} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
export default AnimeDetailPage;
