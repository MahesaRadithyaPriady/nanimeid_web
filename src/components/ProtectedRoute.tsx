import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

/**
 * Wraps routes that require authentication.
 * Unauthenticated users are redirected to /login, and after
 * successful login they are sent back to the page they originally requested.
 */
export const ProtectedRoute: React.FC = () => {
  const { isLoggedIn } = useAppStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
