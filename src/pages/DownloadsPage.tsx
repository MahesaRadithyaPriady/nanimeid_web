import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Play, HardDrive, Clock, AlertCircle, Compass } from 'lucide-react';
import { useDownloadStore } from '../stores/useDownloadStore';

// Helper to format file sizes
function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper to format date in Indonesian
function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const DownloadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { downloadedList, initDownloads, deleteDownload, isInitialized } = useDownloadStore();

  // Initialize store downloads
  useEffect(() => {
    initDownloads();
  }, [initDownloads]);

  const handleDelete = async (e: React.MouseEvent, episodeId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus episode unduhan ini?')) {
      await deleteDownload(episodeId);
    }
  };

  const handlePlay = (animeId: number, episodeNumber: number) => {
    navigate(`/watch/${animeId}/ep/${episodeNumber}`);
  };

  // Calculate total size of downloads
  const totalSize = downloadedList.reduce((acc, item) => acc + (item.videoSize || 0), 0);

  return (
    <div className="space-y-6 pb-16 text-left">
      
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/20 pb-4 gap-4">
        <div className="flex gap-3 items-start text-left">
          <span className="mt-1.5 shrink-0 p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary shadow-[0_0_15px_rgba(255,102,205,0.1)]">
            <Download className="w-6 h-6 animate-pulse" />
          </span>
          <div className="flex flex-col justify-start">
            <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary tracking-tight leading-tight">
              Unduhan Saya
            </h1>
            <span className="text-xs text-muted font-medium mt-1">
              Daftar episode anime yang tersimpan secara lokal dan dapat Anda tonton secara offline.
            </span>
          </div>
        </div>

        {/* Storage Stats Banner */}
        {downloadedList.length > 0 && (
          <div className="flex items-center gap-3 bg-bg-surface/50 border border-border/30 rounded-2xl px-4 py-2.5 shadow-glow-sm backdrop-blur-sm self-start md:self-auto">
            <HardDrive className="w-5 h-5 text-primary-light shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Penyimpanan</span>
              <span className="text-xs font-black text-text-primary font-mono mt-0.5">
                {formatBytes(totalSize)} ({downloadedList.length} Episode)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Viewport */}
      {!isInitialized ? (
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted">Memuat database unduhan lokal...</p>
        </div>
      ) : downloadedList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {downloadedList.map((item) => {
            const animeCover = item.animeImageLocalUrl || item.animeData?.gambar_anime;
            const epThumbnail = item.episodeThumbnailLocalUrl || item.episodeData?.thumbnail_episode || animeCover;

            return (
              <div 
                key={item.episodeId}
                className="group relative flex flex-col bg-bg-sidebar/40 border border-border/30 hover:border-primary/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,102,205,0.08)] hover:-translate-y-0.5 backdrop-blur-sm"
              >
                {/* Card Thumbnail Area with Hover Overlay */}
                <div className="relative aspect-[16/9] w-full bg-black/60 overflow-hidden shrink-0">
                  <img 
                    src={epThumbnail} 
                    alt={item.episodeTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  
                  {/* Quality Badge */}
                  <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded uppercase font-mono tracking-wider shadow-sm">
                    {item.quality}
                  </span>

                  {/* Size Badge */}
                  <span className="absolute bottom-2.5 right-2.5 z-10 text-[10px] font-bold bg-black/70 text-text-primary px-2 py-0.5 rounded-lg border border-white/5 font-mono shadow-sm">
                    {formatBytes(item.videoSize)}
                  </span>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 cursor-pointer"
                       onClick={() => handlePlay(item.animeId, item.episodeNumber)}>
                    <div className="w-12 h-12 rounded-full bg-primary/90 text-black flex items-center justify-center shadow-glow transition-all duration-200 transform scale-75 group-hover:scale-100 hover:scale-105 active:scale-95">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Details Block */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-primary-light uppercase tracking-wider block font-mono truncate">
                      {item.animeTitle}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary leading-snug tracking-tight font-heading line-clamp-1 group-hover:text-primary transition-colors">
                      Episode {item.episodeNumber}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {item.episodeTitle}
                    </p>
                  </div>

                  {/* Footer Stats and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/20 text-[10px] text-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted/65" />
                      <span>{formatDate(item.downloadedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(e, item.episodeId)}
                        className="p-2 bg-white/5 hover:bg-red-500/10 border border-border hover:border-red-500/20 hover:text-red-400 rounded-xl text-muted transition-all duration-250 focus:outline-none"
                        title="Hapus Unduhan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handlePlay(item.animeId, item.episodeNumber)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-[10px] font-extrabold text-primary hover:text-black rounded-xl transition-all shadow-glow-sm"
                      >
                        <Play className="w-3 h-3 fill-current translate-x-0.5" />
                        <span>PUTAR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Downloads State */
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20 flex flex-col items-center justify-center p-6 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-muted/50 mb-4 animate-bounce" />
          <h2 className="text-base font-bold text-text-primary font-heading mb-1">Belum Ada Unduhan</h2>
          <p className="text-sm text-muted max-w-sm mx-auto mb-6">
            Anda belum mengunduh episode anime apapun. Cari anime favorit Anda dan unduh episodenya untuk ditonton offline.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-black font-extrabold text-xs rounded-xl shadow-glow hover:opacity-90 active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Jelajahi Anime</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default DownloadsPage;
