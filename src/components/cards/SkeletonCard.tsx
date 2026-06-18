import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col w-full animate-pulse">
      {/* Poster skeleton */}
      <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-bg-elevated animate-shimmer" />
      
      {/* Title skeleton */}
      <div className="mt-3 px-0.5 space-y-2">
        <div className="h-4 bg-bg-elevated rounded-lg w-4/5 animate-shimmer" />
        <div className="h-3 bg-bg-elevated rounded-lg w-3/5 animate-shimmer" />
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
};

export default SkeletonCard;
