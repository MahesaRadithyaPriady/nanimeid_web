import React from 'react';

/* ── Shimmer animation adalah `animate-pulse` bawaan Tailwind ── */

/* ─── Base shimmer block ──────────────────────────────────────── */
const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-bg-elevated animate-pulse rounded ${className}`} />
);

/* ─── Anime / Manga Card (portrait 2:3) ──────────────────────── */
export const SkeletonCard: React.FC = () => (
  <div className="flex flex-col w-full animate-pulse">
    <Shimmer className="w-full aspect-[2/3] rounded-2xl" />
    <div className="mt-3 px-0.5 space-y-2">
      <Shimmer className="h-3.5 w-4/5" />
      <Shimmer className="h-2.5 w-3/5" />
    </div>
  </div>
);

/* ─── Skeleton Grid (anime/manga grid) ───────────────────────── */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </>
);

/* ─── Hero Banner Skeleton ────────────────────────────────────── */
export const SkeletonHeroBanner: React.FC = () => (
  <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden animate-pulse border border-border/40">
    <Shimmer className="w-full h-full rounded-none" />
    {/* Content area at bottom */}
    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 space-y-3 max-w-2xl">
      <div className="flex gap-2">
        <Shimmer className="h-5 w-16 rounded-full" />
        <Shimmer className="h-5 w-20 rounded-full" />
      </div>
      <Shimmer className="h-8 w-3/4 rounded-lg" />
      <Shimmer className="h-4 w-1/2 rounded-lg" />
      <Shimmer className="h-3 w-2/3 rounded" />
      <Shimmer className="h-3 w-3/5 rounded" />
      <div className="flex gap-3 pt-2">
        <Shimmer className="h-10 w-36 rounded-lg" />
        <Shimmer className="h-10 w-28 rounded-lg" />
      </div>
    </div>
    {/* Dot indicators */}
    <div className="absolute bottom-4 right-4 flex gap-1.5">
      {[0,1,2,3].map(i => <Shimmer key={i} className="h-1.5 w-1.5 rounded-full" />)}
    </div>
  </div>
);

/* ─── Episode Card Skeleton (landscape) ──────────────────────── */
export const SkeletonEpisodeCard: React.FC = () => (
  <div className="flex gap-3 p-3 rounded-xl animate-pulse">
    <Shimmer className="w-24 sm:w-32 aspect-video rounded-xl shrink-0" />
    <div className="flex-1 space-y-2 pt-1">
      <Shimmer className="h-3.5 w-4/5" />
      <Shimmer className="h-3 w-2/3" />
      <Shimmer className="h-2.5 w-1/3" />
    </div>
  </div>
);

/* ─── Episode List Skeleton ───────────────────────────────────── */
export const SkeletonEpisodeList: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonEpisodeCard key={i} />
    ))}
  </div>
);

/* ─── Leaderboard Row Skeleton ────────────────────────────────── */
export const SkeletonLeaderboardRow: React.FC = () => (
  <div className="flex items-center gap-3 p-3.5 rounded-xl animate-pulse">
    <Shimmer className="w-6 h-4 rounded" />
    <Shimmer className="w-10 h-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Shimmer className="h-3.5 w-32" />
      <Shimmer className="h-2.5 w-20" />
    </div>
    <Shimmer className="h-4 w-12" />
  </div>
);

/* ─── Leaderboard Podium Skeleton ─────────────────────────────── */
export const SkeletonLeaderboardPodium: React.FC = () => (
  <div className="lg:col-span-7 flex flex-col items-center pt-16 pb-4 rounded-2xl border border-border/40 animate-pulse">
    <div className="flex items-end justify-center w-full max-w-md px-4 mt-2 h-64 select-none gap-2">
      {/* 2nd */}
      <div className="flex flex-col items-center w-1/3">
        <Shimmer className="w-16 h-16 rounded-full mb-2" />
        <Shimmer className="h-3 w-14 mb-1 rounded" />
        <Shimmer className="h-2.5 w-10 rounded" />
        <Shimmer className="w-full h-16 mt-3 rounded-t-xl" />
      </div>
      {/* 1st */}
      <div className="flex flex-col items-center w-1/3 z-10">
        <Shimmer className="w-20 h-20 rounded-full mb-2" />
        <Shimmer className="h-3.5 w-16 mb-1 rounded" />
        <Shimmer className="h-3 w-12 rounded" />
        <Shimmer className="w-full h-24 mt-3 rounded-t-xl" />
      </div>
      {/* 3rd */}
      <div className="flex flex-col items-center w-1/3">
        <Shimmer className="w-14 h-14 rounded-full mb-2" />
        <Shimmer className="h-3 w-12 mb-1 rounded" />
        <Shimmer className="h-2.5 w-10 rounded" />
        <Shimmer className="w-full h-12 mt-3 rounded-t-xl" />
      </div>
    </div>
  </div>
);

/* ─── Profile Header Skeleton ─────────────────────────────────── */
export const SkeletonProfile: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="flex flex-col items-center pt-8 pb-4 gap-3">
      <Shimmer className="w-24 h-24 rounded-full" />
      <Shimmer className="h-5 w-32 rounded-lg" />
      <Shimmer className="h-3.5 w-24 rounded" />
      <div className="flex gap-6 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Shimmer className="h-5 w-10 rounded" />
            <Shimmer className="h-3 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Section Header Skeleton ─────────────────────────────────── */
export const SkeletonSectionHeader: React.FC = () => (
  <div className="flex items-center justify-between mb-5 animate-pulse">
    <div className="flex gap-3 items-center">
      <Shimmer className="w-9 h-9 rounded-xl" />
      <div className="space-y-1.5">
        <Shimmer className="h-4 w-32 rounded-lg" />
        <Shimmer className="h-3 w-48 rounded" />
      </div>
    </div>
    <Shimmer className="h-4 w-24 rounded" />
  </div>
);

/* ─── Horizontal scroll skeleton (trending shelf) ─────────────── */
export const SkeletonShelf: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="flex gap-4 overflow-hidden pb-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0">
        <SkeletonCard />
      </div>
    ))}
  </div>
);

/* ─── Stat Card Skeleton (e.g. leaderboard top banner) ───────── */
export const SkeletonStatCard: React.FC = () => (
  <div className="p-5 rounded-2xl border border-border/40 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <Shimmer className="w-10 h-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-4 w-28 rounded" />
        <Shimmer className="h-3 w-20 rounded" />
      </div>
    </div>
    <Shimmer className="h-2 w-full rounded-full" />
  </div>
);

/* ─── Comment / Chat Skeleton ─────────────────────────────────── */
export const SkeletonComment: React.FC = () => (
  <div className="flex gap-3 animate-pulse">
    <Shimmer className="w-8 h-8 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="flex gap-2 items-center">
        <Shimmer className="h-3 w-20 rounded" />
        <Shimmer className="h-2.5 w-12 rounded" />
      </div>
      <Shimmer className="h-3 w-4/5 rounded" />
      <Shimmer className="h-3 w-2/3 rounded" />
    </div>
  </div>
);

/* ─── Schedule Day Skeleton ───────────────────────────────────── */
export const SkeletonScheduleDay: React.FC = () => (
  <div className="animate-pulse space-y-2">
    <Shimmer className="h-8 w-24 rounded-xl" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 rounded-xl">
        <Shimmer className="w-12 h-16 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Shimmer className="h-3.5 w-3/4 rounded" />
          <Shimmer className="h-3 w-1/2 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonCard;
