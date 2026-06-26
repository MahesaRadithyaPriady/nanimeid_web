import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MessageSquare, History, CheckCircle, Flame, Clock, 
  Heart, ExternalLink, Lock, AlertCircle, Loader2
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { BorderImage } from '../components/ui/BorderImage';
import { resolveSrc } from '../lib/utils';
import { 
  fetchPublicProfile, 
  fetchProfileComments, 
  fetchProfileRecentWatched, 
  fetchProfileCompletedEpisodes, 
  fetchProfileSignInStreak 
} from '../lib/profileApi';
import type { 
  ApiUserProfile, 
  ApiProfileCommentItem, 
  ApiProfileWatchedItem, 
  ApiProfileCompletedItem, 
  ApiProfileStreak,
  AffinityRelationType
} from '../types';
import { requestAffinity } from '../lib/affinityApi';
import { Modal } from '../components/ui/Modal';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { addToast, isLoggedIn, userProfile } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'watched' | 'comments' | 'completed' | 'streak'>('watched');
  const [loadingTab, setLoadingTab] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  // Tab data
  const [watchedData, setWatchedData] = useState<ApiProfileWatchedItem[]>([]);
  const [commentsData, setCommentsData] = useState<ApiProfileCommentItem[]>([]);
  const [completedData, setCompletedData] = useState<{ count: number; episodes: ApiProfileCompletedItem['episodes'] } | null>(null);
  const [streakData, setStreakData] = useState<ApiProfileStreak | null>(null);

  // Affinity Request States
  const [isAffinityModalOpen, setIsAffinityModalOpen] = useState(false);
  const [affinityType, setAffinityType] = useState<AffinityRelationType>('TEMAN');
  const [submittingAffinity, setSubmittingAffinity] = useState(false);

  const handleRequestAffinity = async () => {
    if (!profile) return;
    setSubmittingAffinity(true);
    try {
      const res = await requestAffinity(profile.id, affinityType);
      addToast('success', res.message || 'Permintaan afinitas terkirim!');
      setIsAffinityModalOpen(false);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengirim permintaan');
    } finally {
      setSubmittingAffinity(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetchPublicProfile(userId!);
        if (res && res.data) {
          setProfile(res.data);
        }
      } catch (err: any) {
        console.error(err);
        addToast('error', err.message || 'Gagal memuat profil pengguna.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId, addToast]);

  // Load Tab Content dynamically based on activeTab
  useEffect(() => {
    if (!userId || !profile) return;

    async function loadTabContent() {
      setLoadingTab(true);
      setTabError(null);
      try {
        if (activeTab === 'watched') {
          const res = await fetchProfileRecentWatched(userId!);
          setWatchedData(res.data || []);
        } else if (activeTab === 'comments') {
          const res = await fetchProfileComments(userId!);
          setCommentsData(res.data || []);
        } else if (activeTab === 'completed') {
          const res = await fetchProfileCompletedEpisodes(userId!);
          setCompletedData(res.data || { count: 0, episodes: [] });
        } else if (activeTab === 'streak') {
          const res = await fetchProfileSignInStreak(userId!);
          setStreakData(res.data || null);
        }
      } catch (err: any) {
        console.error(err);
        setTabError(err.message || 'Data disembunyikan oleh pengaturan privasi pengguna.');
      } finally {
        setLoadingTab(false);
      }
    }

    loadTabContent();
  }, [userId, activeTab, profile]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted">Memuat profil pengguna...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Profil Tidak Ditemukan</h2>
        <p className="text-sm text-muted">Pengguna tidak terdaftar atau telah dinonaktifkan.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-primary text-black font-bold text-xs rounded-xl shadow-glow">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Format watched duration to hours and minutes
  const formatMinutes = (minutes?: number) => {
    if (!minutes) return '0 menit';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs} jam ${mins} menit`;
    }
    return `${mins} menit`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left animate-fade-in">
      
      {/* Banner Profil */}
      <div className="relative h-40 sm:h-52 w-full rounded-2xl overflow-hidden border border-border/40 bg-bg-surface shadow-lg">
        {profile.profile?.banner_url ? (
          <img
            src={profile.profile.banner_url}
            alt="Banner Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/ flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,102,205,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,102,205,0.4) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
          </div>
        )}
        
        {/* Status Online/Offline Badge overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <span className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {profile.is_online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 relative">
        
        {/* Avatar with active border overlay */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden relative bg-bg-base border-2 border-primary/50 flex items-center justify-center shadow-glow">
            {profile.avatar_border_active ? (
              <BorderImage
                src={profile.avatar_border_active.image_url}
                alt="avatar border"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
            ) : null}
            <UserAvatar
              src={profile.profile?.avatar_url || ''}
              name={profile.profile?.full_name || profile.username}
              className="w-full h-full rounded-full text-3xl"
            />
          </div>
        </div>

        {/* User Metadata */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-3xl font-black font-heading text-text-primary tracking-tight">
              {profile.profile?.full_name || profile.username}
            </h2>
            <span className="text-xs text-muted font-semibold">@{profile.username}</span>
            <span className="hidden sm:inline text-muted">•</span>
            <span className="text-muted font-mono bg-bg-base px-1.5 py-0.5 rounded border border-border/40 text-[10px]">ID: {profile.id ?? '-'}</span>
            {profile.vip && profile.vip.status === 'ACTIVE' && (
              <span className="px-2 py-0.5 rounded bg-primary text-black font-mono font-black text-[9px] uppercase tracking-wider shadow-glow">
                VIP {profile.vip.vip_level && profile.vip.vip_level !== 'FREE' ? profile.vip.vip_level : ''}
              </span>
            )}
            {profile.super_badge_active && (
              <span 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider"
                style={{ 
                  borderColor: profile.super_badge_active.title_color || '#ff66cd',
                  color: profile.super_badge_active.title_color || '#ff66cd',
                  backgroundColor: `${profile.super_badge_active.title_color || '#ff66cd'}10`
                }}
              >
                {profile.super_badge_active.badge_icon && (
                  <img src={profile.super_badge_active.badge_icon} alt="badge" className="w-3 h-3 object-contain" />
                )}
                {profile.super_badge_active.badge_name}
              </span>
            )}
            {profile.account_status && profile.account_status !== 'ACTIVE' && (
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-black text-[9px] uppercase tracking-wider shadow-glow-sm shadow-red-500/50">
                {profile.account_status}
              </span>
            )}
          </div>

          {profile.profile?.bio && (
            <p className="text-sm text-text-secondary max-w-xl leading-relaxed italic">
              "{profile.profile.bio}"
            </p>
          )}

          {/* Social Stats & Joined Date */}
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted font-medium">
            <div className="flex gap-1.5">
              <span className="text-text-primary font-bold">{profile.social?.followers_count || 0}</span> Pengikut
            </div>
            <div className="flex gap-1.5">
              <span className="text-text-primary font-bold">{profile.social?.following_count || 0}</span> Mengikuti
            </div>
            {profile.account_created_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Bergabung {new Date(profile.account_created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider">
              Level {profile.level?.level_number || 1} ({profile.stats?.xp || 0} XP)
            </span>
            {!profile.is_online && profile.last_seen_at && (
              <span className="px-2.5 py-0.5 rounded-full bg-bg-base border border-border/60 text-[10px] font-bold text-muted uppercase font-mono tracking-wider">
                Aktif {new Date(profile.last_seen_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Affinity Badges */}
          {profile.affinity_summary && (profile.affinity_summary.pacar > 0 || profile.affinity_summary.sahabat > 0 || profile.affinity_summary.teman > 0) && (
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              {profile.affinity_summary.pacar > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-bold text-pink-500 uppercase tracking-wider flex items-center gap-1 shadow-glow-sm shadow-pink-500/20">
                  <Heart className="w-3 h-3 fill-pink-500" /> Pacar
                </span>
              )}
              {profile.affinity_summary.sahabat > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1 shadow-glow-sm shadow-orange-500/20">
                  <Flame className="w-3 h-3 fill-orange-500/50" /> {profile.affinity_summary.sahabat} Sahabat
                </span>
              )}
              {profile.affinity_summary.teman > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {profile.affinity_summary.teman} Teman
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isLoggedIn && userProfile?.id !== profile.id && (
            <div className="pt-3 flex justify-center sm:justify-start">
              <button 
                onClick={() => setIsAffinityModalOpen(true)}
                className="px-4 py-1.5 bg-bg-base hover:bg-bg-elevated border border-primary/40 hover:border-primary text-primary text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                Ajak Afinitas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Waktu Menonton', val: formatMinutes(profile.stats?.minutes_watched), icon: <Clock className="w-5 h-5 text-primary" /> },
          { label: 'Suka Diterima', val: `${profile.stats?.likes_received || profile.stats?.likes || 0} Like`, icon: <Heart className="w-5 h-5 text-red-500 fill-red-500/10" /> },
          { label: 'Komentar Diposting', val: `${profile.stats?.comments_count || 0} Komentar`, icon: <MessageSquare className="w-5 h-5 text-blue-400" /> }
        ].map((item, idx) => (
          <div key={idx} className="bg-bg-surface border border-border/40 rounded-2xl p-5 flex items-center gap-4 shadow-md">
            <div className="p-3 bg-bg-base rounded-xl border border-border/60">
              {item.icon}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black text-text-primary font-heading leading-tight">{item.val}</span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Extra Activity / Tabs */}
      <div className="space-y-4">
        {/* Tabs Bar */}
        <div className="flex border-b border-border/40 gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'watched', label: 'Riwayat Nonton', icon: <History className="w-4 h-4" /> },
            { id: 'comments', label: 'Komentar', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'completed', label: 'Selesai Hari Ini', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'streak', label: 'Streak Masuk', icon: <Flame className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all whitespace-nowrap focus:outline-none ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel Content */}
        <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 min-h-[200px]">
          {loadingTab ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <span className="text-xs text-muted">Memuat data tab...</span>
            </div>
          ) : tabError ? (
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
              <Lock className="w-8 h-8 text-muted/60" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Aktivitas Terkunci</h4>
              <p className="text-[11px] text-muted leading-normal">
                {tabError}
              </p>
            </div>
          ) : (
            <div>
              {/* Tab: Watched */}
              {activeTab === 'watched' && (
                <div className="space-y-4">
                  {watchedData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {watchedData.map((w) => (
                        <Link 
                          key={w.id} 
                          to={`/watch/${w.anime?.id || w.episode?.anime?.id || 1}/ep/${w.episode?.nomor_episode || 1}`}
                          className="flex items-center gap-3 p-3 bg-bg-base/40 hover:bg-bg-elevated/55 border border-border/40 rounded-xl transition-all group"
                        >
                          <div className="relative w-24 aspect-[16/9] rounded-lg overflow-hidden border border-border/60 shrink-0 bg-bg-base">
                            <img 
                              src={w.anime?.gambar_anime || w.anime?.image_url || w.anime?.thumbnail_url || w.anime?.banner || w.anime?.banner_url || w.anime?.cover || w.anime?.cover_url || w.anime?.poster || w.anime?.poster_url || w.anime?.image || w.episode?.anime?.gambar_anime || w.episode?.anime?.image_url || w.episode?.anime?.banner_url || w.episode?.anime?.cover_url || w.episode?.anime?.poster_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop'} 
                              alt={w.episode?.judul_episode || w.episode?.title || w.episode?.nama_episode || w.episode?.episode_title || w.judul_episode || w.title || w.nama_episode || w.episode_title || 'Anime'} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {w.is_completed && (
                              <span className="absolute top-1 left-1 bg-green-500 text-black font-black text-[7px] px-1 py-0.5 rounded uppercase font-mono">
                                Selesai
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left space-y-1">
                            <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                              {w.anime?.nama_anime || w.anime?.title || w.episode?.anime?.nama_anime || w.episode?.anime?.title || 'Anime Tidak Diketahui'}
                            </h4>
                            <p className="text-[10px] text-text-secondary truncate">
                              Episode {w.episode?.nomor_episode || w.episode?.episode_number || w.nomor_episode || w.episode_number || 1}: {w.episode?.judul_episode || w.episode?.title || w.episode?.nama_episode || w.episode?.episode_title || w.judul_episode || w.title || w.nama_episode || w.episode_title || 'Tanpa Judul'}
                            </p>
                            <span className="text-[9px] text-muted font-mono block">
                              Ditonton {new Date(w.last_watched || w.updatedAt || w.updated_at || w.createdAt || w.created_at || w.watched_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted text-xs">
                      Belum ada riwayat tontonan publik yang terekam.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Comments */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {commentsData.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {commentsData.map((c) => (
                        <div key={c.id} className="py-4 first:pt-0 last:pb-0 space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted font-mono">
                              {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {c.anime && (
                              <Link 
                                to={c.episode_id ? `/watch/${c.anime.id}/ep/${c.episode?.nomor_episode || 1}` : `/anime/${c.anime.id}`}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                <span>{c.anime.nama_anime} {c.episode ? `(Ep ${c.episode.nomor_episode})` : ''}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                          
                          {c.kind === 'STICKER' ? (
                            <div className="p-2 bg-bg-base/30 rounded-xl inline-block border border-border/20">
                              <img src={c.content} alt="Stiker Komentar" className="h-14 w-auto object-contain" />
                            </div>
                          ) : (
                            <p className="text-xs text-text-primary leading-relaxed bg-bg-base/30 p-3 rounded-xl border border-border/30">
                              {c.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted text-xs">
                      Belum menulis komentar apapun.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Completed Today */}
              {activeTab === 'completed' && (
                <div className="space-y-4">
                  {completedData && completedData.episodes.length > 0 ? (
                    <div className="space-y-4 text-left">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">Tantangan Harian: Selesai Ditonton Hari Ini</span>
                        <span className="text-xs font-black font-mono text-primary bg-black/45 px-2.5 py-1 rounded-lg">
                          {completedData.count} EPISODE
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {completedData.episodes.map((item) => (
                          <div key={item.id} className="p-3 bg-bg-base/40 border border-border/40 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-text-primary truncate">{item.episode?.anime?.nama_anime || 'Anime Tidak Diketahui'}</h4>
                              <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                Episode {item.episode?.nomor_episode || 1}: {item.episode?.judul_episode || 'Tanpa Judul'}
                              </p>
                            </div>
                            <span className="text-[9px] text-muted shrink-0 font-mono">
                              {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted text-xs">
                      Belum menyelesaikan episode tontonan apapun hari ini.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Streak */}
              {activeTab === 'streak' && (
                <div className="space-y-6 max-w-md mx-auto py-4 text-center">
                  {streakData ? (
                    <div className="space-y-5">
                      <div className="flex justify-center">
                        <div className="relative">
                          <Flame className="w-16 h-16 text-primary fill-primary/10 animate-bounce" />
                          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black font-heading text-text-primary">{streakData.current_streak} Hari</h3>
                        <p className="text-[11px] text-muted uppercase tracking-wider font-bold">Streak Absensi Saat Ini</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/20 pt-5 text-left">
                        <div className="p-3 bg-bg-base/40 border border-border/40 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase block">Streak Terpanjang</span>
                          <span className="text-sm font-bold text-text-primary font-mono">{streakData.max_streak ?? streakData.longest_streak ?? 0} Hari</span>
                        </div>
                        <div className="p-3 bg-bg-base/40 border border-border/40 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase block">Total Claim</span>
                          <span className="text-sm font-bold text-text-primary font-mono">{streakData.total_claims ?? 0}</span>
                        </div>
                        <div className="p-3 bg-bg-base/40 border border-border/40 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-muted uppercase block">Claim Terakhir</span>
                          <span className="text-sm font-bold text-text-primary font-mono">
                            {streakData.last_sign_in
                              ? new Date(streakData.last_sign_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                              : '-'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted text-xs">
                      Gagal mengambil data streak absensi.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Affinity Modal */}
      <Modal 
        isOpen={isAffinityModalOpen} 
        onClose={() => setIsAffinityModalOpen(false)}
        title="Kirim Permintaan Afinitas"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Pilih jenis hubungan yang ingin kamu bangun dengan <strong>{profile.profile?.full_name || profile.username}</strong>:
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'PACAR', label: 'Pacar', desc: 'Hanya bisa punya 1 pacar.', icon: <Heart className="w-4 h-4 text-pink-500" /> },
              { id: 'SAHABAT', label: 'Sahabat', desc: 'Teman yang sangat dekat.', icon: <Flame className="w-4 h-4 text-orange-500" /> },
              { id: 'TEMAN', label: 'Teman', desc: 'Teman biasa atau kenalan.', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> }
            ].map((type) => (
              <label 
                key={type.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  affinityType === type.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/40 hover:border-primary/50 hover:bg-bg-base'
                }`}
              >
                <div className="pt-0.5">
                  <input 
                    type="radio" 
                    name="affinity_type" 
                    value={type.id} 
                    checked={affinityType === type.id}
                    onChange={(e) => setAffinityType(e.target.value as AffinityRelationType)}
                    className="accent-primary"
                  />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary text-sm">
                    {type.icon} {type.label}
                  </div>
                  <p className="text-xs text-text-secondary">{type.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button 
              onClick={() => setIsAffinityModalOpen(false)}
              className="px-4 py-2 bg-bg-base hover:bg-border/40 text-text-secondary font-bold text-xs rounded-xl transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleRequestAffinity}
              disabled={submittingAffinity}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-black font-black text-xs rounded-xl transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submittingAffinity ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Permintaan'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default UserProfilePage;
