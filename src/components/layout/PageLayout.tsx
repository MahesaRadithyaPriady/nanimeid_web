import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useAppStore } from '../../stores/useAppStore';

import { PersistentWatchParty } from '../player/PersistentWatchParty';

export const PageLayout: React.FC = () => {
  const { sidebarExpanded } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col overflow-x-hidden w-full">
      {/* Top sticky header */}
      <Topbar />

      <div className="flex flex-1 pt-[116px] sm:pt-[132px] pb-16 lg:pb-0">
        {/* Collapsible/Drawer Sidebar */}
        <Sidebar />

        {/* Dynamic content viewport */}
        <main 
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 transition-all duration-200 relative ${
            sidebarExpanded ? 'lg:pl-[256px]' : 'lg:pl-[88px]'
          }`}
        >
          <PersistentWatchParty />
          <Outlet />
        </main>
      </div>

      {/* Sticky footer for mobile devices */}
      <BottomNav />

      {/* Floating alerts and notifications */}
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
};
export default PageLayout;
