import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import type { Manga } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { Badge } from '../ui/Badge';

interface MangaCardProps {
  manga: Manga;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga }) => {
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, addToast } = useAppStore();
  const bookmarked = isBookmarked(manga.id, 'manga');

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      removeBookmark(manga.id, 'manga');
      addToast('info', `Dihapus dari simpanan: ${manga.title}`);
    } else {
      addBookmark(manga);
      addToast('success', `Disimpan ke daftar: ${manga.title}`);
    }
  };

  const handleQuickRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/read/${manga.slug}/ch/1`);
    addToast('info', `Membaca ${manga.title} Bab 1`);
  };

  return (
    <Link 
      to={`/manga/${manga.slug}`}
      className="group flex flex-col w-full text-left focus:outline-none"
    >
      {/* Cover Container (YouTube Thumbnail) */}
      <div className="relative w-full aspect-[7/10] bg-bg-surface rounded-2xl overflow-hidden border border-border/40 transition-all duration-250 ease-out group-hover:scale-[1.02] group-hover:shadow-glow group-hover:border-primary/30">
        
        {/* Shimmer Placeholder Background */}
        <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />

        {/* Cover Image */}
        <img
          src={manga.coverUrl}
          alt={manga.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onLoad={(e) => {
            (e.currentTarget.previousSibling as HTMLElement)?.remove();
          }}
        />

        {/* Top-Left Rating & Type Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
          <Badge variant="rating" className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 font-bold px-2 py-0.5 text-[10px]">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{manga.rating.toFixed(1)}</span>
          </Badge>
          <Badge variant="type" className="bg-primary-deep text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">
            {manga.type}
          </Badge>
        </div>

        {/* Top-Right Quick Bookmark Overlay (YouTube-like hover save action) */}
        <button
          onClick={handleBookmarkToggle}
          className={`absolute top-2.5 right-2.5 z-20 p-2 bg-black/70 backdrop-blur-sm text-text-primary rounded-full hover:bg-black/95 hover:text-primary transition-all active:scale-90 shadow-md ${
            bookmarked ? 'opacity-100 scale-100 text-primary border border-primary/30' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
          }`}
          aria-label={bookmarked ? "Hapus dari tersimpan" : "Simpan manga"}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Bottom-Right Chapter Badge (YouTube Timestamp placement) */}
        <div className="absolute bottom-2.5 right-2.5 z-20">
          <Badge variant="episode" className="bg-black/85 backdrop-blur-sm border border-white/5 font-bold px-2 py-0.5 rounded text-[10px]">
            Ch {manga.chapterCount}
          </Badge>
        </div>

        {/* Hover Center Read Button Overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center z-10">
          <button
            onClick={handleQuickRead}
            className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary-light hover:scale-110 active:scale-95 transition-all shadow-glow-lg transform scale-75 group-hover:scale-100 duration-250"
            aria-label="Baca sekarang"
          >
            <BookOpen className="w-5.5 h-5.5 text-black" />
          </button>
        </div>
      </div>

      {/* Metadata Row (YouTube layout: avatar left, text right) */}
      <div className="flex gap-3 mt-3 items-start px-0.5">
        
        {/* Left: Author Avatar representing the Channel */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bg-elevated to-bg-surface border border-border/80 flex items-center justify-center shrink-0 font-heading text-xs font-black text-primary group-hover:border-primary/50 group-hover:text-primary-light transition-all shadow-sm">
          {manga.author.charAt(0)}
        </div>

        {/* Right: Title, Author Channel name, Stats */}
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <h4 className="text-sm font-bold font-sans text-text-primary group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-snug">
            {manga.title}
          </h4>
          
          {/* Author Name (YouTube Channel title) with Verified Checkmark */}
          <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary hover:text-text-primary transition-colors truncate">
            <span>{manga.author}</span>
            <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          {/* Stats & Type (YouTube view count & time) */}
          <div className="mt-1 flex items-center flex-wrap gap-1 text-[11px] text-muted font-medium">
            <span className="font-mono text-[10px] uppercase text-primary-light">{manga.type}</span>
            <span className="text-border/60">•</span>
            <span>★ {manga.rating.toFixed(1)}</span>
            <span className="text-border/60">•</span>
            <span>{manga.releaseDate}</span>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default MangaCard;
