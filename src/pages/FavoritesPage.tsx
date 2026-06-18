import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Compass, Loader2 } from 'lucide-react';
import { AnimeCard } from '../components/cards/AnimeCard';
import { useAppStore } from '../stores/useAppStore';
import { fetchFavoriteAnimes, removeAnimeFromFavorite } from '../lib/animeApi';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  
  const activeTab = 'anime';
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      if (activeTab === 'anime') {
        const res = await fetchFavoriteAnimes();
        setFavorites(res.items || []);
      } else {
        // Episode favorites are not fully implemented in UI yet
        // For now we'll just handle Anime
        setFavorites([]);
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Gagal memuat daftar favorit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [activeTab]);

  const handleDelete = async (e: React.MouseEvent, animeId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeAnimeFromFavorite(animeId);
      addToast('success', 'Dihapus dari favorit');
      // Refresh list
      setFavorites(prev => prev.filter(item => item.anime_id !== animeId));
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus favorit');
    }
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      
      {/* 1. Page Header Block */}
      <div className="flex items-start justify-between border-b border-border/20 pb-4">
        <div className="flex gap-3 items-start text-left">
          <span className="mt-1.5 shrink-0">
            <Heart className="w-5.5 h-5.5 text-pink-500 fill-pink-500" />
          </span>
          <div className="flex flex-col justify-start">
            <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary tracking-tight leading-tight">
              Daftar Favorit Saya
            </h1>
            <span className="text-xs text-muted font-medium mt-1">Koleksi anime terbaik yang Anda simpan</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="text-left">
          <h2 className="text-sm font-bold text-text-primary font-heading">Semua Favorit</h2>
          <p className="text-xs text-muted mt-0.5">
            {loading ? 'Memuat...' : `Menampilkan ${favorites.length} konten tersimpan`}
          </p>
        </div>
      </div>

      {/* 3. Feed Viewport */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {favorites.map((fav) => {
            const a = fav.anime;
            if (!a) return null;
            return (
              <div key={fav.id} className="animate-fade-in relative group">
                <AnimeCard apiAnime={a} />
                
                {/* Delete/Trash button overlay on top of AnimeCard */}
                <button
                  onClick={(e) => handleDelete(e, a.id)}
                  className="absolute top-2 right-2 z-20 p-2 bg-black/60 hover:bg-red-500 hover:text-white border border-white/10 hover:border-red-500 rounded-lg text-white/80 transition-all duration-300 focus:outline-none opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-lg backdrop-blur-sm"
                  aria-label="Hapus favorit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6">
          <Heart className="w-12 h-12 text-muted/50 mb-4" />
          <p className="text-sm text-muted mb-6">Anda belum menambahkan anime apapun ke daftar favorit.</p>
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-surface border border-border hover:border-primary text-text-primary hover:text-primary font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Jelajahi Konten Baru</span>
          </button>
        </div>
      )}

    </div>
  );
};
export default FavoritesPage;
