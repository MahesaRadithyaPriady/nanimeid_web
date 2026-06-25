import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Compass, Store, Download, Menu as MenuIcon, X,
  MessageCircle, Users, Crown, Tv, BookOpen, BookA, Sparkles,
  Heart, Gift, Trophy, Gem, Calendar, Settings, User, Bookmark
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [showMore, setShowMore] = useState(false);

  const primaryItems = [
    { icon: <Home className="w-5.5 h-5.5" />, label: 'Beranda', path: '/' },
    { icon: <Compass className="w-5.5 h-5.5" />, label: 'Jelajahi', path: '/browse' },
    { icon: <Store className="w-5.5 h-5.5 text-yellow-500" />, label: 'Toko', path: '/store' },
    { icon: <Download className="w-5.5 h-5.5" />, label: 'Unduhan', path: '/downloads' },
  ];

  const moreGroups = [
    {
      label: 'Utama',
      items: [
        { icon: <MessageCircle className="w-5 h-5 text-blue-400" />, label: 'Global Chat', path: '/global-chat' },
        { icon: <Users className="w-5 h-5 text-green-400" />, label: 'Nobar', path: '/watch-party' },
        { icon: <Crown className="w-5 h-5 text-yellow-400" />, label: 'Langganan VIP', path: '/vip' },
        { icon: <User className="w-5 h-5 text-purple-400" />, label: 'Profil', path: '/profile' },
      ],
    },
    {
      label: 'Konten',
      items: [
        { icon: <Tv className="w-5 h-5 text-pink-400" />, label: 'Anime Terbaru', path: '/anime' },
        { icon: <BookA className="w-5 h-5 text-cyan-400" />, label: 'Katalog A-Z', path: '/catalog' },
        { icon: <Sparkles className="w-5 h-5 text-violet-400" />, label: 'Semua Genre', path: '/genres' },
      ],
    },
    {
      label: 'Perpustakaan',
      items: [
        { icon: <Bookmark className="w-5 h-5 text-orange-400" />, label: 'Favorit', path: '/favorites' },
        { icon: <Gift className="w-5 h-5 text-purple-400" />, label: 'Misi & Event', path: '/events' },
        { icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'Vote Waifu', path: '/waifu-vote' },
        { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: 'Leaderboard XP', path: '/leaderboard' },
        { icon: <Gem className="w-5 h-5 text-emerald-400" />, label: 'Leaderboard Koleksi', path: '/leaderboard?tab=collection' },
      ],
    },
    {
      label: 'Lainnya',
      items: [
        { icon: <Calendar className="w-5 h-5 text-sky-400" />, label: 'Jadwal Rilis', path: '/schedule' },
        { icon: <Settings className="w-5 h-5 text-gray-400" />, label: 'Pengaturan', path: '/profile' },
      ],
    },
  ];

  return (
    <>
      {/* Dim Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* "More" Menu Popup */}
      <div className={`fixed bottom-16 left-0 right-0 bg-bg-elevated border-t border-border/50 rounded-t-3xl z-30 lg:hidden transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto ${showMore ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-4 pb-8">
          {/* Handle bar */}
          <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <h3 className="text-text-primary font-bold mb-5 px-1 flex justify-between items-center">
            Menu Lengkap
            <button onClick={() => setShowMore(false)} className="p-1.5 hover:bg-bg-surface rounded-full transition-colors">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </h3>

          {/* Grouped items */}
          <div className="space-y-5">
            {moreGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-1 mb-2">{group.label}</p>
                <div className="grid grid-cols-4 gap-y-3 gap-x-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                          isActive ? 'bg-primary/10' : 'hover:bg-bg-surface'
                        }`
                      }
                    >
                      <div className="w-11 h-11 rounded-full bg-bg-surface border border-border/50 flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight text-text-secondary">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-bg-sidebar/95 border-t border-border/40 backdrop-blur-md flex lg:hidden items-center justify-around px-2 select-none">
        {primaryItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive
                  ? 'text-primary scale-105 font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="text-[10px] font-medium tracking-wide truncate w-full text-center">{item.label}</span>
          </NavLink>
        ))}

        {/* Toggle "More" Button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            showMore ? 'text-primary scale-105 font-semibold' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="shrink-0"><MenuIcon className="w-5.5 h-5.5" /></div>
          <span className="text-[10px] font-medium tracking-wide truncate w-full text-center">Lainnya</span>
        </button>
      </nav>
    </>
  );
};
export default BottomNav;
