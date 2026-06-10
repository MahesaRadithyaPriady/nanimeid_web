import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, Play, BookOpen, Compass } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookmarks, removeBookmark, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'semua' | 'anime' | 'manga'>('semua');

  const filteredBookmarks = bookmarks.filter(b => {
    if (activeTab === 'semua') return true;
    return b.itemType === activeTab;
  });

  const handleDelete = (e: React.MouseEvent, itemId: string, type: 'anime' | 'manga') => {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(itemId, type);
    addToast('info', 'Dihapus dari daftar simpanan.');
  };

  const handleContinue = (e: React.MouseEvent, b: typeof bookmarks[0]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Extract episode/chapter numbers if possible from progressText
    // "Lanjut Ep 3 (40%)" -> 3
    let targetNum = 1;
    const matchEp = b.progressText.match(/Ep (\d+)/);
    const matchCh = b.progressText.match(/Ch (\d+)/);
    
    if (matchEp) targetNum = parseInt(matchEp[1], 10);
    else if (matchCh) targetNum = parseInt(matchCh[1], 10);

    if (b.itemType === 'anime') {
      navigate(`/watch/${b.slug}/ep/${targetNum}`);
      addToast('info', `Melanjutkan ${b.title} Episode ${targetNum}`);
    } else {
      navigate(`/read/${b.slug}/ch/${targetNum}`);
      addToast('info', `Melanjutkan ${b.title} Bab ${targetNum}`);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <Bookmark className="w-5.5 h-5.5 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary">
          Daftar Tersimpan
        </h1>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-border/40 pb-px">
        {[
          { id: 'semua', lbl: 'Semua Konten' },
          { id: 'anime', lbl: 'Anime' },
          { id: 'manga', lbl: 'Manga / Manhwa' }
        ].map((tab) => (
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

      {/* Bookmarks Grid Viewport */}
      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredBookmarks.map((b) => (
            <Link
              key={b.id}
              to={b.itemType === 'anime' ? `/anime/${b.slug}` : `/manga/${b.slug}`}
              className="group flex flex-col w-full relative focus:outline-none bg-bg-surface border border-border/40 hover:border-primary/30 p-2 rounded-2xl transition-all hover:scale-[1.02] shadow-sm hover:shadow-glow-lg"
            >
              
              {/* Cover image container */}
              <div className="relative aspect-[2/3] bg-bg-base rounded-xl overflow-hidden mb-2.5">
                <img
                  src={b.coverUrl}
                  alt={b.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Type Badge Overlay */}
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold font-mono text-white uppercase border border-white/10">
                  {b.itemType}
                </span>

                {/* Delete/Trash button overlay (desktop: hides, show on hover) */}
                <button
                  onClick={(e) => handleDelete(e, b.itemId, b.itemType)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-black/70 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-lg text-white/80 transition-colors focus:outline-none"
                  aria-label="Hapus bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Continue CTA Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <button
                    onClick={(e) => handleContinue(e, b)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-light text-black font-bold text-xs rounded-xl shadow-lg transition-all transform translate-y-2 group-hover:translate-y-0 duration-200"
                  >
                    {b.itemType === 'anime' ? (
                      <Play className="w-3.5 h-3.5 fill-black text-black" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>Lanjutkan</span>
                  </button>
                </div>

              </div>

              {/* Text Meta Details */}
              <div className="px-1 min-w-0">
                <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                  {b.title}
                </h4>
                <p className="text-[10.5px] text-primary-light font-medium mt-1 truncate">
                  {b.progressText}
                </p>
              </div>

            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6">
          <Bookmark className="w-12 h-12 text-muted/50 mb-3" />
          <h3 className="text-base font-bold text-text-primary">Simpanan Anda Kosong</h3>
          <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
            Daftar simpanan membantu Anda mengelompokkan anime & manga favorit serta melanjutkan progress tontonan/bacaan dengan mudah.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4 text-black" />
            <span>Jelajahi Konten Baru</span>
          </button>
        </div>
      )}

    </div>
  );
};
export default BookmarksPage;
