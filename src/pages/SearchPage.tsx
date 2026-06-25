import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Star, Play, Plus, Check, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { AnimeCard } from '../components/cards/AnimeCard';
import { SkeletonGrid } from '../components/cards/SkeletonCard';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/useAppStore';
import { fetchLiveSearch, searchByImage } from '../lib/animeApi';
import { searchUsers } from '../lib/profileApi';
import { UserAvatar } from '../components/ui/UserAvatar';
import type { ApiAnime, Anime, ApiUserSearchItem } from '../types';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { addBookmark, removeBookmark, isBookmarked, addToast, isLoggedIn } = useAppStore();

  const [activeTab, setActiveTab] = useState<'semua' | 'anime' | 'pengguna'>('semua');
  const [animeResults, setAnimeResults] = useState<ApiAnime[]>([]);
  const [userResults, setUserResults] = useState<ApiUserSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync / perform search on query change
  useEffect(() => {
    if (!query.trim()) {
      setAnimeResults([]);
      setUserResults([]);
      return;
    }

    // Fetch API Anime & User Search
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [animeRes, userRes] = await Promise.all([
          fetchLiveSearch(query, { limit: 30 }).catch(() => ({ data: [] })),
          searchUsers({ q: query }).catch(() => ({ data: [] }))
        ]);
        
        setAnimeResults(animeRes.data || []);
        
        const rawUserData = (userRes as any).data;
        const normalizedUsers = Array.isArray(rawUserData) 
          ? rawUserData 
          : (rawUserData ? [rawUserData] : []);
        setUserResults(normalizedUsers);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Gagal mencari data');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageSearchLoading(true);
    setError(null);
    setAnimeResults([]);
    setUserResults([]);
    
    try {
      const res = await searchByImage(file);
      if (res.matches && res.matches.length > 0) {
        setAnimeResults(res.matches);
        setActiveTab('anime');
      } else {
        setError('Gambar tidak dikenali atau tidak ada kecocokan anime.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mencari dengan gambar');
    } finally {
      setIsImageSearchLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Combine results
  const formattedAnime = animeResults.map(a => ({ ...a, isAnime: true as const }));

  const totalResultsCount = animeResults.length + userResults.length;

  // Filter based on Tab
  const filteredResults = (() => {
    if (activeTab === 'semua') return [...formattedAnime, ...userResults];
    if (activeTab === 'anime') return formattedAnime;
    if (activeTab === 'pengguna') return userResults;
    return [...formattedAnime, ...userResults];
  })();

  const getFeaturedItem = () => {
    const topAnime = animeResults[0];
    
    if (!topAnime) return null;
    return {
      id: String(topAnime.id),
      title: topAnime.nama_anime,
      coverUrl: topAnime.gambar_anime,
      posterUrl: topAnime.gambar_anime,
      rating: topAnime.rating_anime ?? 0,
      type: 'anime',
      releaseDate: topAnime.tanggal_rilis_anime,
      description: topAnime.sinopsis_anime,
      slug: String(topAnime.id),
      isAnime: true as const,
      rawItem: topAnime
    };
  };

  const featuredItem = getFeaturedItem();
  const featuredBookmarked = featuredItem 
    ? isBookmarked(featuredItem.id, 'anime') 
    : false;

  const handleFeaturedBookmarkToggle = () => {
    if (!featuredItem) return;
    if (!isLoggedIn) {
      addToast('info', 'Login dulu untuk menyimpan konten!');
      return;
    }
    if (featuredBookmarked) {
      removeBookmark(featuredItem.id, 'anime');
      addToast('info', `Dihapus dari simpanan: ${featuredItem.title}`);
    } else {
      const a = featuredItem.rawItem as ApiAnime;
      const mappedAnime: Anime = {
        id: String(a.id),
        title: a.nama_anime,
        slug: String(a.id),
        description: a.sinopsis_anime ?? '',
        type: 'anime',
        status: (a.status_anime ?? '').toLowerCase().includes('ongoing') ? 'ongoing' : 'completed',
        releaseDate: a.tanggal_rilis_anime ?? '',
        studio: (a.studio_anime ?? []).join(', '),
        rating: a.rating_anime ?? 0,
        episodeCount: a.episodes_count ?? 0,
        genres: a.genre_anime ?? [],
        coverUrl: a.gambar_anime,
        posterUrl: a.gambar_anime,
      };
      addBookmark(mappedAnime);
      addToast('success', `Disimpan ke daftar: ${featuredItem.title}`);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left animate-fade-in px-4 sm:px-6 max-w-7xl mx-auto mt-6">
      
      {/* Search Meta Header - Premium Design */}
      <div className="relative overflow-hidden rounded-3xl bg-bg-surface border border-border/40 p-6 md:p-10 shadow-xl">
        {/* Decorative ambient background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-primary-light/10 rounded-full blur-[40px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
           <div className="w-16 h-16 rounded-2xl bg-primary/ border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
             <Search className="w-8 h-8 text-primary drop-shadow-md" />
           </div>
           <div>
             <h1 className="text-3xl md:text-4xl font-black font-heading text-text-primary tracking-tight">
               {query ? (
                 <>Hasil untuk <span className="text-primary">"{query}"</span></>
               ) : (
                 <>Pencarian</>
               )}
             </h1>
             <p className="text-sm text-text-secondary font-medium mt-2">
               Ditemukan <span className="text-primary font-bold px-1">{totalResultsCount}</span> hasil kecocokan di dalam database kami.
             </p>
           </div>
           
           {/* Image Search Button */}
           <div className="md:ml-auto flex items-center gap-3">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageSearch}
             />
             <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImageSearchLoading}
                className="flex items-center gap-2 px-5 py-3 bg-bg-elevated hover:bg-bg-surface border border-primary/30 hover:border-primary text-text-primary rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/5 active:scale-95"
             >
                {isImageSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-primary" />}
                <span>{isImageSearchLoading ? 'Memproses Gambar...' : 'Cari dengan Gambar'}</span>
             </button>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <SkeletonGrid count={12} />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-400 font-medium bg-red-500/10 rounded-2xl border border-red-500/20">
          {error}
        </div>
      ) : totalResultsCount > 0 ? (
        <div className="space-y-10">
          
          {/* Category Tabs filter - Pill Design */}
          <div className="flex gap-2 p-1.5 bg-bg-surface border border-border/50 rounded-2xl overflow-x-auto no-scrollbar w-full shadow-sm">
            {[
              { id: 'semua', lbl: 'Semua Kategori' },
              { id: 'anime', lbl: 'Anime' },
              { id: 'pengguna', lbl: 'Pengguna' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap outline-none ${
                  activeTab === tab.id 
                    ? 'bg-primary text-black shadow-glow' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {tab.lbl}
              </button>
            ))}
          </div>

          {/* Featured Result (KONTEN TERBAIK) - Only show under 'semua' tab */}
          {activeTab === 'semua' && featuredItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-md" />
                <h3 className="text-sm font-black font-heading text-text-primary uppercase tracking-widest">
                  Kecocokan Terbaik
                </h3>
              </div>
              
              <div className="relative overflow-hidden rounded-3xl bg-bg-surface border border-border/60 hover:border-primary/40 transition-all duration-300 group shadow-lg">
                {/* Backdrop image */}
                <div className="absolute inset-0 z-0">
                   <img
                     src={featuredItem.coverUrl}
                     className="w-full h-full object-cover opacity-20 blur-[30px] scale-110 group-hover:scale-125 transition-transform duration-1000"
                     alt="backdrop"
                   />
                   <div className="absolute inset-0 bg-bg-surface"></div>
                </div>

                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                  {/* Visual Thumbnail */}
                  <div className="w-32 sm:w-40 aspect-[2/3] bg-bg-base rounded-2xl border border-border/50 overflow-hidden shrink-0 shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                    <img
                      src={featuredItem.coverUrl}
                      alt={featuredItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Info and action details */}
                  <div className="flex-1 text-center md:text-left space-y-4 min-w-0 py-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                      <Badge variant="rating" className="flex items-center gap-1.5 shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{featuredItem.rating.toFixed(1)}</span>
                      </Badge>
                      <Badge variant="type" className="uppercase shadow-sm">{featuredItem.type}</Badge>
                      <span className="text-xs text-primary-light font-bold font-mono bg-primary/10 px-2 py-1 rounded-md">{featuredItem.releaseDate}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary leading-tight line-clamp-2 px-1">
                      {featuredItem.title}
                    </h2>

                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 max-w-2xl font-medium px-1">
                      {featuredItem.description || "Tidak ada sinopsis tersedia."}
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row w-full justify-center md:justify-start items-center gap-3 pt-4">
                      <Link
                        to={`/anime/${featuredItem.slug}`}
                        className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 sm:py-2.5 bg-primary text-black font-bold text-sm rounded-xl shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 fill-black text-black" />
                        <span>Tonton Sekarang</span>
                      </Link>

                      <button
                        onClick={handleFeaturedBookmarkToggle}
                        className={`flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 sm:py-2.5 border rounded-xl text-sm font-bold transition-all active:scale-95 ${
                          featuredBookmarked
                            ? 'bg-primary/15 border-primary text-primary-light shadow-[0_0_15px_rgba(var(--color-primary),0.2)]'
                            : 'bg-bg-elevated/80 border-border hover:border-primary text-text-primary backdrop-blur-sm'
                        }`}
                      >
                        {featuredBookmarked ? (
                          <>
                            <Check className="w-4 h-4 text-primary-light" />
                            <span>Tersimpan</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Simpan</span>
                          </>
                        )}
                      </button>
                    </div>

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
                {filteredResults.map((r: any) => (
                  <div key={r.id} className="animate-fade-in">
                    {r.isAnime ? (
                      <AnimeCard apiAnime={r as ApiAnime} />
                    ) : 'username' in r ? (
                      <Link 
                        to={`/user/${r.id}`} 
                        className="bg-bg-surface/50 backdrop-blur-sm border border-border/40 hover:border-primary/50 p-5 rounded-3xl flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] shadow-lg hover:shadow-primary/10 group h-full justify-between relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-primary/ opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors duration-300 relative bg-bg-base flex items-center justify-center mb-4 shrink-0 shadow-inner z-10">
                          <UserAvatar
                            src={r.profile?.avatar_url || ''}
                            name={r.profile?.full_name || r.username}
                            className="w-full h-full rounded-full text-2xl"
                          />
                        </div>
                        <div className="min-w-0 w-full space-y-1 z-10">
                          <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-primary-light transition-colors">
                            {r.profile?.full_name || r.username}
                          </h4>
                          <p className="text-xs text-text-secondary font-medium truncate">
                            @{r.username}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-1.5 z-10">
                          {r.vip && r.vip.status === 'ACTIVE' && (
                            <span className="px-2 py-0.5 rounded-md bg-primary text-black font-mono font-black text-[10px] uppercase shadow-sm">
                              VIP {r.vip.vip_level}
                            </span>
                          )}
                          {r.level && (
                            <span className="px-2 py-0.5 rounded-md bg-bg-elevated border border-border text-text-secondary font-mono font-bold text-[10px] uppercase">
                              LVL {r.level.level_number}
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : null}
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
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all"
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
