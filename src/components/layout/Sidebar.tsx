import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Tv, BookOpen, History, Calendar, Settings, X, ChevronRight, MessageCircle, Heart, Gift, Trophy, Download, Users } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarExpanded, toggleMobileMenu } = useAppStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    toggleMobileMenu(false);
  }, [location.pathname, toggleMobileMenu]);

  // Main Section
  const mainItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Beranda', path: '/' },
    { icon: <Compass className="w-5 h-5" />, label: 'Jelajahi', path: '/browse' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Global Chat', path: '/global-chat' },
    { icon: <Users className="w-5 h-5 text-primary" />, label: 'Nobar', path: '/watch-party' },
  ];

  // Content/Genre Section
  const contentItems = [
    { icon: <Tv className="w-5 h-5" />, label: 'Anime Terbaru', path: '/anime' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Manga / Manhwa', path: '/manga' },
  ];

  // Library Section (Anda)
  const libraryItems = [
    { icon: <Heart className="w-5 h-5" />, label: 'Favorit', path: '/favorites' },
    { icon: <History className="w-5 h-5" />, label: 'Riwayat Tonton', path: '/history' },
    { icon: <Download className="w-5 h-5 text-primary" />, label: 'Unduhan Saya', path: '/downloads' },
    { icon: <Gift className="w-5 h-5 text-primary" />, label: 'Misi & Event', path: '/events' },
    { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: 'Leaderboard', path: '/leaderboard' },
  ];

  // System/Settings Section
  const systemItems = [
    { icon: <Calendar className="w-5 h-5" />, label: 'Jadwal Rilis', path: '/schedule' },
    { icon: <Settings className="w-5 h-5" />, label: 'Pengaturan', path: '/profile' },
  ];

  // Helper to determine if menu is active
  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) {
      const [basePath, search] = path.split('?');
      return location.pathname === basePath && location.search === `?${search}`;
    }
    return location.pathname.startsWith(path);
  };

  // Render a standard sidebar item — YouTube style
  const renderNavItem = (item: { icon: React.ReactNode; label: string; path: string }) => {
    const active = isActiveRoute(item.path);
    return (
      <NavLink
        key={item.label}
        to={item.path}
        className={`
          yt-sidebar-item
          flex items-center gap-5 px-3 py-2 mx-2 rounded-[10px]
          transition-all duration-150 ease-out group focus:outline-none
          ${active 
            ? 'bg-white/10 text-text-primary font-semibold' 
            : 'text-text-primary hover:bg-white/[0.06] font-normal'
          }
        `}
      >
        <div className={`shrink-0 transition-colors duration-150 ${
          active ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
        }`}>
          {item.icon}
        </div>
        <span className="text-sm leading-5 truncate">{item.label}</span>
      </NavLink>
    );
  };

  // === Tooltip state for mini sidebar ===
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback((label: string, el: HTMLElement) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setTooltip({ label, top: rect.top + rect.height / 2 });
    }, 400);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip(null);
  }, []);

  // Render a collapsed mini item — polished YouTube mini-sidebar
  const renderMiniItem = (item: { icon: React.ReactNode; label: string; path: string }) => {
    const active = isActiveRoute(item.path);
    return (
      <NavLink
        key={item.label}
        to={item.path}
        onMouseEnter={(e) => showTooltip(item.label, e.currentTarget)}
        onMouseLeave={hideTooltip}
        className={`
          relative flex flex-col items-center justify-center
          py-[10px] mx-auto w-[56px]
          rounded-xl gap-[5px]
          transition-all duration-200 ease-out
          text-center group focus:outline-none
          hover:scale-[1.04] active:scale-[0.97]
          ${active 
            ? 'text-text-primary' 
            : 'text-text-secondary hover:text-text-primary'
          }
        `}
      >
        {/* Background pill — visible on hover and active */}
        <div className={`
          absolute inset-0 rounded-xl transition-all duration-200
          ${active 
            ? 'bg-white/[0.08] shadow-[0_0_12px_rgba(255,102,205,0.12)]' 
            : 'bg-transparent group-hover:bg-white/[0.05]'
          }
        `} />

        {/* Icon with active glow */}
        <div className={`relative shrink-0 z-10 transition-all duration-200 ${
          active 
            ? 'text-primary drop-shadow-[0_0_6px_rgba(255,102,205,0.5)]' 
            : 'text-text-secondary group-hover:text-text-primary'
        }`}>
          {item.icon}
        </div>

        {/* Active indicator bar */}
        {active && (
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-[2.5px] rounded-full bg-primary shadow-[0_0_8px_rgba(255,102,205,0.6)] animate-fade-in" />
        )}

        {/* Label */}
        <span className={`relative z-10 text-[10px] w-full truncate px-0.5 leading-tight transition-colors duration-200 ${
          active ? 'font-semibold text-text-primary' : 'font-medium'
        }`}>
          {item.label}
        </span>
      </NavLink>
    );
  };

  // Mini divider for collapsed state
  const renderMiniDivider = (key: string) => (
    <div key={key} className="w-8 mx-auto my-1.5">
      <div className="h-px bg-white/[0.07]" />
    </div>
  );

  // Section divider — YouTube style thin line
  const renderDivider = (key: string) => (
    <div key={key} className="mx-3 my-3">
      <div className="h-px bg-white/10" />
    </div>
  );

  // Section header with optional icon — YouTube "You >" style
  const renderSectionHeader = (title: string, showArrow = false) => (
    <div className="flex items-center gap-1 px-5 pt-2 pb-1">
      <h3 className="text-[15px] font-medium text-text-primary tracking-tight">{title}</h3>
      {showArrow && <ChevronRight className="w-4 h-4 text-text-primary mt-[1px]" />}
    </div>
  );

  const renderSidebarContent = () => {
    if (!sidebarExpanded) {
      // YouTube-like mini-sidebar — polished icon column
      return (
        <div className="relative flex flex-col h-full bg-bg-sidebar select-none items-center overflow-y-auto overflow-x-hidden scrollbar-pink">
          <div className="flex flex-col items-center pt-2 pb-4 w-full space-y-[2px]">
            {/* Main */}
            {mainItems.map(renderMiniItem)}
            
            {renderMiniDivider('div-1')}
            
            {/* Library */}
            {libraryItems.map(renderMiniItem)}
            
            {renderMiniDivider('div-2')}
            
            {/* Content */}
            {contentItems.map(renderMiniItem)}
            
            {renderMiniDivider('div-3')}
            
            {/* Settings */}
            {systemItems.slice(1).map(renderMiniItem)}
          </div>

          {/* Floating Tooltip */}
          {tooltip && (
            <div
              className="fixed z-[100] pointer-events-none animate-fade-in"
              style={{ top: tooltip.top, left: 80 , transform: 'translateY(-50%)' }}
            >
              <div className="bg-bg-elevated text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg shadow-black/40 border border-white/[0.08] whitespace-nowrap">
                {tooltip.label}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Full YouTube-like sidebar
    return (
      <div className="flex flex-col h-full bg-bg-sidebar select-none">
        
        {/* Mobile Header (Drawer Mode only) */}
        <div className="flex items-center justify-between px-5 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
            <span className="font-heading font-black text-lg text-primary tracking-wider">NANIMEID</span>
          </div>
          <button
            onClick={() => toggleMobileMenu(false)}
            className="p-1.5 hover:bg-white/[0.06] rounded-full text-muted hover:text-text-primary transition-colors focus:outline-none"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable navigation viewport */}
        <div className="flex-1 overflow-y-auto scrollbar-pink overscroll-contain">
          
          {/* Section 1: Main Navigation */}
          <nav className="flex flex-col py-3 space-y-[2px]">
            {mainItems.map(renderNavItem)}
          </nav>

          {renderDivider('div-1')}

          {/* Section 2: Anda (You) — YouTube "You >" style header */}
          <div className="flex flex-col pb-1">
            {renderSectionHeader('Anda', true)}
            <nav className="flex flex-col space-y-[2px] mt-1">
              {libraryItems.map(renderNavItem)}
            </nav>
          </div>

          {renderDivider('div-2')}

          {/* Section 3: Kategori (Explore) */}
          <div className="flex flex-col pb-1">
            {renderSectionHeader('Kategori')}
            <nav className="flex flex-col space-y-[2px] mt-1">
              {contentItems.map(renderNavItem)}
            </nav>
          </div>

          {renderDivider('div-3')}

          {/* Section 4: Lainnya (More) */}
          <div className="flex flex-col pb-1">
            {renderSectionHeader('Lainnya')}
            <nav className="flex flex-col space-y-[2px] mt-1">
              {systemItems.map(renderNavItem)}
            </nav>
          </div>

          {renderDivider('div-4')}

          {/* Footer area — YouTube-style links & copyright */}
          <div className="px-5 pt-1 pb-6">
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted/70 leading-relaxed">
              <span className="hover:text-text-primary cursor-pointer transition-colors">Tentang</span>
              <span className="hover:text-text-primary cursor-pointer transition-colors">Kebijakan</span>
              <span className="hover:text-text-primary cursor-pointer transition-colors">Kontak</span>
              <span className="hover:text-text-primary cursor-pointer transition-colors">Bantuan</span>
            </div>
            <p className="text-[11px] text-muted/50 mt-3 font-mono">
              &copy; 2026 NanimeID
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar only (lg+). Mobile uses BottomNav. */}
      <aside 
        className={`fixed left-0 top-14 bottom-0 z-30 hidden lg:block transition-all duration-250 ease-in-out ${
          sidebarExpanded ? 'w-60' : 'w-[72px]'
        }`}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
};

export default Sidebar;
