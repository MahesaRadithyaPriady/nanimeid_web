import React, { useEffect, useState } from 'react';
import { Calendar, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAnimeSchedule } from '../lib/animeApi';
import { SkeletonGrid } from '../components/cards/SkeletonCard';
import type { ApiScheduleDay } from '../types';

export const SchedulePage: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<Record<string, ApiScheduleDay>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      try {
        const res = await fetchAnimeSchedule();
        if (active && res.data) {
          setScheduleData(res.data);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat jadwal anime');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadSchedule();
    return () => { active = false; };
  }, []);

  const dates = Object.keys(scheduleData).sort();

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto mt-6 px-4 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-bg-surface border border-border/40 p-6 md:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
           <div className="w-16 h-16 rounded-2xl bg-primary/ border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
             <Calendar className="w-8 h-8 text-primary drop-shadow-md" />
           </div>
           <div>
             <h1 className="text-3xl md:text-4xl font-black font-heading text-text-primary tracking-tight">
               Jadwal <span className="text-primary">Rilis</span>
             </h1>
             <p className="text-sm text-text-secondary font-medium mt-2">
               Pantau jadwal tayang anime favorit Anda setiap harinya.
             </p>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="w-32 h-8 bg-bg-surface border border-border/40 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SkeletonGrid count={8} />
          </div>
        </div>
      ) : error ? (
        <div className="py-24 text-center border border-dashed border-red-500/30 rounded-2xl bg-red-500/5">
          <p className="text-sm text-red-400 font-medium mb-2">{error}</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/20">
          <Calendar className="w-12 h-12 text-muted/50 mx-auto mb-3" />
          <p className="text-sm text-text-secondary font-medium">Tidak ada jadwal tersedia saat ini.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {dates.map((dateStr) => {
            const dayData = scheduleData[dateStr];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            return (
              <div key={dateStr} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${
                    isToday 
                      ? 'bg-primary/20 border-primary text-primary-light' 
                      : 'bg-bg-elevated border-border/50 text-text-primary'
                  }`}>
                    {isToday && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    {dayData.hari}, {new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </div>
                  {isToday && <span className="text-xs font-bold text-primary uppercase tracking-wider">Hari Ini</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dayData.anime.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-sm text-muted bg-bg-surface/50 rounded-2xl border border-dashed border-border/50">
                      Tidak ada anime tayang di hari ini.
                    </div>
                  ) : (
                    dayData.anime.map(anime => (
                      <Link
                        key={anime.id}
                        to={`/anime/${anime.id}`}
                        className="group relative bg-bg-surface border border-border/40 hover:border-primary/50 rounded-2xl p-4 transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(var(--color-primary),0.3)] flex gap-4 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-primary/ opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-16 h-24 shrink-0 rounded-xl bg-bg-base border border-border overflow-hidden">
                          {anime.gambar_anime ? (
                            <img src={anime.gambar_anime} alt={anime.nama_anime} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bg-elevated">
                              <PlayCircle className="w-6 h-6 text-muted" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2 relative z-10">
                          <h3 className="font-bold text-text-primary text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {anime.nama_anime}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-text-secondary">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {anime.jam || 'TBA'} WIB
                          </div>
                          {anime.latest_episode_number && (
                            <div className="inline-flex items-center self-start px-2 py-0.5 rounded-md bg-primary/10 text-primary-light text-[10px] font-bold uppercase tracking-wider">
                              Episode {anime.latest_episode_number}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
