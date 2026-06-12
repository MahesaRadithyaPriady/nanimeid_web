import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { AnimePage } from './pages/AnimePage';
import { MangaPage } from './pages/MangaPage';
import { SearchPage } from './pages/SearchPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnimeDetailPage } from './pages/AnimeDetailPage';
import { WatchPage } from './pages/WatchPage';
import { MangaReaderPage } from './pages/MangaReaderPage';

function App() {
  return (
    <Router>
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
          <Route path="watch/:id/ep/:episodeNumber" element={<WatchPage />} />
          <Route path="manga/:slug" element={<MangaReaderPage />} />
          <Route path="read/:slug/ch/:chapterNumber" element={<MangaReaderPage />} />

          {/* ── Protected routes — require login ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
