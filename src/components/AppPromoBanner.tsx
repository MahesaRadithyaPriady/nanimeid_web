import React from 'react';
import { Smartphone, Download } from 'lucide-react';

export const AppPromoBanner: React.FC = () => {
  const handleDownload = () => {
    window.open('https://play.google.com/store/apps/details?id=com.nanime.id&hl=en-US', '_blank');
  };

  const handleDownloadApk = () => {
    window.open('https://cdn-stable.nanimeid.xyz/file/NanimeID/NanimeID/2.8.0/Rilis/nanimeid-2.8.0.apk', '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {/* Play Store bar */}
      <div className="h-9 sm:h-10 bg-primary flex items-center justify-center px-3 sm:px-4 shadow-md cursor-pointer hover:bg-primary/90 transition-colors" onClick={handleDownload}>
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-4xl justify-center">
          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse shrink-0" />
          <span className="text-white text-[10px] sm:text-sm font-semibold tracking-wide truncate">
            <span className="sm:hidden">Unduh Aplikasi NanimeID di Play Store!</span>
            <span className="hidden sm:inline">Pengalaman Nonton Lebih Maksimal! Unduh Aplikasi NanimeID di Play Store</span>
          </span>
          <button
            className="hidden sm:flex items-center gap-1.5 ml-2 py-1 px-3 rounded-md bg-white/20 text-white text-[10px] font-bold tracking-widest hover:bg-white/30 transition-all uppercase shrink-0"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M4.665 21.688l11.455-6.52-3.136-3.136L4.665 21.688zm12.39-7.052l3.414-1.944c1.196-.681 1.196-1.789 0-2.47l-3.414-1.944-3.565 3.565 3.565 3.565zM3.484 2.825v18.349c0 .546.602.868 1.054.551l7.632-7.633-8.686-8.686v-2.581zm1.054-.551l8.318 4.736-3.136 3.136L4.538 2.274z"/>
            </svg>
            Unduh Sekarang
          </button>
        </div>
      </div>

      {/* Direct APK download bar */}
      <div className="h-8 sm:h-9 bg-bg-surface border-b border-border/30 flex items-center justify-center px-3 sm:px-4 cursor-pointer hover:bg-bg-elevated transition-colors" onClick={handleDownloadApk}>
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-4xl justify-center">
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="text-text-primary text-[10px] sm:text-sm font-semibold tracking-wide truncate">
            <span className="sm:hidden">Unduh versi terbaru NanimeID lebih awal!</span>
            <span className="hidden sm:inline">Unduh versi terbaru NanimeID lebih awal — instalasi cepat & ringan</span>
          </span>
          <button
            className="flex items-center gap-1.5 ml-2 py-0.5 px-2.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold tracking-wider hover:bg-primary/25 transition-all uppercase shrink-0"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">APK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
