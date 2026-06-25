import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * CollectionPage — redirect ke /profile?tab=collection
 * Konten koleksi sudah dipindahkan ke dalam tab profil.
 */
export const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate('/profile?tab=collection', { replace: true });
  }, [navigate, location.search]);

  return null;
};
