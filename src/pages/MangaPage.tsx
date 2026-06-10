import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { MOCK_MANGAS } from '../constants/mockData';
import { MangaCard } from '../components/cards/MangaCard';

export const MangaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mangaSubTab, setMangaSubTab] = useState<'all' | 'manga' | 'manhwa' | 'manhua'>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  // Sync sub-tab active state from URL type parameter
  useEffect(() => {
    const type = searchParams.get('type') as any;
    if (type === 'manga' || type === 'manhwa' || type === 'manhua') {
      setMangaSubTab(type);
    } else {
      setMangaSubTab('all');
    }
  }, [searchParams]);

  // Update URL type search parameter when sub-tab is clicked
  const handleTabChange = (val: 'all' | 'manga' | 'manhwa' | 'manhua') => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', val);
    }
    setSearchParams(newParams);
  };

  const getFilteredMangas = () => {
    let list = [...MOCK_MANGAS];
    if (mangaSubTab !== 'all') {
      list = list.filter(m => m.type === mangaSubTab);
    }
    return list;
  };

  const filteredMangas = getFilteredMangas();

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. Page Header Block */}
      <div className="flex items-start justify-between border-b border-border/20 pb-4">
        <div className="flex gap-3 items-start text-left">
          <span className="mt-1.5 shrink-0">
            <BookOpen className="w-5.5 h-5.5 text-primary" />
          </span>
          <div className="flex flex-col justify-start">
            <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary tracking-tight leading-tight">
              Perpustakaan Manga
            </h1>
            <span className="text-xs text-muted font-medium mt-1">Koleksi komik manga, manhwa, dan manhua pilihan</span>
          </div>
        </div>
      </div>

      {/* 2. Bookshelf Regional Tabs (YouTube style sub-channels bar) */}
      <div className="flex gap-2 border-b border-border/40 pb-px">
        {[
          { val: 'all', lbl: 'Semua Komik' },
          { val: 'manga', lbl: 'Manga (Jepang)' },
          { val: 'manhwa', lbl: 'Manhwa (Korea)' },
          { val: 'manhua', lbl: 'Manhua (China)' }
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => handleTabChange(tab.val as any)}
            className={`px-4 py-2 text-sm font-semibold transition-all relative -bottom-px focus:outline-none ${
              mangaSubTab === tab.val
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            {tab.lbl}
          </button>
        ))}
      </div>

      {/* 3. Compact Grid Viewport */}
      {filteredMangas.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {filteredMangas.slice(0, visibleCount).map((manga) => (
            <div key={manga.id} className="animate-fade-in">
              <MangaCard manga={manga} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20">
          <p className="text-sm text-muted">Tidak ada komik di kategori ini.</p>
        </div>
      )}

      {/* 4. Global Load More Trigger */}
      {filteredMangas.length > visibleCount && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-bg-surface border border-border hover:border-primary text-text-primary hover:text-primary font-semibold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}

    </div>
  );
};

export default MangaPage;
