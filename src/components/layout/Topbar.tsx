import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, X, History, Film, BookOpen, LogOut, User, Mic, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { UserAvatar } from '../ui/UserAvatar';
import { MOCK_MANGAS } from '../../constants/mockData';
import { fetchLiveSearch } from '../../lib/animeApi';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toggleSidebar, userProfile, addToast, isLoggedIn, logout } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Mobile search overlay state (YouTube-style: tap search icon → fullscreen search)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Mock Search History
  const [history, setHistory] = useState<string[]>(['Naruto', 'Solo Leveling', 'Frieren']);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic search suggestions
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; slug: string; type: 'anime' | 'manga' }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

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

        const q = searchQuery.toLowerCase();
        const matchedMangas = MOCK_MANGAS.filter(m => m.title.toLowerCase().includes(q))
          .map(m => ({
            id: m.id,
            title: m.title,
            slug: m.slug,
            type: 'manga' as const
          }));

        setSuggestions([...matchedAnimes, ...matchedMangas].slice(0, 5));
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

    // Add to history
    if (!history.includes(searchQuery.trim())) {
      setHistory(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
    }

    setIsFocused(false);
    setMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleHistoryDelete = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h !== item));
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
                to={item.type === 'anime' ? `/anime/${item.slug}` : `/manga/${item.slug}`}
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
        className={`fixed top-0 left-0 right-0 z-40 bg-bg-base/95 backdrop-blur-md transition-all duration-200 flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 ${
          scrolled ? 'border-b border-border shadow-md shadow-black/10' : 'border-b border-border/40'
        }`}
      >
        {/* ═════ Left Area: Hamburger (desktop only) + Logo ═════ */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleMenuClick}
            className="hidden lg:flex p-1.5 hover:bg-bg-surface hover:text-primary rounded-lg text-text-primary transition-colors focus:outline-none items-center justify-center"
            aria-label="Toggle navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group focus:outline-none shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-7 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            {/* Full text on all screens */}
            <span className="inline font-heading font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-primary bg-clip-text text-transparent group-hover:text-primary transition-all duration-200">
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
                  placeholder="Cari anime, manga, komik..."
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

          {/* Voice Search (Desktop only) */}
          <button
            type="button"
            onClick={() => addToast('info', 'Pencarian suara dinonaktifkan dalam mode demonstrasi.')}
            className="w-10 h-10 rounded-full bg-bg-surface hover:bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-primary hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 focus:outline-none"
            aria-label="Cari dengan suara"
          >
            <Mic className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ═════ Right Area: Actions + Profile ═════ */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Mobile Search Button (visible only on mobile) */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
            aria-label="Cari"
          >
            <Search className="w-5 h-5" />
          </button>

          {isLoggedIn ? (
            <>
              {/* Notification Icon */}
              <button
                onClick={() => addToast('info', 'Anda tidak memiliki notifikasi baru.')}
                className="relative p-2 text-text-primary hover:bg-bg-surface hover:text-primary rounded-lg transition-all focus:outline-none"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow" />
              </button>

              {/* User Profile Avatar with dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center rounded-full border border-border hover:border-primary overflow-hidden focus:outline-none transition-all active:scale-95"
                  aria-label="Menu profil"
                >
                  <UserAvatar
                    src={userProfile.avatarUrl}
                    name={userProfile.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold"
                  />
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
                      to="/bookmarks"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary transition-colors"
                    >
                      <Bell className="w-4 h-4 text-muted" />
                      <span>Simpanan</span>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-xs sm:text-sm hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-glow focus:outline-none whitespace-nowrap"
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
        <div className="fixed inset-0 z-50 bg-bg-base md:hidden animate-fade-in">
          {/* Top bar with back arrow + search input */}
          <div className="flex items-center gap-2 px-3 h-14 border-b border-border/40">
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
                  placeholder="Cari anime, manga, komik..."
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
          <div className="overflow-y-auto h-[calc(100vh-56px)] bg-bg-base text-left">
            {renderSuggestionDropdown()}

            {/* Empty prompt */}
            {!searchQuery.trim() && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Search className="w-10 h-10 text-muted/30 mb-4" />
                <p className="text-sm text-muted">Cari anime, manga, atau komik favorit kamu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
