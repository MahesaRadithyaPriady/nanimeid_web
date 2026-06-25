import React, { useState } from 'react';

interface UserAvatarProps {
  /** Full URL of the profile picture (from Google, etc.) */
  src?: string | null;
  /** User's display name — used to generate initials as fallback */
  name?: string;
  /** Extra Tailwind classes (sizing, rounding, border, etc.) */
  className?: string;
}

const resolveSrc = (src?: string | null) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
  const apiHost = baseUrl.replace(/\/v?\d+\.\d+\.\d+(\/.*)?$/, '').replace(/\/v?\d+(\/.*)?$/, '');
  const cleanPath = src.startsWith('/') ? src : `/${src}`;
  return `${apiHost}${cleanPath}`;
}

/**
 * Shows a profile picture when available.
 * Falls back to a pink gradient circle with the user's initials
 * when the src is empty or the image fails to load.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name = '?', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const resolvedSrc = resolveSrc(src);

  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!resolvedSrc || imgError) {
    return (
      <div
        className={`flex items-center justify-center bg-primary text-black font-extrabold font-heading select-none ${className}`}
        aria-label={name}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      referrerPolicy="no-referrer"
      className={`object-cover ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export default UserAvatar;
