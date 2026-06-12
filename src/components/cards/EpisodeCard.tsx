import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Episode, ApiEpisode } from '../../types';
import { Badge } from '../ui/Badge';

interface EpisodeCardProps {
  /** Legacy mock episode */
  episode?: Episode;
  /** Backend API episode */
  apiEpisode?: ApiEpisode;
  animeSlug: string;
  progress?: number; // percentage from 0 to 1
  isActive?: boolean;
}

/** Format seconds into mm:ss or hh:mm:ss */
function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  apiEpisode,
  animeSlug,
  progress = 0,
  isActive = false
}) => {
  // Normalize episode data
  const epNum = apiEpisode?.nomor_episode ?? episode?.episodeNumber ?? 0;
  const epTitle = apiEpisode?.judul_episode ?? episode?.title ?? `Episode ${epNum}`;
  const epDuration = apiEpisode ? formatDuration(apiEpisode.durasi_episode) : (episode?.duration ?? '--:--');
  const epThumb = apiEpisode?.thumbnail_episode ?? episode?.thumbnailUrl ?? '';
  const subAvailable = episode?.subAvailable ?? true; // API episodes default to sub
  const dubAvailable = episode?.dubAvailable ?? false;

  return (
    <Link
      to={`/watch/${animeSlug}/ep/${epNum}`}
      state={{ fromDetail: true }}
      className={`group flex items-center gap-3 p-2 rounded-lg transition-colors focus:outline-none ${
        isActive 
          ? 'bg-bg-elevated border-l-2 border-primary' 
          : 'hover:bg-bg-surface border-l-2 border-transparent'
      }`}
    >
      {/* Thumbnail 16:9 */}
      <div className="relative w-28 sm:w-36 aspect-[16/9] bg-bg-surface rounded-md overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />
        {epThumb ? (
          <img
            src={epThumb}
            alt={`Episode ${epNum}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onLoad={(e) => {
              (e.currentTarget.previousSibling as HTMLElement)?.remove();
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-bg-elevated flex items-center justify-center">
            <Play className="w-6 h-6 text-muted/40" />
          </div>
        )}

        {/* Play Icon Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 fill-white text-white" />
        </div>

        {/* Duration Overlay */}
        <span className="absolute bottom-1 right-1 px-1 bg-black/80 rounded text-[9px] font-mono text-white">
          {epDuration}
        </span>

        {/* Episode Number Indicator */}
        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-deep text-white font-mono text-[9px] font-bold rounded">
          EP {epNum}
        </span>

        {/* Progress Bar (if watched) */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Meta Text */}
      <div className="flex-1 min-w-0 pr-1">
        <h5 className={`text-sm font-semibold truncate leading-snug ${isActive ? 'text-primary' : 'text-text-primary group-hover:text-primary transition-colors'}`}>
          {epTitle}
        </h5>
        
        <div className="mt-1 flex items-center gap-2">
          {subAvailable && (
            <Badge variant="type" className="px-1 py-0 text-[9px] font-bold bg-bg-surface text-green-400 border-none">
              SUB
            </Badge>
          )}
          {dubAvailable && (
            <Badge variant="type" className="px-1 py-0 text-[9px] font-bold bg-bg-surface text-primary-light border-none">
              DUB
            </Badge>
          )}
          <span className="text-[11px] text-text-secondary font-mono">{epDuration}</span>
        </div>
      </div>
    </Link>
  );
};
export default EpisodeCard;
