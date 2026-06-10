import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
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
        {/* Main layout shell for all pages */}
        <Route path="/" element={<PageLayout />}>
          <Route index element={<HomePage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="anime" element={<AnimePage />} />
          <Route path="manga" element={<MangaPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Detail & Video Watch */}
          <Route path="anime/:slug" element={<AnimeDetailPage />} />
          <Route path="watch/:slug/ep/:episodeNumber" element={<WatchPage />} />
          
          {/* Manga details & reader */}
          <Route path="manga/:slug" element={<MangaReaderPage />} />
          <Route path="read/:slug/ch/:chapterNumber" element={<MangaReaderPage />} />
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
