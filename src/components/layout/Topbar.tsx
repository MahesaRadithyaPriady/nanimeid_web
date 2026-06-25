import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, X, History, Film, BookOpen, LogOut, User, ArrowLeft, Loader2, Heart, Gift, Trophy, Download, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { UserAvatar } from '../ui/UserAvatar';
import { resolveSrc } from '../../lib/utils';
import { fetchLiveSearch } from '../../lib/animeApi';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toggleSidebar, userProfile, addToast, isLoggedIn, logout, theme, toggleTheme } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Mobile search overlay state (YouTube-style: tap search icon → fullscreen search)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Real Search History
  const [history, setHistory] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic search suggestions
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; slug: string; type: 'anime' }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load search history from API
  useEffect(() => {
    let active = true;
    if (isLoggedIn) {
      import('../../lib/animeApi').then(({ fetchSearchHistory }) => {
        fetchSearchHistory({ limit: 10 }).then(res => {
          if (active && res.data && res.data.items) {
            setHistory(res.data.items.map((i: any) => i.query));
          }
        }).catch(err => console.error("Failed to fetch history", err));
      });
    } else {
      setHistory([]);
    }
    return () => { active = false; };
  }, [isLoggedIn, isFocused]);

  // Debounced search suggestions fetching from backend
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const animeRes = await fetchLiveSearch(searchQuery, { limit: 5 });
        if (!active) return;

        const matchedAnimes = (animeRes.data ?? []).map(a => ({
          id: String(a.id),
          title: a.nama_anime,
          slug: String(a.id),
          type: 'anime' as const
        }));

        setSuggestions([...matchedAnimes].slice(0, 5));
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        if (active) setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Sync with search param 'q'
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Handle Scroll to shrink header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Click Outside Dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Add to API history if logged in
    if (isLoggedIn) {
      import('../../lib/animeApi').then(({ addSearchHistory }) => {
        addSearchHistory(searchQuery.trim()).catch(err => console.error("Failed to add history", err));
      });
    }

    if (!history.includes(searchQuery.trim())) {
      setHistory(prev => [searchQuery.trim(), ...prev].slice(0, 10));
    }

    setIsFocused(false);
    setMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleHistoryDelete = async (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic UI update
    setHistory(prev => prev.filter(h => h !== item));
    
    if (isLoggedIn) {
      try {
        const { fetchSearchHistory, deleteSearchHistory } = await import('../../lib/animeApi');
        // Need to find ID of the item
        const res = await fetchSearchHistory({ limit: 50 });
        const historyItem = res.data.items.find((i: any) => i.query === item);
        if (historyItem) {
          await deleteSearchHistory(historyItem.id);
        }
      } catch (err) {
        console.error("Failed to delete history item", err);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setIsFocused(false);
    setSearchQuery('');
  };

  // Handle hamburger — desktop sidebar toggle only (no sidebar on mobile)
  const handleMenuClick = () => {
    toggleSidebar();
  };



  // Shared suggestion dropdown content (used in both desktop and mobile)
  const renderSuggestionDropdown = () => (
    <>
      {/* History Suggestions (Show when query is empty) */}
      {!searchQuery.trim() && history.length > 0 && (
        <div className="p-2 border-b border-border/50">
          <span className="px-3 py-1.5 text-[10px] font-bold font-heading text-muted uppercase tracking-wider block">
            Pencarian Terakhir
          </span>
          {history.map((item) => (
            <div
              key={item}
              onClick={() => {
                setSearchQuery(item);
                setIsFocused(false);
                setMobileSearchOpen(false);
                navigate(`/search?q=${encodeURIComponent(item)}`);
              }}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-bg-surface rounded-lg cursor-pointer transition-colors text-sm text-text-primary"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-muted shrink-0" />
                <span>{item}</span>
              </div>
              <button
                onClick={(e) => handleHistoryDelete(e, item)}
                className="p-1 hover:bg-bg-elevated rounded-md text-muted hover:text-red-400 transition-colors focus:outline-none"
                aria-label="Hapus riwayat"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Autocomplete suggestions */}
      {searchQuery.trim() && (
        <div className="p-2">
          <span className="px-3 py-1.5 text-[10px] font-bold font-heading text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Hasil Terkait</span>
            {isLoadingSuggestions && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
          </span>
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <Link
                key={item.id}
                to={`/anime/${item.slug}`}
                onClick={() => { setIsFocused(false); setMobileSearchOpen(false); }}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-bg-surface rounded-lg cursor-pointer transition-colors text-sm text-text-primary"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.type === 'anime' ? (
                    <Film className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-primary-light shrink-0" />
                  )}
                  <span className="truncate">{item.title}</span>
                </div>
                <span className="text-[10px] font-mono font-medium uppercase px-2 py-0.5 bg-bg-surface border border-border text-muted rounded shrink-0 ml-2">
                  {item.type}
                </span>
              </Link>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted">
              Tidak ada hasil untuk "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <header 
        className={`fixed top-[68px] sm:top-[76px] left-0 right-0 z-40 bg-bg-base/95 backdrop-blur-md transition-all duration-200 flex items-center justify-between px-2.5 sm:px-4 md:px-6 h-12 sm:h-14 ${
          scrolled ? 'border-b border-border shadow-md shadow-black/10' : 'border-b border-border/40'
        }`}
      >
        {/* ═════ Left Area: Hamburger (desktop only) + Logo ═════ */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={handleMenuClick}
            className="hidden lg:flex p-1.5 hover:bg-bg-surface hover:text-primary rounded-lg text-text-primary transition-colors focus:outline-none items-center justify-center"
            aria-label="Toggle navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-1 sm:gap-2 group focus:outline-none shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-5 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            {/* Full text on all screens */}
            <span className="inline font-heading font-black text-base sm:text-lg md:text-xl tracking-tight text-text-primary group-hover:text-primary transition-colors duration-200">
              NANIME<span className="text-primary group-hover:text-primary-light transition-colors">ID</span>
            </span>
          </Link>
        </div>

        {/* ═════ Middle Area: Desktop Search Bar (hidden on mobile) ═════ */}
        <div className="hidden md:flex flex-1 max-w-[600px] mx-4 lg:mx-8 items-center gap-3">
          <div className="relative flex-1" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              
              {/* Input Wrapper */}
              <div className="relative flex-1 flex items-center bg-bg-surface border border-border/80 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 rounded-l-full overflow-hidden transition-all duration-200">
                
                {/* Left Search Icon (Shown when focused) */}
                {isFocused && (
                  <Search className="absolute left-4 w-4 h-4 text-muted pointer-events-none animate-fade-in" />
                )}

                <input
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  className={`w-full h-10 pr-10 bg-transparent text-sm text-text-primary placeholder:text-muted transition-all focus:outline-none ${
                    isFocused ? 'pl-11' : 'pl-5'
                  }`}
                />

                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 p-1 hover:bg-bg-surface text-muted hover:text-text-primary rounded-full transition-colors focus:outline-none"
                    aria-label="Hapus teks"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Submit Button */}
              <button
                type="submit"
                className="h-10 px-5 lg:px-6 bg-bg-elevated hover:bg-bg-surface border border-l-0 border-border/80 rounded-r-full flex items-center justify-center text-text-secondary hover:text-primary transition-colors cursor-pointer focus:outline-none"
                aria-label="Cari"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </form>

            {/* Desktop Suggestion Dropdown */}
            {isFocused && (
              <div className="absolute top-12 left-0 right-0 bg-bg-elevated border border-border/80 rounded-2xl shadow-glow-lg overflow-hidden z-50 text-left animate-fade-in">
                {renderSuggestionDropdown()}
              </div>
            )}
          </div>
        </div>

        {/* ═════ Right Area: Actions + Profile ═════ */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          
          {/* Mobile Search Button (visible only on mobile) */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-1.5 sm:p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
            aria-label="Cari"
          >
            <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          {/* Quick Access Downloads Icon */}
          <Link
            to="/downloads"
            className="hidden sm:block p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none shrink-0"
            aria-label="Unduhan Saya"
            title="Unduhan Saya"
          >
            <Download className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </Link>

          {isLoggedIn ? (
            <>
              {/* Coin Balance */}
              <Link
                to="/store"
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 mr-0 sm:mr-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-full transition-all focus:outline-none shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Saldo Koin"
                title="Topup Koin"
              >
                <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-[8px] sm:text-[11px] font-black font-heading text-white tracking-tighter -ml-0.5">C</span>
                </div>
                <span className="font-bold text-[10px] sm:text-sm text-yellow-600 dark:text-yellow-500">{(userProfile.coins || 0).toLocaleString('id-ID')}</span>
              </Link>

              {/* Events Icon */}
              <Link
                to="/events"
                className="hidden sm:block p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
                aria-label="Misi & Event"
              >
                <Gift className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </Link>

              {/* Theme Toggle Icon */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
                aria-label="Toggle Tema"
                title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                ) : (
                  <Moon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                )}
              </button>

              {/* Notification Icon */}
              <button
                onClick={() => addToast('info', 'Anda tidak memiliki notifikasi baru.')}
                className="relative p-1.5 sm:p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
                aria-label="Notifikasi"
              >
                <Bell className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                {/* Temporary: set to true when notification system is implemented */}
                {false && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow" />
                )}
              </button>

              {/* User Profile Avatar with border support */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="relative flex items-center focus:outline-none transition-all active:scale-95"
                  aria-label="Menu profil"
                >
                  <div className="relative w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center">
                    {/* Avatar — shrinks when border active */}
                    <div className={`rounded-full overflow-hidden flex items-center justify-center ${userProfile.avatarBorderActive ? 'w-[70%] h-[70%]' : 'w-full h-full border border-border hover:border-primary transition-all'}`}>
                      <UserAvatar
                        src={userProfile.avatarUrl}
                        name={userProfile.name}
                        className="w-full h-full rounded-full text-xs font-bold"
                      />
                    </div>
                    {/* Border image overlay */}
                    {userProfile.avatarBorderActive && (
                      <img
                        src={resolveSrc(userProfile.avatarBorderActive.image_url)}
                        alt="border"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                      />
                    )}
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-11 w-48 bg-bg-elevated border border-border/80 rounded-2xl shadow-glow-lg py-2 overflow-hidden z-50 text-left animate-scale-up">
                    <div className="px-4 py-2 border-b border-border/50">
                      <p className="text-sm font-semibold text-text-primary truncate">{userProfile.name}</p>
                      <p className="text-xs text-muted truncate">{userProfile.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <User className="w-4 h-4 text-muted" />
                      <span>Profil saya</span>
                    </Link>

                    <Link
                      to="/downloads"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <Download className="w-4 h-4 text-muted" />
                      <span>Unduhan saya</span>
                    </Link>
                    
                    <Link
                      to="/favorites"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4 text-muted" />
                      <span>Favorit</span>
                    </Link>
                    
                    <Link
                      to="/events"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <Gift className="w-4 h-4 text-muted" />
                      <span>Misi & Event</span>
                    </Link>
                    
                    <Link
                      to="/leaderboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <Trophy className="w-4 h-4 text-muted" />
                      <span>Leaderboard</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface hover:text-red-400 text-sm text-text-primary text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-muted" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ─── Login button (unauthenticated) ─── */
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-primary text-black font-semibold text-xs sm:text-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm focus:outline-none whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </header>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SEARCH OVERLAY — Full-screen search (YouTube mobile-style) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[110] bg-bg-base md:hidden animate-fade-in">
          {/* Top bar with back arrow + search input */}
          <div className="flex items-center gap-2 px-3 h-12 sm:h-14 border-b border-border/40">
            <button
              onClick={closeMobileSearch}
              className="p-2 text-text-primary hover:bg-bg-surface rounded-lg transition-colors focus:outline-none shrink-0"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
              <div className="relative flex-1">
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 bg-bg-surface border border-border/60 focus:border-primary rounded-full text-sm text-text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text-primary rounded-full transition-colors focus:outline-none"
                    aria-label="Hapus teks"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="ml-2 w-10 h-10 rounded-full bg-bg-elevated hover:bg-bg-surface flex items-center justify-center text-text-secondary hover:text-primary transition-colors shrink-0 focus:outline-none"
                aria-label="Cari"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

          {/* Suggestions area (scrollable full screen) */}
          <div className="overflow-y-auto h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] bg-bg-base text-left">
            {renderSuggestionDropdown()}

            {/* Empty prompt */}
            {!searchQuery.trim() && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Search className="w-10 h-10 text-muted/30 mb-4" />
                <p className="text-sm text-muted">Cari anime favorit kamu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
