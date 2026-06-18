import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { AnimePage } from './pages/AnimePage';
import { MangaPage } from './pages/MangaPage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventsPage } from './pages/EventsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AnimeDetailPage } from './pages/AnimeDetailPage';
import { MangaReaderPage } from './pages/MangaReaderPage';
import { GlobalChatPage } from './pages/GlobalChatPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { WatchPartyLobby } from './pages/WatchPartyLobby';
import { WatchPartyRoom } from './pages/WatchPartyRoom';
import { useAppStore } from './stores/useAppStore';

function OfflineInterceptor({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOffline = () => {
      if (!location.pathname.includes('/downloads') && !location.pathname.includes('/watch')) {
        navigate('/downloads', { replace: true });
      }
    };

    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine && !location.pathname.includes('/downloads') && !location.pathname.includes('/watch')) {
      navigate('/downloads', { replace: true });
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
}

function App() {
  const { fetchMyProfileData, isLoggedIn } = useAppStore();

  useEffect(() => {
    if (isLoggedIn && navigator.onLine) {
      fetchMyProfileData();
    }
  }, [isLoggedIn, fetchMyProfileData]);

  return (
    <Router>
      <OfflineInterceptor>
        <Routes>
          {/* Auth pages — no layout shell */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main layout shell — accessible by guests */}
        <Route path="/" element={<PageLayout />}>
          {/* ── Public routes (guest + logged-in) ── */}
          <Route index element={<HomePage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="anime" element={<AnimePage />} />
          <Route path="manga" element={<MangaPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="anime/:id" element={<AnimeDetailPage />} />
          <Route path="watch/:id/ep/:episodeNumber" element={null} />
          <Route path="manga/:slug" element={<MangaReaderPage />} />
          <Route path="read/:slug/ch/:chapterNumber" element={<MangaReaderPage />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
          <Route path="global-chat" element={<GlobalChatPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="watch-party" element={<WatchPartyLobby />} />
          <Route path="watch-party/:code" element={<WatchPartyRoom />} />

          {/* ── Protected routes — require login ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </OfflineInterceptor>
    </Router>
  );
}

export default App;
