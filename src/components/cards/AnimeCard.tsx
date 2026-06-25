import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import type { Anime, ApiAnime } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { Badge } from '../ui/Badge';

interface AnimeCardProps {
  /** Legacy mock anime object */
  anime?: Anime;
  /** Backend API anime object */
  apiAnime?: ApiAnime;
}

/** Normalise either source into a uniform shape for rendering */
function useNormalized(props: AnimeCardProps) {
  if (props.apiAnime) {
    const a = props.apiAnime;
    return {
      id: String(a.id),
      numericId: a.id,
      title: a.nama_anime,
      posterUrl: a.gambar_anime,
      coverUrl: a.gambar_anime,
      rating: Number(a.rating_anime) || 0,
      status: (a.status_anime ?? '').toLowerCase() as 'ongoing' | 'completed' | 'upcoming',
      statusRaw: a.status_anime ?? '',
      genres: a.genre_anime ?? [],
      studio: (a.studio_anime ?? []).join(', ') || '-',
      episodeCount: a.episodes_count ?? 0,
      releaseDate: a.tanggal_rilis_anime ?? '',
      description: a.sinopsis_anime ?? '',
      viewCount: a.view_anime,
      slug: String(a.id), // use id as slug for route
      isApi: true as const,
    };
  }
  const a = props.anime!;
  return {
    id: a.id,
    numericId: undefined as number | undefined,
    title: a.title,
    posterUrl: a.posterUrl,
    coverUrl: a.coverUrl,
    rating: Number(a.rating) || 0,
    status: a.status,
    statusRaw: a.status,
    genres: a.genres,
    studio: a.studio,
    episodeCount: a.episodeCount,
    releaseDate: a.releaseDate,
    description: a.description,
    viewCount: undefined as string | number | undefined,
    slug: a.slug,
    isApi: false as const,
  };
}

export const AnimeCard: React.FC<AnimeCardProps> = (props) => {
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, addToast, watchHistory, isLoggedIn } = useAppStore();
  const n = useNormalized(props);

  const bookmarked = isBookmarked(n.id, 'anime');

  // Find latest progress of this anime in watch history
  const histForAnime = watchHistory
    .filter((h) => h.animeId === n.id)
    .sort((a, b) => b.watchedAt - a.watchedAt)[0];
  const watchProgress = histForAnime ? histForAnime.progress : 0;

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      addToast('info', 'Login dulu untuk menyimpan konten!');
      return;
    }
    if (bookmarked) {
      removeBookmark(n.id, 'anime');
      addToast('info', `Dihapus dari simpanan: ${n.title}`);
    } else {
      if (props.apiAnime) {
        const a = props.apiAnime;
        const mappedAnime: Anime = {
          id: String(a.id),
          title: a.nama_anime,
          slug: String(a.id),
          description: a.sinopsis_anime ?? '',
          type: 'anime',
          status: (a.status_anime ?? '').toLowerCase().includes('ongoing') ? 'ongoing' : 'completed',
          releaseDate: a.tanggal_rilis_anime ?? '',
          studio: (a.studio_anime ?? []).join(', '),
          rating: a.rating_anime ?? 0,
          episodeCount: a.episodes_count ?? 0,
          genres: a.genre_anime ?? [],
          coverUrl: a.gambar_anime,
          posterUrl: a.gambar_anime,
        };
        addBookmark(mappedAnime);
      } else if (props.anime) {
        addBookmark(props.anime);
      }
      addToast('success', `Disimpan ke daftar: ${n.title}`);
    }
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${n.slug}/ep/1`);
    addToast('info', `Memutar ${n.title} Episode 1`);
  };

  const statusNorm = n.statusRaw.toLowerCase();
  const statusVariant = statusNorm.includes('ongoing') ? 'ongoing'
    : statusNorm.includes('upcoming') ? 'upcoming'
    : 'completed';

  return (
    <Link 
      to={`/anime/${n.slug}`}
      className="group flex flex-col w-full text-left focus:outline-none"
    >
      {/* Poster Container */}
      <div className="relative w-full aspect-[2/3] bg-bg-surface rounded-2xl overflow-hidden border border-border/40 transition-all duration-250 ease-out group-hover:scale-[1.02] group-hover:shadow-glow group-hover:border-primary/30">
        
        {/* Shimmer Placeholder Background */}
        <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />

        {/* Poster Image */}
        <img
          src={n.posterUrl}
          alt={n.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onLoad={(e) => {
            (e.currentTarget.previousSibling as HTMLElement)?.remove();
          }}
        />

        {/* Top-Left Rating & Status Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
          <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold px-2 py-0.5 text-[10px]">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{n.rating.toFixed(1)}</span>
          </Badge>
          <Badge 
            variant={statusVariant} 
            className="bg-black/60 backdrop-blur-md border border-white/10 text-white uppercase text-[9px] font-bold px-2 py-0.5"
          >
            {n.statusRaw}
          </Badge>
        </div>

        {/* Top-Right Quick Bookmark Overlay */}
        <button
          onClick={handleBookmarkToggle}
          className={`absolute top-2.5 right-2.5 z-20 p-2 bg-black/70 backdrop-blur-sm text-white rounded-full hover:bg-black/95 hover:text-primary transition-all active:scale-90 shadow-md ${
            bookmarked ? 'opacity-100 scale-100 text-primary border border-primary/30' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
          }`}
          aria-label={bookmarked ? "Hapus dari tersimpan" : "Simpan anime"}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Bottom-Right Episode Badge */}
        <div className="absolute bottom-2.5 right-2.5 z-20">
          <Badge variant="episode" className="bg-black/85 backdrop-blur-sm border border-white/5 text-white font-bold px-2 py-0.5 rounded text-[10px]">
            {statusNorm.includes('ongoing') ? `Ep ${n.episodeCount}` : statusNorm.includes('upcoming') ? 'Segera' : 'Tamat'}
          </Badge>
        </div>

        {/* Watch Progress Bar */}
        {watchProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${watchProgress * 100}%` }}
            />
          </div>
        )}

        {/* Hover Center Play Button Overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center z-10">
          <button
            onClick={handleQuickPlay}
            className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary-light hover:scale-110 active:scale-95 transition-all shadow-glow-lg transform scale-75 group-hover:scale-100 duration-250"
            aria-label="Putar sekarang"
          >
            <Play className="w-5.5 h-5.5 fill-black text-black translate-x-[0.5px]" />
          </button>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="mt-3 px-0.5">
        <h4 className="text-sm font-bold font-sans text-text-primary group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-snug">
          {n.title}
        </h4>
        
        {/* Stats & Genres */}
        <div className="mt-1.5 flex items-center flex-wrap gap-1.5 text-[11px] text-muted font-medium">
          <span className="font-mono text-[10px] text-text-secondary dark:text-muted">{n.genres[0] ?? ''}</span>
          <span className="text-border dark:text-muted/40">•</span>
          <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {n.rating.toFixed(1)}
          </span>
          {n.viewCount !== undefined && (
            <>
              <span className="text-border dark:text-muted/40">•</span>
              <span>{n.viewCount} views</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;
