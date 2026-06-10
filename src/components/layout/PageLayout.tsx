import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { useAppStore } from '../../stores/useAppStore';

export const PageLayout: React.FC = () => {
  const { sidebarExpanded } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Top sticky header */}
      <Topbar />

      <div className="flex flex-1 pt-14 pb-16 lg:pb-0">
        {/* Collapsible/Drawer Sidebar */}
        <Sidebar />

        {/* Dynamic content viewport */}
        <main 
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 transition-all duration-200 ${
            sidebarExpanded ? 'lg:pl-[256px]' : 'lg:pl-[88px]'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Sticky footer for mobile devices */}
      <BottomNav />

      {/* Floating alerts and notifications */}
      <ToastContainer />
    </div>
  );
};
export default PageLayout;
