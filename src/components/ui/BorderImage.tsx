import React, { useState } from 'react';
import { resolveSrc } from '../../lib/utils';

interface BorderImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Resolves and renders avatar border images with CDN fallback.
 * - Adds referrerPolicy="no-referrer" (CDN may block referrer)
 * - Falls back to normalized CDN path if original fails
 */
export const BorderImage: React.FC<BorderImageProps> = ({ src, alt = 'border', className = '' }) => {
  const [errorCount, setErrorCount] = useState(0);

  if (!src) return null;

  const resolved = resolveSrc(src);

  // Fallback: normalize old CDN path NanimeID-Storage → storage-nanimeid
  const fallbackSrc = resolved.replace(
    '/file/NanimeID-Storage/',
    '/file/storage-nanimeid/'
  );

  const currentSrc = errorCount >= 1 ? fallbackSrc : resolved;

  if (errorCount >= 2) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      className={className}
      onError={() => setErrorCount(prev => prev + 1)}
    />
  );
};

export default BorderImage;
