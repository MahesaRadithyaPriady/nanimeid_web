import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Episode } from '../../types';
import { Badge } from '../ui/Badge';

interface EpisodeCardProps {
  episode: Episode;
  animeSlug: string;
  progress?: number; // percentage from 0 to 1
  isActive?: boolean;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  animeSlug,
  progress = 0,
  isActive = false
}) => {
  return (
    <Link
      to={`/watch/${animeSlug}/ep/${episode.episodeNumber}`}
      className={`group flex items-center gap-3 p-2 rounded-lg transition-colors focus:outline-none ${
        isActive 
          ? 'bg-bg-elevated border-l-2 border-primary' 
          : 'hover:bg-bg-surface border-l-2 border-transparent'
      }`}
    >
      {/* Thumbnail 16:9 */}
      <div className="relative w-28 sm:w-36 aspect-[16/9] bg-bg-surface rounded-md overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />
        <img
          src={episode.thumbnailUrl}
          alt={`Episode ${episode.episodeNumber}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onLoad={(e) => {
            (e.currentTarget.previousSibling as HTMLElement)?.remove();
          }}
        />

        {/* Play Icon Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 fill-white text-white" />
        </div>

        {/* Duration Overlay */}
        <span className="absolute bottom-1 right-1 px-1 bg-black/80 rounded text-[9px] font-mono text-white">
          {episode.duration}
        </span>

        {/* Episode Number Indicator */}
        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-deep text-white font-mono text-[9px] font-bold rounded">
          EP {episode.episodeNumber}
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
          {episode.title}
        </h5>
        
        <div className="mt-1 flex items-center gap-2">
          {episode.subAvailable && (
            <Badge variant="type" className="px-1 py-0 text-[9px] font-bold bg-bg-surface text-green-400 border-none">
              SUB
            </Badge>
          )}
          {episode.dubAvailable && (
            <Badge variant="type" className="px-1 py-0 text-[9px] font-bold bg-bg-surface text-primary-light border-none">
              DUB
            </Badge>
          )}
          <span className="text-[11px] text-text-secondary font-mono">{episode.duration}</span>
        </div>
      </div>
    </Link>
  );
};
export default EpisodeCard;
