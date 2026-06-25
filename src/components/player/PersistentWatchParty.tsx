import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WatchPartyRoom } from '../../pages/WatchPartyRoom';
import { useWatchPartyStore } from '../../stores/useWatchPartyStore';

export const PersistentWatchParty: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isConnected, disconnect } = useWatchPartyStore();

  // Keep track of the last code so we know if we should render WatchPartyRoom
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // Parse code from URL if we are on the watch party page
  const match = location.pathname.match(/^\/watch-party\/([a-zA-Z0-9]+)$/);
  const urlCode = match ? match[1] : null;

  useEffect(() => {
    // If we land on a watch party page, save the code
    if (urlCode) {
      setActiveCode(urlCode);
    } else if (!session && !isConnected) {
      // If we are not on the page and have no active session, clear the code
      setActiveCode(null);
    }
  }, [urlCode, session, isConnected]);

  // Handle force exit (e.g. kicked or room ended)
  useEffect(() => {
    const handleExit = () => {
      setActiveCode(null);
      if (location.pathname.match(/^\/watch-party\/([a-zA-Z0-9]+)$/)) {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('WATCH_PARTY_EXIT', handleExit as EventListener);
    return () => window.removeEventListener('WATCH_PARTY_EXIT', handleExit as EventListener);
  }, [location.pathname, navigate]);

  // Determine rendering mode
  const isMiniMode = !urlCode; // If URL doesn't match watch party, we are in mini mode

  if (!activeCode) {
    return null;
  }

  return (
    <div 
      className={
        isMiniMode 
          ? "fixed bottom-24 right-6 w-80 sm:w-96 aspect-[16/9] z-50 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-fade-in pointer-events-auto" 
          : "contents"
      }
    >
      <WatchPartyRoom forceCode={activeCode} isMiniMode={isMiniMode} />
    </div>
  );
};
