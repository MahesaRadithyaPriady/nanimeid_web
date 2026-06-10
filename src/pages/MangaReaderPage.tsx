import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Star, Plus, Check, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { MOCK_MANGAS } from '../constants/mockData';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';

export const MangaReaderPage: React.FC = () => {
  const { slug, chapterNumber } = useParams<{ slug: string; chapterNumber?: string }>();
  const navigate = useNavigate();
  const { addBookmark, removeBookmark, isBookmarked, addToast } = useAppStore();

  const isReadingMode = chapterNumber !== undefined;
  const currentChNum = chapterNumber ? parseInt(chapterNumber, 10) : 1;

  // Find Manga details
  const manga = MOCK_MANGAS.find(m => m.slug === slug);
  if (!manga) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold">Manga tidak ditemukan!</h2>
        <Link to="/" className="text-primary hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const chapters = manga.chapters || [];
  const currentChapter = chapters.find(c => c.chapterNumber === currentChNum) || chapters[0];
  const bookmarked = isBookmarked(manga.id, 'manga');

  // Reader Preferences States
  const [readMode, setReadMode] = useState<'vertical' | 'horizontal-rtl' | 'horizontal-ltr'>('vertical');
  const [pageSize, setPageSize] = useState<'fit-width' | 'fit-height' | 'original'>('fit-width');
  const [bgColor, setBgColor] = useState<'black' | 'white' | 'grey'>('black');
  const [pageMargin, setPageMargin] = useState<'none' | 'small' | 'large'>('small');
  const [showSettings, setShowSettings] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Auto scroll state
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off, 1-5 speed

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      removeBookmark(manga.id, 'manga');
      addToast('info', `Dihapus dari simpanan: ${manga.title}`);
    } else {
      addBookmark(manga);
      addToast('success', `Disimpan ke daftar: ${manga.title}`);
    }
  };

  // Auto Scroll logic
  useEffect(() => {
    if (!isReadingMode || autoScrollSpeed === 0) return;

    const interval = setInterval(() => {
      window.scrollBy({ top: autoScrollSpeed * 1.5, behavior: 'smooth' });
    }, 50);

    return () => clearInterval(interval);
  }, [isReadingMode, autoScrollSpeed]);

  // Sync bookmark progress text when reading new chapter
  useEffect(() => {
    if (isReadingMode && bookmarked) {
      // Logic inside Zustand updates bookmark progressText
      // For this prototype, we can trigger toast or mock save
      // Just showing a toast
    }
  }, [isReadingMode, currentChNum]);

  // Page index listeners for horizontal mode
  const handlePageNext = () => {
    if (!currentChapter) return;
    if (activePageIndex < currentChapter.pages.length - 1) {
      setActivePageIndex(prev => prev + 1);
    } else {
      // Go to next chapter
      if (currentChNum < chapters.length) {
        setActivePageIndex(0);
        navigate(`/read/${slug}/ch/${currentChNum + 1}`);
        addToast('success', `Membuka Bab ${currentChNum + 1}`);
      } else {
        addToast('info', 'Anda telah mencapai bab terakhir!');
      }
    }
  };

  const handlePagePrev = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(prev => prev - 1);
    } else {
      // Go to prev chapter
      if (currentChNum > 1) {
        navigate(`/read/${slug}/ch/${currentChNum - 1}`);
        // Set to last page of previous chapter (mock 8 pages)
        setActivePageIndex(7);
        addToast('success', `Membuka Bab ${currentChNum - 1}`);
      } else {
        addToast('info', 'Ini adalah bab pertama!');
      }
    }
  };

  // Set reader background color classes
  const bgClasses = {
    black: 'bg-[#050505] text-text-primary',
    white: 'bg-white text-black',
    grey: 'bg-[#1f1f1f] text-text-primary'
  };

  const marginClasses = {
    none: 'gap-0 py-0',
    small: 'gap-4 py-4',
    large: 'gap-10 py-10'
  };

  const sizeClasses = {
    'fit-width': 'w-full max-w-[800px]',
    'fit-height': 'h-[85vh] w-auto max-w-full object-contain',
    'original': 'w-auto max-w-[1200px]'
  };

  // 1. RENDER READING VIEWPORT MODE
  if (isReadingMode) {
    const pages = currentChapter?.pages || [];
    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto ${bgClasses[bgColor]} transition-colors duration-200 select-none flex flex-col`}>
        
        {/* Reader Topbar */}
        <header className="sticky top-0 left-0 right-0 h-14 bg-black/85 backdrop-blur-md border-b border-border/20 z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/manga/${slug}`)}
              className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors"
              aria-label="Kembali ke detail"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold truncate max-w-[180px] sm:max-w-xs text-white">
                {manga.title}
              </h2>
              <span className="text-[10px] text-primary-light block leading-none font-medium">
                Bab {currentChNum} &bull; {currentChapter?.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg text-white transition-colors ${showSettings ? 'bg-white/20 text-primary' : 'hover:bg-white/10'}`}
              aria-label="Pengaturan membaca"
            >
              <Sliders className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Reader Preferences Panel (Overlay) */}
        {showSettings && (
          <div className="absolute top-14 right-4 sm:right-6 w-72 bg-bg-elevated border border-border rounded-2xl p-5 z-50 shadow-glow-lg text-left animate-scale-up text-text-primary">
            <h4 className="text-sm font-bold border-b border-border pb-2 mb-4">Setelan Membaca</h4>
            
            <div className="space-y-4 text-xs font-medium">
              {/* Mode Baca Selection */}
              <div className="space-y-2">
                <label className="text-muted text-[10px] uppercase font-bold tracking-wider block">Mode Membaca</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'vertical', lbl: 'Vertikal' },
                    { val: 'horizontal-rtl', lbl: 'Kanan-Kiri' },
                    { val: 'horizontal-ltr', lbl: 'Kiri-Kanan' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => setReadMode(item.val as any)}
                      className={`py-1.5 px-1 rounded text-center border font-semibold ${
                        readMode === item.val ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-bg-surface hover:border-primary/50'
                      }`}
                    >
                      {item.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Scaling */}
              <div className="space-y-2">
                <label className="text-muted text-[10px] uppercase font-bold tracking-wider block">Ukuran Halaman</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'fit-width', lbl: 'Fit Lebar' },
                    { val: 'fit-height', lbl: 'Fit Tinggi' },
                    { val: 'original', lbl: 'Asli' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => setPageSize(item.val as any)}
                      className={`py-1.5 px-1 rounded text-center border font-semibold ${
                        pageSize === item.val ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-bg-surface hover:border-primary/50'
                      }`}
                    >
                      {item.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-muted text-[10px] uppercase font-bold tracking-wider block">Latar Belakang</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'black', lbl: 'Gelap' },
                    { val: 'white', lbl: 'Terang' },
                    { val: 'grey', lbl: 'Abu' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => setBgColor(item.val as any)}
                      className={`py-1.5 px-1 rounded text-center border font-semibold ${
                        bgColor === item.val ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-bg-surface hover:border-primary/50'
                      }`}
                    >
                      {item.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-2">
                <label className="text-muted text-[10px] uppercase font-bold tracking-wider block">Jarak Halaman</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'none', lbl: 'Nol' },
                    { val: 'small', lbl: 'Kecil' },
                    { val: 'large', lbl: 'Besar' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => setPageMargin(item.val as any)}
                      className={`py-1.5 px-1 rounded text-center border font-semibold ${
                        pageMargin === item.val ? 'border-primary bg-primary/10 text-primary-light' : 'border-border bg-bg-surface hover:border-primary/50'
                      }`}
                    >
                      {item.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Scroll Speed slider */}
              {readMode === 'vertical' && (
                <div className="space-y-2">
                  <label className="text-muted text-[10px] uppercase font-bold tracking-wider block">Kecepatan Auto-Scroll</label>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={autoScrollSpeed}
                    onChange={(e) => setAutoScrollSpeed(parseInt(e.target.value))}
                    className="w-full accent-primary bg-bg-base h-1.5 rounded"
                  />
                  <div className="flex justify-between text-[9px] text-muted font-semibold leading-none">
                    <span>Mati</span>
                    <span>Lambat</span>
                    <span>Cepat</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full py-2 bg-primary text-black font-semibold rounded-lg text-center shadow hover:opacity-90 transition-all text-xs"
            >
              Simpan Pengaturan
            </button>
          </div>
        )}

        {/* Reader Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          
          {/* A. Vertical mode layout (long strip scroll) */}
          {readMode === 'vertical' && (
            <div className={`flex flex-col items-center w-full ${marginClasses[pageMargin]}`}>
              {pages.map((url, idx) => (
                <div key={idx} className="relative bg-bg-surface border border-border/10 shadow flex flex-col items-center">
                  <img
                    src={url}
                    alt={`Page ${idx + 1}`}
                    loading="lazy"
                    className={`${sizeClasses[pageSize]}`}
                  />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-white">
                    Hal {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* B. Horizontal mode layout (single-page swipe/click navigation) */}
          {(readMode === 'horizontal-rtl' || readMode === 'horizontal-ltr') && (
            <div className="relative flex items-center justify-center w-full h-[75vh] max-w-5xl">
              
              {/* Previous trigger */}
              <button
                onClick={readMode === 'horizontal-rtl' ? handlePageNext : handlePagePrev}
                className="absolute left-0 p-3 bg-black/60 border border-white/10 hover:border-primary text-white hover:text-primary rounded-full hover:scale-105 transition-all z-20 focus:outline-none"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Manga Page image */}
              <div 
                onClick={handlePageNext}
                className="bg-bg-surface border border-border/20 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center h-full max-h-full cursor-pointer relative"
              >
                <img
                  src={pages[activePageIndex]}
                  alt={`Page ${activePageIndex + 1}`}
                  className={`${sizeClasses[pageSize]} max-h-full object-contain`}
                />
                
                {/* Floating Page details */}
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md text-white font-mono px-2.5 py-1 rounded-md text-xs font-semibold">
                  Halaman {activePageIndex + 1} / {pages.length}
                </div>
              </div>

              {/* Next trigger */}
              <button
                onClick={readMode === 'horizontal-rtl' ? handlePagePrev : handlePageNext}
                className="absolute right-0 p-3 bg-black/60 border border-white/10 hover:border-primary text-white hover:text-primary rounded-full hover:scale-105 transition-all z-20 focus:outline-none"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

            </div>
          )}

        </div>

        {/* Reader Bottom Navigation bar */}
        <footer className="sticky bottom-0 left-0 right-0 h-14 bg-black/85 backdrop-blur-md border-t border-border/20 z-45 flex items-center justify-between px-4 sm:px-6">
          {/* Chapter Back */}
          <button
            disabled={currentChNum <= 1}
            onClick={() => {
              setActivePageIndex(0);
              navigate(`/read/${slug}/ch/${currentChNum - 1}`);
              addToast('success', `Membuka Bab ${currentChNum - 1}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-bg-elevated disabled:opacity-40 disabled:hover:bg-bg-surface text-white border border-border/50 rounded-lg text-xs font-semibold transition-all focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bab {currentChNum - 1}</span>
          </button>

          {/* Page Counter Progress */}
          <div className="text-center">
            <span className="text-xs font-semibold text-white">
              Halaman {readMode === 'vertical' ? 'Semua' : activePageIndex + 1} / {pages.length}
            </span>
          </div>

          {/* Chapter Next */}
          <button
            disabled={currentChNum >= chapters.length}
            onClick={() => {
              setActivePageIndex(0);
              navigate(`/read/${slug}/ch/${currentChNum + 1}`);
              addToast('success', `Membuka Bab ${currentChNum + 1}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-primary-light disabled:from-border disabled:to-border text-black rounded-lg text-xs font-semibold transition-all focus:outline-none"
          >
            <span>Bab {currentChNum + 1}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>

      </div>
    );
  }

  // 2. RENDER MANGA DETAIL VIEWPORT MODE
  return (
    <div className="pb-16 space-y-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors focus:outline-none mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali</span>
      </button>

      {/* Manga Header details card */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-bg-surface">
        <div className="absolute inset-0 h-[220px] sm:h-[280px] md:h-[320px] w-full z-0 overflow-hidden">
          <img
            src={manga.bannerUrl}
            alt={manga.title}
            className="w-full h-full object-cover filter blur-3xl opacity-30 scale-125 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 p-6 sm:p-8 pt-20 sm:pt-28 md:pt-36">
          {/* Cover image card */}
          <div className="relative w-40 sm:w-44 aspect-[7/10] bg-bg-base rounded-xl overflow-hidden border border-border shrink-0 shadow-2xl">
            <img
              src={manga.coverUrl}
              alt={manga.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Meta */}
          <div className="flex-1 text-center md:text-left min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={manga.status === 'ongoing' ? 'ongoing' : 'completed'} className="uppercase text-[10px]">
                {manga.status}
              </Badge>
              <Badge variant="type" className="bg-primary-deep text-white border-none uppercase">{manga.type}</Badge>
              <span className="text-xs font-semibold text-text-secondary">{manga.releaseDate}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-text-primary leading-tight tracking-tight">
              {manga.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-text-secondary font-medium">
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4.5 h-4.5 fill-yellow-400 text-yellow-400" />
                <strong className="text-text-primary text-sm font-mono">{manga.rating.toFixed(1)}</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>Pengarang: <strong className="text-text-primary">{manga.author}</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span>{manga.chapterCount} Bab</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {manga.genres.map((g) => (
                <Badge key={g} variant="genre">
                  {g}
                </Badge>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {chapters.length > 0 ? (
                <button
                  onClick={() => navigate(`/read/${manga.slug}/ch/1`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl shadow-glow hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Baca Bab 1</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-border text-muted font-semibold text-sm rounded-xl cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4 text-muted" />
                  <span>Belum Rilis</span>
                </button>
              )}

              <button
                onClick={handleBookmarkToggle}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                  bookmarked 
                    ? 'bg-primary/10 border-primary text-primary-light' 
                    : 'bg-black/35 border-border hover:border-primary text-text-primary'
                }`}
              >
                {bookmarked ? (
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

      {/* Synopsis block */}
      <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 text-left space-y-3">
        <h3 className="text-lg font-bold text-text-primary font-heading">Sinopsis</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {manga.description}
        </p>
      </div>

      {/* Chapters Playlist Block */}
      {chapters.length > 0 && (
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 text-left space-y-4">
          <h3 className="text-lg font-bold text-text-primary font-heading border-b border-border/50 pb-3 mb-2">
            Daftar Bab / Chapters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-pink">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                to={`/read/${manga.slug}/ch/${ch.chapterNumber}`}
                className="flex items-center justify-between p-3.5 bg-bg-base hover:bg-bg-elevated border border-border/60 hover:border-primary/40 rounded-xl transition-all group"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                    Bab {ch.chapterNumber}: {ch.title}
                  </h4>
                  <span className="text-[10px] text-muted mt-1 block font-mono">{ch.releaseDate}</span>
                </div>
                <BookOpen className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0 ml-4" />
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
export default MangaReaderPage;
