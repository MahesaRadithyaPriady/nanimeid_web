import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import type { Anime } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { Badge } from '../ui/Badge';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, addToast, watchHistory } = useAppStore();
  const bookmarked = isBookmarked(anime.id, 'anime');

  // Find latest progress of this anime in watch history
  const histForAnime = watchHistory
    .filter((h) => h.animeId === anime.id)
    .sort((a, b) => b.watchedAt - a.watchedAt)[0];
  const watchProgress = histForAnime ? histForAnime.progress : 0;

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      removeBookmark(anime.id, 'anime');
      addToast('info', `Dihapus dari simpanan: ${anime.title}`);
    } else {
      addBookmark(anime);
      addToast('success', `Disimpan ke daftar: ${anime.title}`);
    }
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/watch/${anime.slug}/ep/1`);
    addToast('info', `Memutar ${anime.title} Episode 1`);
  };

  return (
    <Link 
      to={`/anime/${anime.slug}`}
      className="group flex flex-col w-full text-left focus:outline-none"
    >
      {/* Poster Container (YouTube Thumbnail) */}
      <div className="relative w-full aspect-[2/3] bg-bg-surface rounded-2xl overflow-hidden border border-border/40 transition-all duration-250 ease-out group-hover:scale-[1.02] group-hover:shadow-glow group-hover:border-primary/30">
        
        {/* Shimmer Placeholder Background */}
        <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />

        {/* Poster Image */}
        <img
          src={anime.posterUrl}
          alt={anime.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onLoad={(e) => {
            (e.currentTarget.previousSibling as HTMLElement)?.remove();
          }}
        />

        {/* Top-Left Rating & Status Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
          <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 font-bold px-2 py-0.5 text-[10px]">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{anime.rating.toFixed(1)}</span>
          </Badge>
          <Badge 
            variant={anime.status === 'ongoing' ? 'ongoing' : anime.status === 'upcoming' ? 'upcoming' : 'completed'} 
            className="bg-black/60 backdrop-blur-md border border-white/10 uppercase text-[9px] font-bold px-2 py-0.5"
          >
            {anime.status}
          </Badge>
        </div>

        {/* Top-Right Quick Bookmark Overlay (YouTube-like hover save action) */}
        <button
          onClick={handleBookmarkToggle}
          className={`absolute top-2.5 right-2.5 z-20 p-2 bg-black/70 backdrop-blur-sm text-text-primary rounded-full hover:bg-black/95 hover:text-primary transition-all active:scale-90 shadow-md ${
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

        {/* Bottom-Right Episode Badge (YouTube Timestamp placement) */}
        <div className="absolute bottom-2.5 right-2.5 z-20">
          <Badge variant="episode" className="bg-black/85 backdrop-blur-sm border border-white/5 font-bold px-2 py-0.5 rounded text-[10px]">
            {anime.status === 'ongoing' ? `Ep ${anime.episodeCount}` : 'Tamat'}
          </Badge>
        </div>

        {/* Watch Progress Bar Overlay at bottom of thumbnail */}
        {watchProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-light" 
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
          {anime.title}
        </h4>
        
        {/* Stats & Genres */}
        <div className="mt-1.5 flex items-center flex-wrap gap-1 text-[11px] text-muted font-medium">
          <span className="font-mono text-[10px]">{anime.genres[0]}</span>
          <span className="text-border/60">•</span>
          <span>★ {anime.rating.toFixed(1)}</span>
          <span className="text-border/60">•</span>
          <span>{anime.releaseDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;
