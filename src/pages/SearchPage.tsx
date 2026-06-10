import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Star, Play, Plus, Check } from 'lucide-react';
import { MOCK_ANIMES, MOCK_MANGAS } from '../constants/mockData';
import { AnimeCard } from '../components/cards/AnimeCard';
import { MangaCard } from '../components/cards/MangaCard';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/useAppStore';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { addBookmark, removeBookmark, isBookmarked, addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'semua' | 'anime' | 'manga'>('semua');

  // Search execution
  const getSearchResults = () => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const animeResults = MOCK_ANIMES.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.genres.some(g => g.toLowerCase().includes(q)) ||
      a.studio.toLowerCase().includes(q)
    ).map(a => ({ ...a, isAnime: true as const }));

    const mangaResults = MOCK_MANGAS.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.genres.some(g => g.toLowerCase().includes(q)) ||
      m.author.toLowerCase().includes(q)
    ).map(m => ({ ...m, isAnime: false as const }));

    return [...animeResults, ...mangaResults];
  };

  const allResults = getSearchResults();

  // Filter based on Tab
  const filteredResults = allResults.filter(r => {
    if (activeTab === 'semua') return true;
    if (activeTab === 'anime') return r.isAnime === true;
    if (activeTab === 'manga') return r.isAnime === false;
    return true;
  });

  // Featured Content (first match or highest rated)
  const featuredItem = allResults.length > 0 
    ? [...allResults].sort((a, b) => b.rating - a.rating)[0]
    : null;

  const featuredBookmarked = featuredItem 
    ? isBookmarked(featuredItem.id, featuredItem.isAnime ? 'anime' : 'manga') 
    : false;

  const handleFeaturedBookmarkToggle = () => {
    if (!featuredItem) return;
    const type = featuredItem.isAnime ? 'anime' : 'manga';
    if (featuredBookmarked) {
      removeBookmark(featuredItem.id, type);
      addToast('info', `Dihapus dari simpanan: ${featuredItem.title}`);
    } else {
      addBookmark(featuredItem as any);
      addToast('success', `Disimpan ke daftar: ${featuredItem.title}`);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      
      {/* Search Meta Header */}
      <div className="flex items-center gap-2">
        <Search className="w-5.5 h-5.5 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary">
          Hasil Pencarian: <span className="text-primary">"{query}"</span>
        </h1>
      </div>

      <p className="text-xs text-text-secondary leading-none">
        Menemukan {allResults.length} hasil kecocokan di database.
      </p>

      {allResults.length > 0 ? (
        <div className="space-y-8">
          
          {/* Category Tabs filter */}
          <div className="flex gap-2 border-b border-border/40 pb-px">
            {[
              { id: 'semua', lbl: 'Semua Kategori' },
              { id: 'anime', lbl: 'Anime Only' },
              { id: 'manga', lbl: 'Manga / Manhwa' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-semibold transition-all relative -bottom-px focus:outline-none ${
                  activeTab === tab.id 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.lbl}
              </button>
            ))}
          </div>

          {/* Featured Result (KONTEN TERBAIK) - Only show under 'semua' tab */}
          {activeTab === 'semua' && featuredItem && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider block">Cocok Terbaik</h3>
              
              <div className="bg-bg-surface border border-border/60 hover:border-primary/20 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center md:items-start transition-all">
                {/* Visual Thumbnail */}
                <div className="w-32 sm:w-36 aspect-[2/3] bg-bg-base rounded-xl border border-border overflow-hidden shrink-0 shadow-lg">
                  <img
                    src={featuredItem.isAnime ? (featuredItem as any).posterUrl : (featuredItem as any).coverUrl}
                    alt={featuredItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info and action details */}
                <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <Badge variant="rating" className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{featuredItem.rating.toFixed(1)}</span>
                    </Badge>
                    <Badge variant="type" className="uppercase">{featuredItem.type}</Badge>
                    <span className="text-xs text-text-secondary font-medium font-mono">{featuredItem.releaseDate}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-text-primary leading-tight truncate">
                    {featuredItem.title}
                  </h2>

                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 max-w-xl">
                    {featuredItem.description}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5 pt-2">
                    <Link
                      to={featuredItem.isAnime ? `/anime/${featuredItem.slug}` : `/manga/${featuredItem.slug}`}
                      className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-xs rounded-xl shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {featuredItem.isAnime ? (
                        <Play className="w-3.5 h-3.5 fill-black text-black" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-black" />
                      )}
                      <span>{featuredItem.isAnime ? 'Buka Anime' : 'Buka Manga'}</span>
                    </Link>

                    <button
                      onClick={handleFeaturedBookmarkToggle}
                      className={`flex items-center gap-1.5 px-4.5 py-2 border rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                        featuredBookmarked
                          ? 'bg-primary/10 border-primary text-primary-light'
                          : 'bg-black/35 border-border hover:border-primary text-text-primary'
                      }`}
                    >
                      {featuredBookmarked ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary-light" />
                          <span>Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Grid results */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider block">Semua Hasil Pencarian</h3>
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredResults.map((r) => (
                  <div key={r.id} className="animate-fade-in">
                    {r.isAnime ? (
                      <AnimeCard anime={r as any} />
                    ) : (
                      <MangaCard manga={r as any} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted">
                Tidak ada hasil pencarian di kategori ini.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Empty results state */
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6">
          <Search className="w-12 h-12 text-muted/50 mb-3" />
          <h3 className="text-base font-bold text-text-primary">Tidak Ada Hasil Ditemukan</h3>
          <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
            Kami tidak menemukan hasil yang cocok dengan kata kunci "{query}". Silakan periksa kembali ejaan Anda atau gunakan istilah pencarian alternatif.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4 text-black" />
            <span>Jelajahi Semua Konten</span>
          </button>
        </div>
      )}

    </div>
  );
};
export default SearchPage;
