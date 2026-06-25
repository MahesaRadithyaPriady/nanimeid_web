import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Search, Trophy, ShieldAlert, ArrowLeft, Clock, Info } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useAppStore } from '../stores/useAppStore';
import { getWaifuList, checkWaifuCooldown, voteWaifu } from '../lib/waifuApi';
import type { ApiWaifu, ApiWaifuVoteCooldownResponse } from '../types';

import { resolveSrc } from '../lib/utils';

export const WaifuVotePage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, addToast } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [waifus, setWaifus] = useState<ApiWaifu[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [cooldownData, setCooldownData] = useState<ApiWaifuVoteCooldownResponse | null>(null);
  const [isVoting, setIsVoting] = useState<number | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<Date | null>(null);

  // Initialize Fingerprint
  useEffect(() => {
    async function initFingerprint() {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (err) {
        console.error('Failed to generate fingerprint:', err);
        addToast('error', 'Gagal memverifikasi perangkat Anda.');
      }
    }
    initFingerprint();
  }, [addToast]);

  // Fetch waifu list
  const fetchWaifus = useCallback(async (currentPage: number, query: string) => {
    setIsLoading(true);
    try {
      const res = await getWaifuList({ page: currentPage, limit: 20, q: query });
      if (res.status === 200) {
        setWaifus(res.items);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat daftar Waifu.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWaifus(page, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchQuery, fetchWaifus]);

  // Check cooldown if logged in and fingerprint is ready
  const fetchCooldown = useCallback(async () => {
    if (!isLoggedIn || !fingerprint) return;
    try {
      const res = await checkWaifuCooldown(fingerprint);
      if (res.status === 200) {
        setCooldownData(res.data);
        if (res.data.nextAllowedAt) {
          setNextAllowedAt(new Date(res.data.nextAllowedAt));
        } else {
          setNextAllowedAt(null);
        }
      }
    } catch (err) {
      console.error('Failed to check cooldown:', err);
    }
  }, [isLoggedIn, fingerprint]);

  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown]);

  // Countdown timer for next allowed
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  useEffect(() => {
    if (!nextAllowedAt) {
      setTimeLeftStr('');
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextAllowedAt.getTime() - now;
      if (distance <= 0) {
        setTimeLeftStr('');
        setNextAllowedAt(null); // Clear cooldown
        fetchCooldown(); // Re-verify
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeftStr(`${hours}j ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextAllowedAt, fetchCooldown]);

  const handleVote = async (waifuId: number) => {
    if (!isLoggedIn) {
      addToast('error', 'Harap masuk ke akun Anda terlebih dahulu.');
      navigate('/login');
      return;
    }
    if (!fingerprint) {
      addToast('error', 'Sistem memverifikasi perangkat Anda, mohon tunggu sebentar.');
      return;
    }

    setIsVoting(waifuId);
    try {
      const res = await voteWaifu(waifuId, fingerprint);
      if (res.status === 200) {
        addToast('success', res.message || 'Terima kasih sudah memilih!');
        // Update waifu vote count locally
        setWaifus((prev) => prev.map(w => w.id === waifuId ? { ...w, total_votes: (res.data?.total_votes ?? w.total_votes + 1) } : w));
        // Re-check cooldown
        fetchCooldown();
      } else if (res.status === 429) {
        addToast('error', res.message || 'Kamu sudah voting hari ini! Coba lagi besok.');
        if (res.meta?.nextAllowedAt) {
          setNextAllowedAt(new Date(res.meta.nextAllowedAt));
        }
      } else if (res.status === 409) {
        addToast('error', res.message || 'Perangkat ini sudah digunakan untuk vote di akun lain.');
      } else {
        addToast('error', res.message || 'Gagal mengirim vote. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsVoting(null);
    }
  };

  const isGlobalCooldown = !cooldownData?.can_vote;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-border/20 gap-4 text-left">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 bg-bg-surface border border-border/60 hover:border-primary/40 text-text-secondary hover:text-primary rounded-xl transition-all active:scale-95 focus:outline-none"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-text-primary tracking-tight leading-tight flex items-center gap-2">
              <Heart className="w-7 h-7 text-primary animate-pulse" />
              Waifu Vote
            </h1>
            <p className="text-xs text-muted font-medium mt-1">
              Dukung karakter favoritmu setiap harinya! (1 Vote per Hari)
            </p>
          </div>
        </div>
      </div>

      {/* Guest Warning */}
      {!isLoggedIn && (
        <div className="bg-bg-surface border border-dashed border-border/60 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-8 h-8 text-muted/60" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Harap Masuk Terlebih Dahulu</h3>
            <p className="text-xs text-muted mt-1">Hanya pengguna yang terdaftar yang dapat memberikan suara untuk mencegah kecurangan.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow mt-2"
          >
            Masuk Sekarang
          </button>
        </div>
      )}

      {/* Cooldown Banner */}
      {isLoggedIn && isGlobalCooldown && nextAllowedAt && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl animate-fade-in gap-3 text-left">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary shrink-0 animate-pulse" />
            <div>
              <span className="text-sm font-bold text-text-primary block">Batas Waktu Tunggu (Cooldown)</span>
              <span className="text-xs text-text-secondary mt-0.5 block">Kamu sudah menggunakan jatah vote harianmu di perangkat ini.</span>
            </div>
          </div>
          <div className="bg-primary/20 text-primary px-4 py-2 rounded-xl font-bold font-mono tracking-wider text-sm shadow-glow-sm shrink-0">
            Sisa: {timeLeftStr || 'Menghitung...'}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-bg-surface/50 border border-border/40 p-2 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama waifu atau anime..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-muted/70 pl-10 pr-4 py-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Waifu Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted">Mencari Waifu...</p>
        </div>
      ) : waifus.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {waifus.map((waifu, index) => (
            <div key={waifu.id} className="bg-bg-surface border border-border/40 hover:border-primary/40 transition-all rounded-2xl overflow-hidden flex flex-col group relative">
              {/* Rank Badge for top 3 in page 1 */}
              {page === 1 && index < 3 && (
                <div className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-black font-heading ${
                  index === 0 ? 'bg-yellow-400 text-black' :
                  index === 1 ? 'bg-slate-300 text-black' :
                  'bg-amber-600 text-white'
                }`}>
                  #{index + 1}
                </div>
              )}

              <div className="relative aspect-[3/4] overflow-hidden bg-bg-base/50">
                <img 
                  src={resolveSrc(waifu.image_url)} 
                  alt={waifu.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-bg-surface/70 opacity-80" />
                <div className="absolute bottom-0 left-0 w-full p-3 text-left">
                  <h3 className="font-bold text-text-primary text-sm line-clamp-1 drop-shadow-md">{waifu.name}</h3>
                  <p className="text-[10px] text-primary font-medium line-clamp-1 drop-shadow-md">{waifu.anime_title}</p>
                </div>
              </div>
              
              <div className="p-3 flex flex-col gap-3 grow">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="font-bold font-mono">{waifu.total_votes}</span>
                  </div>
                </div>

                {waifu.description && (
                  <p className="text-[10px] text-muted line-clamp-2 leading-relaxed">
                    {waifu.description}
                  </p>
                )}
                
                <button
                  onClick={() => handleVote(waifu.id)}
                  disabled={isVoting === waifu.id || isGlobalCooldown || !isLoggedIn}
                  className={`mt-auto w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isGlobalCooldown || !isLoggedIn
                      ? 'bg-bg-base/50 text-muted border border-border/30 cursor-not-allowed'
                      : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black hover:border-primary shadow-[inset_0_0_12px_rgba(255,102,205,0.1)] hover:shadow-glow'
                  }`}
                >
                  {isVoting === waifu.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Heart className={`w-3.5 h-3.5 ${isGlobalCooldown || !isLoggedIn ? 'opacity-50' : ''}`} />
                  )}
                  {isVoting === waifu.id ? 'Mengirim...' : 'Vote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-muted flex flex-col items-center">
          <Info className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">Tidak ada waifu yang ditemukan.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-bg-surface border border-border/60 hover:border-primary/40 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-text-secondary hover:text-text-primary"
          >
            Sblmnya
          </button>
          <span className="text-xs text-muted font-medium px-2">
            Hal {page} dari {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-bg-surface border border-border/60 hover:border-primary/40 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-text-secondary hover:text-text-primary"
          >
            Berikut
          </button>
        </div>
      )}
    </div>
  );
};
