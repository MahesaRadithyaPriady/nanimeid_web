import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'genre' | 'ongoing' | 'completed' | 'upcoming' | 'type' | 'episode' | 'rating';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'type',
  className
}) => {
  const baseStyles = "inline-flex items-center font-mono font-medium text-xs rounded-full transition-colors duration-150 whitespace-nowrap";
  
  const variants = {
    genre: "bg-primary/10 text-primary-light border border-primary/20 px-3 py-0.5",
    ongoing: "bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5",
    completed: "bg-muted/15 text-muted border border-muted/20 px-2 py-0.5",
    upcoming: "bg-primary-deep/15 text-primary-light border border-primary-deep/20 px-2 py-0.5",
    type: "bg-bg-elevated text-text-primary px-2.5 py-0.5 border border-border",
    episode: "bg-black/75 text-white backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px]",
    rating: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5"
  };

  return (
    <span
      className={twMerge(
        clsx(baseStyles, variants[variant], className)
      )}
    >
      {children}
    </span>
  );
};
export default Badge;
