import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

/**
 * Global auth gate — wraps ALL routes except /login.
 *
 * Rules:
 * 1. Not logged in → redirect to /login
 * 2. Offline + previously logged in → only allow /downloads and /watch, redirect others to /downloads
 * 3. Online + logged in → allow everything
 */
export const AuthGate: React.FC = () => {
  const { isLoggedIn } = useAppStore();
  const location = useLocation();

  // Not logged in at all → welcome page
  if (!isLoggedIn) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Offline + logged in → only downloads & watch pages
  if (!navigator.onLine) {
    const isOfflineAllowed =
      location.pathname.startsWith('/downloads') ||
      location.pathname.startsWith('/watch');

    if (!isOfflineAllowed) {
      return <Navigate to="/downloads" replace />;
    }
  }

  return <Outlet />;
};

export default AuthGate;
