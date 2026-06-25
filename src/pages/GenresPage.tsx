import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { fetchAnimeGenres } from '../lib/animeApi';
import type { ApiGenreStats } from '../types';

export const GenresPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ApiGenreStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadGenres = async () => {
      try {
        const res = await fetchAnimeGenres();
        if (active) {
          // Sort genres by count (descending), then alphabetically
          const sorted = [...(res.data?.genreStats || [])].sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.genre.localeCompare(b.genre);
          });
          setStats(sorted);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error("Failed to load genres:", err);
          setError(err.message || 'Gagal memuat daftar genre');
          setIsLoading(false);
        }
      }
    };
    loadGenres();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface border border-border/30">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-heading text-text-primary tracking-tight">
                    Daftar Genre
                  </h1>
                  <p className="text-xs sm:text-sm text-muted font-medium mt-0.5">
                    Jelajahi anime berdasarkan genre favorit Anda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted text-sm font-medium animate-pulse">Memuat genre...</p>
        </div>
      ) : error ? (
        <div className="py-24 text-center border border-dashed border-red-500/30 rounded-2xl bg-red-500/5">
          <p className="text-sm text-red-400 font-medium mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 text-red-300 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.genre}
              onClick={() => navigate(`/browse?genre=${encodeURIComponent(stat.genre)}`)}
              className="group cursor-pointer relative overflow-hidden rounded-xl bg-bg-surface border border-border/40 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(255,102,205,0.4)] animate-fade-in flex flex-col justify-between p-4"
              style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
            >
              <div className="absolute inset-0 bg-primary/ opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex items-start justify-between">
                <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                  {stat.genre}
                </h3>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
              
              <div className="relative z-10 mt-6">
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-bg-elevated border border-border/50 text-[10px] font-mono text-text-secondary group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                  {stat.count.toLocaleString('id-ID')} Anime
                </div>
              </div>
            </div>
          ))}
          
          {stats.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted">
              Tidak ada genre yang ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenresPage;
