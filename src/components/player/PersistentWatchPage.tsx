import React, { useEffect, useState } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { WatchPage } from '../../pages/WatchPage';
import { useAppStore } from '../../stores/useAppStore';
import { Maximize2, X } from 'lucide-react';

export const PersistentWatchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lastParams, setLastParams] = useState<{ id: string; episodeNumber: string } | null>(null);
  
  // Track if we are currently on the watch page URL
  const match = matchPath('/watch/:id/ep/:episodeNumber', location.pathname);
  const isWatchRoute = !!match;

  // Extract params safely
  const matchId = match?.params?.id;
  const matchEp = match?.params?.episodeNumber;

  // Update lastParams when we visit a watch route
  useEffect(() => {
    if (matchId && matchEp) {
      setLastParams(prev => {
        if (prev?.id === matchId && prev?.episodeNumber === matchEp) {
          return prev; // Prevent unnecessary state updates
        }
        return { id: matchId, episodeNumber: matchEp };
      });
    }
  }, [matchId, matchEp]);

  // If we never visited watch page, render nothing
  if (!lastParams) return null;

  // If we are NOT on the watch route, we are in mini-player mode
  const isMiniMode = !isWatchRoute;

  const closeMiniPlayer = () => {
    setLastParams(null);
    // Find the video element and pause it to stop audio immediately
    const video = document.querySelector('video');
    if (video) video.pause();
  };

  const expandMiniPlayer = () => {
    if (lastParams) {
      navigate(`/watch/${lastParams.id}/ep/${lastParams.episodeNumber}`);
    }
  };

  return (
    <div 
      className={isMiniMode ? "fixed bottom-6 right-6 w-[320px] sm:w-[400px] z-[9999] shadow-2xl rounded-2xl overflow-hidden bg-black border border-border/40 group/mini transition-all duration-300" : "contents"}
      style={isMiniMode ? { aspectRatio: '16/9' } : {}}
    >
      {/* Overlay controls for Mini Player */}
      {isMiniMode && (
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-end gap-2 bg-black/60 z-50 opacity-0 group-hover/mini:opacity-100 transition-opacity pointer-events-none">
          <button 
            onClick={expandMiniPlayer}
            className="p-1.5 bg-black/50 hover:bg-primary/80 hover:text-black text-white rounded-lg backdrop-blur-sm transition-all pointer-events-auto"
            title="Kembali ke Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={closeMiniPlayer}
            className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-all pointer-events-auto"
            title="Tutup Mini Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* The actual WatchPage, injected with props instead of useParams */}
      <div 
        className={isMiniMode ? "w-full h-full" : "contents"}
      >
        <WatchPage 
          forceId={lastParams.id} 
          forceEpisode={lastParams.episodeNumber} 
          isMiniMode={isMiniMode} 
        />
      </div>

    </div>
  );
};
