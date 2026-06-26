import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { resolveSrc } from '../../lib/utils';

interface BorderImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Resolves and renders avatar border images with CDN fallback.
 * - Shows "Border tidak tersedia" placeholder immediately
 * - Validates image via background fetch before rendering
 * - Falls back to normalized CDN path if original fails
 * - User never sees a broken/blank image
 */
export const BorderImage: React.FC<BorderImageProps> = ({ src, alt = 'border', className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [attempt, setAttempt] = useState(0);

  const resolved = src ? resolveSrc(src) : '';
  const fallbackSrc = resolved.replace(
    '/file/NanimeID-Storage/',
    '/file/storage-nanimeid/'
  );

  const currentSrc = attempt >= 1 ? fallbackSrc : resolved;

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setStatus('checking');

    const validate = async () => {
      const url = attempt >= 1 ? fallbackSrc : resolved;
      try {
        // Load image in background to verify it's a real image
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';
          img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
          img.onerror = () => resolve(false);
          img.src = url;
        });

        if (cancelled) return;

        if (ok) {
          setStatus('valid');
        } else if (attempt === 0) {
          // Try fallback URL
          setAttempt(1);
        } else {
          setStatus('invalid');
        }
      } catch {
        if (cancelled) return;
        if (attempt === 0) {
          setAttempt(1);
        } else {
          setStatus('invalid');
        }
      }
    };

    validate();

    return () => { cancelled = true; };
  }, [src, attempt]);

  if (!src) return null;

  // Show placeholder while checking or when invalid
  if (status !== 'valid') {
    if (status === 'invalid') {
      return (
        <div className={`${className} flex items-center justify-center bg-bg-surface/50 border border-border/30`}>
          <span className="text-[8px] sm:text-[10px] text-text-muted text-center px-1 leading-tight">Border tidak tersedia</span>
        </div>
      );
    }
    // While checking: show loading spinner
    return (
      <div className={`${className} flex items-center justify-center`}>
        <Loader2 className="w-4 h-4 text-text-muted/50 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

export default BorderImage;
