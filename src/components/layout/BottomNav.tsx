import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { icon: <Home className="w-5.5 h-5.5" />, label: 'Beranda', path: '/' },
    { icon: <Compass className="w-5.5 h-5.5" />, label: 'Jelajahi', path: '/browse' },
    { icon: <Bookmark className="w-5.5 h-5.5" />, label: 'Tersimpan', path: '/bookmarks' },
    { icon: <User className="w-5.5 h-5.5" />, label: 'Profil', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-bg-sidebar/95 border-t border-border/40 backdrop-blur-md flex lg:hidden items-center justify-around px-2 select-none shadow-lg">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
              isActive 
                ? 'text-primary scale-105 font-semibold' 
                : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
          <div className="shrink-0">{item.icon}</div>
          <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
export default BottomNav;
