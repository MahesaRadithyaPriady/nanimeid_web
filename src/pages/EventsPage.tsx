import React, { useEffect, useState } from 'react';
import { Gift, Calendar, Clock, Check, Lock, Coins, Award, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { 
  getSignInStatus, 
  claimSignIn, 
  getWatchStatus, 
  claimWatchTier,
} from '../lib/eventApi';
import type {
  SignInEventConfig,
  SignInProgress,
  WatchEventConfig,
  WatchProgress
} from '../lib/eventApi';

export const EventsPage: React.FC = () => {
  const { addToast } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  
  // Sign-in state
  const [signInConfig, setSignInConfig] = useState<SignInEventConfig | null>(null);
  const [signInProgress, setSignInProgress] = useState<SignInProgress | null>(null);
  const [isClaimingSignIn, setIsClaimingSignIn] = useState(false);

  // Watch state
  const [watchConfig, setWatchConfig] = useState<WatchEventConfig | null>(null);
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null);
  const [claimingTiers, setClaimingTiers] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [signInRes, watchRes] = await Promise.all([
        getSignInStatus().catch(() => null),
        getWatchStatus().catch(() => null)
      ]);

      if (signInRes?.status === 200) {
        setSignInConfig(signInRes.config);
        setSignInProgress(signInRes.progress);
      }
      
      if (watchRes?.status === 200) {
        setWatchConfig(watchRes.config);
        setWatchProgress(watchRes.progress);
      }
    } catch (err) {
      console.error('Failed to fetch events data', err);
      addToast('error', 'Gagal memuat data event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignInClaim = async () => {
    if (isClaimingSignIn) return;
    setIsClaimingSignIn(true);
    try {
      const res = await claimSignIn();
      if (res.status === 200) {
        let msg = `Berhasil claim absen!`;
        if (res.coins_awarded > 0) msg += ` +${res.coins_awarded} Koin`;
        if (res.granted_reward?.type !== 'NONE') {
          msg += ` & Hadiah ${res.granted_reward?.asset?.name || res.granted_reward?.type}`;
        }
        addToast('success', msg);
        
        // Refresh data to reflect new status
        await fetchData();
      } else {
        addToast('error', res.message || 'Gagal melakukan claim');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal melakukan claim');
    } finally {
      setIsClaimingSignIn(false);
    }
  };

  const handleWatchClaim = async (tier: any, index: number) => {
    const tierKey = tier.id ? `id:${tier.id}` : `index:${index}`;
    if (claimingTiers.has(tierKey)) return;

    setClaimingTiers(prev => {
      const newSet = new Set(prev);
      newSet.add(tierKey);
      return newSet;
    });

    try {
      const payload = tier.id ? { tier_id: tier.id } : { tier_index: index };
      const res = await claimWatchTier(payload);
      if (res.status === 200) {
        let msg = `Berhasil claim tier!`;
        if (res.coins_awarded > 0) msg += ` +${res.coins_awarded} Koin`;
        if (res.granted_reward?.type !== 'NONE') {
          msg += ` & Hadiah ${res.granted_reward?.asset?.name || res.granted_reward?.type}`;
        }
        addToast('success', msg);
        
        // Refresh data
        await fetchData();
      } else {
        addToast('error', res.message || 'Gagal claim tier ini');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal claim tier');
    } finally {
      setClaimingTiers(prev => {
        const newSet = new Set(prev);
        newSet.delete(tierKey);
        return newSet;
      });
    }
  };

  // UI Helpers
  const renderSignInGrid = () => {
    if (!signInConfig || !signInProgress) return null;

    const { days_total, daily_coin_rewards, daily_reward_types } = signInConfig;
    const { current_day, can_claim_today } = signInProgress;

    // Calculate the next day to claim
    // current_day = last claimed day, so next claim day is always current_day + 1
    const nextClaimDay = current_day + 1;

    const boxes = [];
    for (let i = 0; i < days_total; i++) {
      const dayNum = i + 1;
      const coinAmount = daily_coin_rewards[i] || 0;
      const rewardType = daily_reward_types[i] || 'NONE';
      
      // Days before nextClaimDay are past/claimed
      const isPast = dayNum < nextClaimDay;
      // The nextClaimDay is the current day to claim (highlighted)
      const isCurrent = dayNum === nextClaimDay && can_claim_today;

      boxes.push(
        <div 
          key={i} 
          className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
            isPast 
              ? 'bg-green-500/10 border-green-500/30' 
              : isCurrent 
                ? 'bg-primary/20 border-primary shadow-glow-sm scale-105 z-10' 
                : 'bg-bg-elevated border-border/40 opacity-70'
          }`}
        >
          <span className={`text-[10px] font-bold mb-1.5 uppercase tracking-wider ${isCurrent ? 'text-primary-light' : 'text-text-secondary'}`}>
            Hari {dayNum}
          </span>
          
          <div className="flex items-center justify-center h-8 w-8 mb-1">
            {isPast ? (
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
            ) : rewardType !== 'NONE' ? (
              <Award className={`w-7 h-7 ${isCurrent ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--color-primary),0.8)]' : 'text-muted'}`} />
            ) : (
              <div className="flex items-center gap-1">
                <Coins className={`w-5 h-5 ${isCurrent ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-muted'}`} />
                <span className={`text-xs font-bold ${isCurrent ? 'text-yellow-400' : 'text-text-secondary'}`}>+{coinAmount}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-bg-surface border border-border/50 rounded-2xl p-4 sm:p-6 text-left">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Check-in Harian
            </h3>
            <p className="text-xs text-muted mt-1">Masuk setiap hari untuk mendapatkan koin dan hadiah eksklusif. Siklus akan diulang setelah hari ke-{days_total}.</p>
          </div>
          {signInConfig.is_active ? (
            <div className="px-2.5 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider">Aktif</div>
          ) : (
             <div className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded uppercase tracking-wider">Nonaktif</div>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 mb-6">
          {boxes}
        </div>

        <button
          onClick={handleSignInClaim}
          disabled={!signInProgress.can_claim_today || isClaimingSignIn || !signInConfig.is_active}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            signInProgress.can_claim_today 
              ? 'bg-primary text-black hover:scale-[1.01] hover:shadow-glow active:scale-95' 
              : 'bg-bg-elevated text-muted cursor-not-allowed'
          }`}
        >
          {isClaimingSignIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : signInProgress.can_claim_today ? (
            <>
              <Sparkles className="w-5 h-5" />
              Claim Hadiah Hari Ini
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Sudah Claim Hari Ini
            </>
          )}
        </button>
      </div>
    );
  };

  const renderWatchTiers = () => {
    if (!watchConfig || !watchProgress) return null;

    const { thresholds } = watchConfig;
    const { minutes_watched_today, claimed_tiers } = watchProgress;

    // Find max minutes to set progress bar limit
    const maxMinutes = thresholds.reduce((max, t) => Math.max(max, t.minutes || 0), 0) || 120;
    const progressPercent = Math.min((minutes_watched_today / maxMinutes) * 100, 100);

    return (
      <div className="bg-bg-surface border border-border/50 rounded-2xl p-4 sm:p-6 text-left">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Misi Menonton Harian
            </h3>
            <p className="text-xs text-muted mt-1">Tonton anime untuk membuka kotak hadiah. Waktu dihitung dari durasi tayangan.</p>
          </div>
          {watchConfig.is_active ? (
            <div className="px-2.5 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider">Aktif</div>
          ) : (
             <div className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded uppercase tracking-wider">Nonaktif</div>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] font-bold text-text-secondary mb-1.5">
            <span>Progress: {minutes_watched_today} Menit</span>
            <span>Maks: {maxMinutes} Menit</span>
          </div>
          <div className="w-full h-2.5 bg-bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-stripes" />
            </div>
          </div>
        </div>

        {/* Tiers List */}
        <div className="space-y-3">
          {thresholds.map((tier, idx) => {
            const tierKey = tier.id ? `id:${tier.id}` : `index:${idx}`;
            const isClaimed = claimed_tiers?.includes(tierKey) ?? false;
            const reqMinutes = tier.minutes || 0;
            const isEligible = minutes_watched_today >= reqMinutes;
            const isClaiming = claimingTiers.has(tierKey);

            return (
              <div key={tierKey} className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border ${
                isClaimed 
                  ? 'bg-bg-base border-border/20 opacity-60' 
                  : isEligible 
                    ? 'bg-primary/5 border-primary/30 shadow-glow-sm' 
                    : 'bg-bg-elevated border-border/40'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isClaimed ? 'bg-green-500/20 text-green-400' : isEligible ? 'bg-primary/20 text-primary' : 'bg-bg-surface text-muted'
                  }`}>
                    {isClaimed ? <Check className="w-5 h-5" /> : tier.reward_type !== 'NONE' ? <Award className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Tonton {reqMinutes} Menit</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-text-secondary">
                      <span>Hadiah:</span>
                      {tier.reward_type !== 'NONE' ? (
                        <span className="text-primary-light">Tipe {tier.reward_type}</span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-0.5"><Coins className="w-3 h-3" /> +{tier.coin_reward} Koin</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleWatchClaim(tier, idx)}
                  disabled={isClaimed || !isEligible || isClaiming || !watchConfig.is_active}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isClaimed 
                      ? 'bg-transparent text-text-secondary border border-border/50 cursor-not-allowed' 
                      : isEligible 
                        ? 'bg-primary text-black hover:scale-105 active:scale-95 shadow-glow' 
                        : 'bg-bg-surface text-muted cursor-not-allowed'
                  }`}
                >
                  {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : isClaimed ? 'Terklaim' : isEligible ? 'Klaim' : <Lock className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in text-center px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-border/20">
        <div className="w-12 h-12 rounded-xl bg-primary/ flex items-center justify-center mb-3">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-text-primary tracking-tight leading-tight">
          Misi & Event
        </h1>
        <p className="text-sm text-muted font-medium mt-2 max-w-md">
          Selesaikan misi harian untuk mendapatkan koin gratis dan badge eksklusif!
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted">Memuat data event...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!signInConfig && !watchConfig && (
             <div className="py-12 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl bg-bg-surface/20">
                <AlertCircle className="w-10 h-10 text-muted/40 mb-3" />
                <p className="text-sm text-muted font-medium">Saat ini belum ada event yang aktif.</p>
             </div>
          )}

          {renderSignInGrid()}
          {renderWatchTiers()}
        </div>
      )}

    </div>
  );
};

export default EventsPage;
