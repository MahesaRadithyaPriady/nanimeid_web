import React, { useState } from 'react';

interface UserAvatarProps {
  /** Full URL of the profile picture (from Google, etc.) */
  src: string;
  /** User's display name — used to generate initials as fallback */
  name: string;
  /** Extra Tailwind classes (sizing, rounding, border, etc.) */
  className?: string;
}

/**
 * Shows a profile picture when available.
 * Falls back to a pink gradient circle with the user's initials
 * when the src is empty or the image fails to load.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src || imgError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary to-primary-light text-black font-extrabold font-heading select-none ${className}`}
        aria-label={name}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      className={`object-cover ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export default UserAvatar;
