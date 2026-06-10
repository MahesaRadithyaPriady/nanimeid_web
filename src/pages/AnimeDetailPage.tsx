import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Star, Search, ArrowUpDown, Share2, ArrowLeft } from 'lucide-react';
import { MOCK_ANIMES, MOCK_EPISODES } from '../constants/mockData';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';
import { AnimeCard } from '../components/cards/AnimeCard';
import { EpisodeCard } from '../components/cards/EpisodeCard';

export const AnimeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, watchHistory, addToast } = useAppStore();

  const [epSearch, setEpSearch] = useState('');
  const [epSortOrder, setEpSortOrder] = useState<'asc' | 'desc'>('asc');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  // Find current anime
  const anime = MOCK_ANIMES.find(a => a.slug === slug);
  if (!anime) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold">Anime tidak ditemukan!</h2>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const episodes = MOCK_EPISODES[anime.id] || [];
  const bookmarked = isBookmarked(anime.id, 'anime');

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      removeBookmark(anime.id, 'anime');
      addToast('info', `Dihapus dari simpanan: ${anime.title}`);
    } else {
      addBookmark(anime);
      addToast('success', `Disimpan ke daftar: ${anime.title}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Tautan halaman berhasil disalin!');
  };

  // Filter episodes
  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(epSearch.toLowerCase()) ||
    ep.episodeNumber.toString() === epSearch.trim()
  );

  // Sort episodes
  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    return epSortOrder === 'asc' 
      ? a.episodeNumber - b.episodeNumber 
      : b.episodeNumber - a.episodeNumber;
  });

  // Find related anime by overlapping genres (excluding current)
  const relatedAnimes = MOCK_ANIMES
    .filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g)))
    .slice(0, 5);

  // Check last watched episode from history
  const historyForThisAnime = watchHistory
    .filter(h => h.animeId === anime.id)
    .sort((a, b) => b.watchedAt - a.watchedAt);
  
  const lastWatchedEpisodeNum = historyForThisAnime.length > 0 
    ? historyForThisAnime[0].episodeNumber 
    : 1;

  return (
    <div className="pb-16 space-y-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors focus:outline-none mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali</span>
      </button>

      {/* Hero Header Section */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-bg-surface">
        {/* Backdrop Blurred Cover */}
        <div className="absolute inset-0 h-[220px] sm:h-[280px] md:h-[320px] w-full z-0 overflow-hidden">
          <img
            src={anime.coverUrl}
            alt={anime.title}
            className="w-full h-full object-cover filter blur-3xl opacity-30 scale-125 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
        </div>

        {/* Detail Content Overlay */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 pt-20 sm:pt-28 md:pt-36">
          {/* Poster Card */}
          <div className="relative w-44 sm:w-48 aspect-[2/3] bg-bg-base rounded-xl overflow-hidden border border-border shrink-0 shadow-2xl">
            <img
              src={anime.posterUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Meta Text */}
          <div className="flex-1 text-center md:text-left min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={anime.status === 'ongoing' ? 'ongoing' : anime.status === 'upcoming' ? 'upcoming' : 'completed'} className="uppercase text-[10px]">
                {anime.status}
              </Badge>
              <Badge variant="type">{anime.type}</Badge>
              <span className="text-xs font-semibold text-text-secondary">{anime.releaseDate}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-text-primary leading-tight tracking-tight">
              {anime.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-text-secondary font-medium">
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4.5 h-4.5 fill-yellow-400 text-yellow-400" />
                <strong className="text-text-primary text-sm font-mono">{anime.rating.toFixed(1)}</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>Studio: <strong className="text-text-primary">{anime.studio}</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>{anime.episodeCount} Episode</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {anime.genres.map((g) => (
                <Badge key={g} variant="genre">
                  {g}
                </Badge>
              ))}
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {episodes.length > 0 ? (
                <button
                  onClick={() => navigate(`/watch/${anime.slug}/ep/${lastWatchedEpisodeNum}`)}
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
                onClick={handleBookmarkToggle}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                  bookmarked 
                    ? 'bg-primary/10 border-primary text-primary-light' 
                    : 'bg-black/35 border-border hover:border-primary text-text-primary'
                }`}
              >
                {bookmarked ? (
                  <>
                    <Check className="w-4 h-4 text-primary-light" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                )}
              </button>

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
          {anime.description}
        </p>
        <button
          onClick={() => setSynopsisExpanded(!synopsisExpanded)}
          className="text-xs font-semibold text-primary hover:text-primary-light focus:outline-none transition-colors"
        >
          {synopsisExpanded ? 'Sembunyikan' : 'Baca Selengkapnya ▼'}
        </button>
      </div>

      {/* Episode Playlist Section */}
      {episodes.length > 0 && (
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 space-y-6 text-left">
          
          {/* Episode Header & Filter Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <h3 className="text-lg font-bold font-heading text-text-primary">Daftar Episode</h3>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
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

              {/* Sort Action */}
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
                // Find watch history progress
                const historyRecord = watchHistory.find(
                  h => h.animeId === anime.id && h.episodeNumber === ep.episodeNumber
                );
                const progress = historyRecord ? historyRecord.progress : 0;
                const isWatching = lastWatchedEpisodeNum === ep.episodeNumber;

                return (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    animeSlug={anime.slug}
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
                <AnimeCard anime={a} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
export default AnimeDetailPage;
