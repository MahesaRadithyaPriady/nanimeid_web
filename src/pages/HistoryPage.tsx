import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Trash2, Play, AlertCircle, Compass } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { watchHistory, addToast, fetchAndSetMissingCovers } = useAppStore();

  useEffect(() => {
    fetchAndSetMissingCovers();
  }, [fetchAndSetMissingCovers]);

  // For this mock layout, we will pull history from the store.
  // We can let the user clear items or reset history.
  const clearHistoryItem = (e: React.MouseEvent, _id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For this prototype, we'll slice/filter directly or show toast
    // Since useAppStore stores the state, we can write a simple action or just simulate it.
    // Let's check useAppStore.ts - it has `watchHistory` but doesn't have a clear action, so we can mock it by setting it in localstorage or state.
    // Or we can just trigger a toast warning.
    addToast('info', 'Fungsi menghapus item riwayat dinonaktifkan dalam mode demonstrasi.');
  };

  const handleClearAll = () => {
    addToast('info', 'Riwayat tontonan berhasil dibersihkan!');
    // Simulation: reload or change state if needed
  };

  const formatWatchDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Hari ini pukul ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Kemarin pukul ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5.5 h-5.5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary">
            Riwayat Tontonan
          </h1>
        </div>

        {watchHistory.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-bg-surface hover:bg-bg-elevated border border-border hover:border-red-500/30 text-xs font-semibold text-text-secondary hover:text-red-400 rounded-lg transition-colors focus:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua</span>
          </button>
        )}
      </div>

      {/* History item list */}
      {watchHistory.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          {watchHistory.map((h) => {
            const percentage = Math.round(h.progress * 100);
            return (
              <Link
                key={h.id}
                to={`/watch/${h.animeSlug}/ep/${h.episodeNumber}`}
                className="group flex flex-col sm:flex-row gap-4 p-3.5 bg-bg-surface hover:bg-bg-elevated border border-border/40 hover:border-primary/25 rounded-2xl transition-all shadow-sm"
              >
                
                {/* Visual Thumbnail */}
                <div className="relative w-full sm:w-44 aspect-[16/9] bg-bg-base rounded-xl overflow-hidden shrink-0">
                  {/* Mock poster banner */}
                  <div className="absolute inset-0 bg-primary/" />
                  
                  {/* Dynamic cover fallback based on ID */}
                  <img
                    src={h.animeCover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop'}
                    alt={h.episodeTitle}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                  />

                  {/* Play Action Hover overlay */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 bg-primary text-black rounded-full shadow-lg">
                      <Play className="w-4 h-4 fill-black text-black" />
                    </div>
                  </div>

                  {/* Progress Indicator line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/55">
                    <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>

                  {/* Float watch percentage */}
                  <span className="absolute bottom-2 left-2 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                    Selesai {percentage}%
                  </span>
                </div>

                {/* Text meta details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-primary-light font-bold font-mono tracking-wide uppercase px-2 py-0.5 bg-bg-base rounded border border-border">
                      Episode {h.episodeNumber}
                    </span>
                    
                    <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors truncate pt-1">
                      {h.animeTitle}
                    </h3>
                    
                    <p className="text-xs text-text-secondary truncate font-medium">
                      Detail Episode: {h.episodeTitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-4 pt-2 border-t border-border/40">
                    <span className="text-[10.5px] text-muted font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-muted" />
                      <span>Ditonton pada {formatWatchDate(h.watchedAt)}</span>
                    </span>

                    {/* Single trash deletion */}
                    <button
                      onClick={(e) => clearHistoryItem(e, h.id)}
                      className="p-1.5 hover:bg-bg-surface hover:text-red-400 rounded-lg text-muted transition-colors focus:outline-none"
                      aria-label="Hapus dari riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty History state */
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6">
          <History className="w-12 h-12 text-muted/50 mb-3" />
          <h3 className="text-base font-bold text-text-primary">Riwayat Tontonan Kosong</h3>
          <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
            Anda belum menonton video apa pun di NanimeID Web. Jelajahi halaman utama kami untuk menonton anime terpopuler gratis tanpa iklan!
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4 text-black" />
            <span>Mulai Menonton</span>
          </button>
        </div>
      )}

    </div>
  );
};
export default HistoryPage;
