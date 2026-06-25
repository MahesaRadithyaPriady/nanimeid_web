import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { AnimePage } from './pages/AnimePage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventsPage } from './pages/EventsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AnimeDetailPage } from './pages/AnimeDetailPage';
import { WatchPage } from './pages/WatchPage';
import { GlobalChatPage } from './pages/GlobalChatPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { WatchPartyLobby } from './pages/WatchPartyLobby';
import { WatchPartyRoom } from './pages/WatchPartyRoom';
import { GenresPage } from './pages/GenresPage';
import { CatalogPage } from './pages/CatalogPage';
import { SchedulePage } from './pages/SchedulePage';
import { WaifuVotePage } from './pages/WaifuVotePage';
import { StorePage } from './pages/StorePage';
import { VipCatalogPage } from './pages/VipCatalogPage';
import { CollectionPage } from './pages/CollectionPage';
import { useAppStore } from './stores/useAppStore';
import { GlobalMiniPlayer } from './components/player/GlobalMiniPlayer';
import { AppPromoBanner } from './components/AppPromoBanner';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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
  const { theme, fetchMyProfileData, isLoggedIn } = useAppStore();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isLoggedIn && navigator.onLine) {
      fetchMyProfileData();
    }
  }, [isLoggedIn, fetchMyProfileData]);

  return (
    <Router>
      <ScrollToTop />
      <GlobalMiniPlayer />
      <AppPromoBanner />
      <OfflineInterceptor>
        <Routes>
          {/* Auth pages — no layout shell */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main layout shell — accessible by guests */}
        <Route path="/" element={<PageLayout />}>
          {/* ── Public routes (guest + logged-in) ── */}
          <Route index element={<HomePage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="waifu-vote" element={<WaifuVotePage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="vip" element={<VipCatalogPage />} />
          <Route path="anime" element={<AnimePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="anime/:id" element={<AnimeDetailPage />} />
          <Route path="watch/:id/ep/:episodeNumber" element={<WatchPage />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
          <Route path="global-chat" element={<GlobalChatPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="watch-party" element={<WatchPartyLobby />} />
          <Route path="watch-party/:code" element={null} />

          {/* ── Protected routes — require login ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="collection" element={<CollectionPage />} />
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
