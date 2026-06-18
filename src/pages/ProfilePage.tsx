import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { 
  Bell, Edit3, Save, History, 
  Bookmark, LogOut, ChevronDown, User, Play, Info, Sliders,
  MessageSquare, CheckCircle, Flame, Clock, Heart, ExternalLink, Lock, Loader2,
  Award, Gift, Star, TrendingUp, Ticket, Sparkles, ChevronRight
} from 'lucide-react';
import { 
  checkBirthdateStatus, 
  updateMyProfile, 
  uploadAvatar, 
  uploadBanner,
  fetchProfileRecentWatched, 
  fetchProfileComments, 
  fetchProfileCompletedEpisodes, 
  fetchProfileSignInStreak 
} from '../lib/profileApi';
import {
  fetchMyXp,
  fetchXpLevels,
  claimXpReward,
  claimAllLevelRewards,
  fetchXpHistory,
  fetchXpStats,
  type XpMeData,
  type XpLevelWithRewards,
  type XpHistoryEntry,
  type XpStats,
} from '../lib/xpApi';
import type { 
  ApiProfileCommentItem, 
  ApiProfileWatchedItem, 
  ApiProfileCompletedItem, 
  ApiProfileStreak 
} from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    userProfile, updateProfile, addToast, 
    watchHistory, bookmarks, logout, fetchAndSetMissingCovers, fetchMyProfileData
  } = useAppStore();

  useEffect(() => {
    fetchAndSetMissingCovers();
  }, [fetchAndSetMissingCovers]);

  // Local Form state
  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username || '');
  const [email, setEmail] = useState(userProfile.email);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>(userProfile.gender || '');
  const [birthdate, setBirthdate] = useState(userProfile.birthdate || '');
  
  const [subLang, setSubLang] = useState(userProfile.subPreference);
  const [quality, setQuality] = useState(userProfile.qualityPreference);
  const [notify, setNotify] = useState(userProfile.notify);

  const [isEditing, setIsEditing] = useState(false);
  const [isBirthdateSet, setIsBirthdateSet] = useState(false);
  const [activeSection, setActiveSection] = useState<'none' | 'account' | 'player' | 'app'>('none');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Tab states
  const [activeTab, setActiveTab] = useState<'watched' | 'comments' | 'completed' | 'streak' | 'levels'>('watched');
  const [loadingTab, setLoadingTab] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  // XP & Level state
  const [xpData, setXpData] = useState<XpMeData | null>(null);
  const [levelsList, setLevelsList] = useState<XpLevelWithRewards[]>([]);
  const [loadingXp, setLoadingXp] = useState(false);
  const [claimingReward, setClaimingReward] = useState<number | null>(null);
  const [xpHistory, setXpHistory] = useState<XpHistoryEntry[]>([]);
  const [xpStats, setXpStats] = useState<XpStats | null>(null);

  // Tab data
  const [watchedData, setWatchedData] = useState<ApiProfileWatchedItem[]>([]);
  const [commentsData, setCommentsData] = useState<ApiProfileCommentItem[]>([]);
  const [completedData, setCompletedData] = useState<{ count: number; episodes: ApiProfileCompletedItem['episodes'] } | null>(null);
  const [streakData, setStreakData] = useState<ApiProfileStreak | null>(null);

  // Load Tab Content dynamically based on activeTab
  useEffect(() => {
    if (!userProfile?.id) return;

    async function loadTabContent() {
      setLoadingTab(true);
      setTabError(null);
      try {
        if (activeTab === 'watched') {
          const res = await fetchProfileRecentWatched(userProfile.id!);
          setWatchedData(res.data || []);
        } else if (activeTab === 'comments') {
          const res = await fetchProfileComments(userProfile.id!);
          setCommentsData(res.data || []);
        } else if (activeTab === 'completed') {
          const res = await fetchProfileCompletedEpisodes(userProfile.id!);
          setCompletedData(res.data || { count: 0, episodes: [] });
        } else if (activeTab === 'streak') {
          const res = await fetchProfileSignInStreak(userProfile.id!);
          setStreakData(res.data || null);
        } else if (activeTab === 'levels') {
          // XP data is already loaded on page mount, refresh if needed
          const xpRes = await fetchMyXp();
          setXpData(xpRes.data);
          const levelsRes = await fetchXpLevels();
          setLevelsList(levelsRes.data || []);
          // Fetch XP history and stats
          try {
            const historyRes = await fetchXpHistory(20);
            setXpHistory(historyRes.data || []);
          } catch (e) {
            console.log('XP history endpoint not available:', e);
          }
          try {
            const statsRes = await fetchXpStats();
            setXpStats(statsRes.data);
          } catch (e) {
            console.log('XP stats endpoint not available:', e);
          }
        }
      } catch (err: any) {
        console.error(err);
        setTabError(err.message || 'Data disembunyikan atau gagal dimuat.');
      } finally {
        setLoadingTab(false);
      }
    }

    loadTabContent();
  }, [userProfile?.id, activeTab]);

  // Sync state with store profile updates
  useEffect(() => {
    setName(userProfile.name);
    setUsername(userProfile.username || '');
    setEmail(userProfile.email || '');
    setBio(userProfile.bio || '');
    setGender(userProfile.gender || '');
    setBirthdate(userProfile.birthdate || '');
    setSubLang(userProfile.subPreference);
    setQuality(userProfile.qualityPreference);
    setNotify(userProfile.notify);
  }, [userProfile]);

  useEffect(() => {
    async function loadBirthdateStatus() {
      try {
        const res = await checkBirthdateStatus();
        setIsBirthdateSet(res.is_set);
      } catch (e) {
        console.error('Failed to fetch birthdate status:', e);
      }
    }
    loadBirthdateStatus();
  }, []);

  // Fetch XP data on page load
  useEffect(() => {
    async function loadXpData() {
      setLoadingXp(true);
      try {
        const xpRes = await fetchMyXp();
        setXpData(xpRes.data);
        
        const levelsRes = await fetchXpLevels();
        setLevelsList(levelsRes.data || []);
      } catch (err) {
        console.error('Failed to load XP data:', err);
      } finally {
        setLoadingXp(false);
      }
    }
    loadXpData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMyProfile({
        full_name: name,
        username,
        bio,
        gender: gender || null,
        birthdate: birthdate || undefined
      });
      await fetchMyProfileData();
      setIsEditing(false);
      addToast('success', 'Profil berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      addToast('error', err.message || 'Gagal menyimpan profil.');
    }
  };

  const handleAvatarChange = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      addToast('info', 'Mengunggah avatar...');
      await uploadAvatar(file);
      await fetchMyProfileData();
      addToast('success', 'Avatar berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      if (String(err.message).includes('VIP') || String(err).includes('403')) {
        addToast('error', 'Gagal: Fitur ini khusus untuk anggota VIP!');
      } else {
        addToast('error', err.message || 'Gagal mengunggah avatar.');
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      addToast('info', 'Mengunggah banner...');
      await uploadBanner(file);
      await fetchMyProfileData();
      addToast('success', 'Banner berhasil diperbarui!');
    } catch (err: any) {
      console.error(err);
      if (String(err.message).includes('VIP') || String(err).includes('403')) {
        addToast('error', 'Gagal: Fitur ini khusus untuk anggota VIP!');
      } else {
        addToast('error', err.message || 'Gagal mengunggah banner.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    addToast('success', 'Berhasil keluar dari akun');
    navigate('/');
  };

  const handleClaimReward = async (rewardId: number, rewardType: string) => {
    setClaimingReward(rewardId);
    try {
      await claimXpReward(rewardId);
      addToast('success', `Reward ${rewardType} berhasil diklaim!`);
      // Refresh levels list to update claimed status
      const levelsRes = await fetchXpLevels();
      setLevelsList(levelsRes.data || []);
      // Refresh XP data to update balance
      const xpRes = await fetchMyXp();
      setXpData(xpRes.data);
    } catch (err: any) {
      console.error('Failed to claim reward:', err);
      addToast('error', err.message || 'Gagal mengklaim reward.');
    } finally {
      setClaimingReward(null);
    }
  };

  const handleClaimAllRewards = async (levelId: number, levelTitle: string) => {
    setClaimingReward(-levelId); // Use negative levelId to indicate claim-all
    try {
      const res = await claimAllLevelRewards(levelId);
      const claimed = res.data.claimedCount;
      addToast('success', `${claimed} reward ${levelTitle} berhasil diklaim!`);
      // Refresh data
      const levelsRes = await fetchXpLevels();
      setLevelsList(levelsRes.data || []);
      const xpRes = await fetchMyXp();
      setXpData(xpRes.data);
    } catch (err: any) {
      console.error('Failed to claim all rewards:', err);
      addToast('error', err.message || 'Gagal mengklaim reward.');
    } finally {
      setClaimingReward(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left">
      
      {/* Banner Profil (YouTube Style) */}
      <div className="relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-border/40 bg-bg-surface shadow-lg group">
        {userProfile.bannerUrl ? (
          <img
            src={userProfile.bannerUrl}
            alt="Banner Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary-light/5 to-bg-base flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,102,205,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,102,205,0.4) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">NanimeID Premium Banner</span>
          </div>
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-[10px] font-bold border border-white/10 hover:border-primary/50 transition-all flex items-center gap-1.5 active:scale-95 shadow-lg focus:outline-none"
        >
          <Edit3 className="w-3 h-3" />
          <span>Ganti Banner</span>
        </button>
        <input
          type="file"
          ref={bannerInputRef}
          onChange={handleBannerUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* 1. Header Profil (YouTube Style) */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8">
        
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-glow relative bg-bg-base flex items-center justify-center">
            {userProfile.avatarBorderActive ? (
              <div 
                className="absolute inset-0 z-10 pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: `url(${userProfile.avatarBorderActive.image_url})` }}
              />
            ) : null}
            <UserAvatar
              src={userProfile.avatarUrl}
              name={userProfile.name}
              className="w-full h-full rounded-full text-2xl"
            />
          </div>
          <button
            onClick={handleAvatarChange}
            className="absolute bottom-0 right-0 z-20 p-1.5 bg-primary hover:bg-primary-light text-black rounded-full shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none"
            aria-label="Ganti avatar"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User metadata */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-black font-heading text-text-primary tracking-tight">
              {userProfile.name}
            </h2>
            <span className="text-xs text-muted font-semibold">@{userProfile.username}</span>
            <span className="hidden sm:inline text-muted">•</span>
            <span className="text-muted font-mono bg-bg-base px-1.5 py-0.5 rounded border border-border/40 text-[10px]">ID: {userProfile.id ?? '-'}</span>
            
            {userProfile.isVip && (
              <span className="px-2 py-0.5 rounded bg-primary text-black font-mono font-black text-[9px] uppercase tracking-wider shadow-glow">
                VIP {userProfile.vipLevel && userProfile.vipLevel !== 'FREE' ? userProfile.vipLevel : ''}
              </span>
            )}

            {userProfile.superBadgeActive && (
              <span 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider"
                style={{ 
                  borderColor: userProfile.superBadgeActive.title_color || '#ff66cd',
                  color: userProfile.superBadgeActive.title_color || '#ff66cd',
                  backgroundColor: `${userProfile.superBadgeActive.title_color || '#ff66cd'}10`
                }}
              >
                {userProfile.superBadgeActive.badge_icon && (
                  <img src={userProfile.superBadgeActive.badge_icon} alt="badge" className="w-3 h-3 object-contain" />
                )}
                {userProfile.superBadgeActive.badge_name}
              </span>
            )}

            {userProfile.accountStatus && userProfile.accountStatus !== 'ACTIVE' && (
              <span className="px-2 py-0.5 rounded bg-red-500 text-white font-black text-[9px] uppercase tracking-wider shadow-glow-sm shadow-red-500/50">
                {userProfile.accountStatus}
              </span>
            )}
          </div>

          <p className="text-sm text-text-secondary line-clamp-2 max-w-xl">
            {userProfile.bio || <span className="italic opacity-50">Belum ada bio.</span>}
          </p>

          {/* Social Stats & Joined Date */}
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted font-medium">
            <div className="flex gap-1.5">
              <span className="text-text-primary font-bold">{userProfile.social?.followers_count || 0}</span> Pengikut
            </div>
            <div className="flex gap-1.5">
              <span className="text-text-primary font-bold">{userProfile.social?.following_count || 0}</span> Mengikuti
            </div>
            {userProfile.accountCreatedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Bergabung {new Date(userProfile.accountCreatedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            {loadingXp ? (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading XP...
              </span>
            ) : xpData ? (
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Award className="w-3 h-3" />
                    Level {xpData.level?.level_number ?? '?'} — {xpData.level?.title ?? 'Unknown'}
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {xpData.current_xp} XP
                  </span>
                </div>
                {/* XP Progress Bar */}
                <div className="relative w-full h-2 bg-bg-base rounded-full overflow-hidden border border-border/40">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                    style={{ width: `${Math.min(xpData.progress.percent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted font-mono">
                  <span>{xpData.progress.currentLevelXpRequired} XP</span>
                  <span className="text-primary font-bold">{xpData.progress.percent}%</span>
                  <span>{xpData.progress.nextLevelXpRequired ?? 'MAX'} XP</span>
                </div>
                {xpData.progress.xpToNext > 0 && (
                  <span className="text-[9px] text-text-secondary">
                    Butuh <strong className="text-primary">{xpData.progress.xpToNext} XP</strong> lagi ke level berikutnya
                  </span>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider">
                Level {userProfile.level} ({userProfile.xp} XP)
              </span>
            )}
          </div>
        </div>
        
        {/* Logout action */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 hover:border-red-500 text-red-400 text-xs font-bold rounded-xl active:scale-95 transition-all duration-300 focus:outline-none shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 inline mr-1.5" />
          Keluar
        </button>
      </div>

      {/* 2. Stats Dashboard Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Waktu Menonton', val: (userProfile.minutesWatched || 0) > 60 ? `${Math.floor((userProfile.minutesWatched || 0) / 60)}j ${(userProfile.minutesWatched || 0) % 60}m` : `${userProfile.minutesWatched || 0} menit`, icon: <Clock className="w-5 h-5 text-primary" /> },
          { label: 'Suka Diterima', val: `${userProfile.likes || 0} Like`, icon: <Heart className="w-5 h-5 text-red-500 fill-red-500/10" /> },
          { label: 'Komentar Diposting', val: `${userProfile.commentsCount || 0} Komentar`, icon: <MessageSquare className="w-5 h-5 text-blue-400" /> }
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
            { id: 'watched', label: 'Riwayat Nonton Publik', icon: <History className="w-4 h-4" /> },
            { id: 'comments', label: 'Komentar Publik', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'completed', label: 'Selesai Hari Ini', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'streak', label: 'Streak Masuk', icon: <Flame className="w-4 h-4" /> },
            { id: 'levels', label: 'Level & Reward', icon: <Award className="w-4 h-4" /> }
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
                              Ditonton {new Date(w.updatedAt || w.updated_at || w.createdAt || w.created_at || w.watched_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
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
                              <h4 className="text-xs font-bold text-text-primary truncate">{item.anime?.nama_anime || item.anime?.title || item.episode?.anime?.nama_anime || item.episode?.anime?.title || 'Anime Tidak Diketahui'}</h4>
                              <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                Episode {item.episode?.nomor_episode || item.episode?.episode_number || item.nomor_episode || item.episode_number || 1}: {item.episode?.judul_episode || item.episode?.title || item.judul_episode || item.title || 'Tanpa Judul'}
                              </p>
                            </div>
                            <span className="text-[9px] text-muted shrink-0 font-mono">
                              {new Date(item.last_watched || item.updatedAt || item.updated_at || item.createdAt || item.created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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

              {/* Tab: Level & Rewards */}
              {activeTab === 'levels' && (
                <div className="space-y-6 py-4">
                  {/* XP Summary Card */}
                  {xpData && (
                    <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/20 rounded-xl">
                            <Star className="w-6 h-6 text-primary fill-primary/30" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">Level {xpData.level?.level_number ?? '?'} — {xpData.level?.title ?? 'Unknown'}</h4>
                            <p className="text-[10px] text-muted font-mono">{xpData.current_xp} Total XP</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-primary font-heading">{xpData.progress.percent}%</span>
                          <p className="text-[9px] text-muted font-bold uppercase">Progress</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="relative w-full h-3 bg-bg-base rounded-full overflow-hidden border border-border/40">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min(xpData.progress.percent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted font-mono">
                          <span>Lv.{xpData.level?.level_number ?? '?'}: {xpData.progress.currentLevelXpRequired} XP</span>
                          <span>Lv.{(xpData.level?.level_number ?? 0) + 1}: {xpData.progress.nextLevelXpRequired ?? 'MAX'} XP</span>
                        </div>
                      </div>

                      {xpData.progress.xpToNext > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-bg-base/50 rounded-xl border border-border/30">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-[11px] text-text-secondary">
                            Butuh <strong className="text-primary">{xpData.progress.xpToNext} XP</strong> lagi untuk naik level
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* XP Statistics Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { 
                        label: 'XP Hari Ini', 
                        value: xpStats?.total_xp_today ?? xpData?.current_xp ?? 0,
                        icon: <Star className="w-4 h-4" />,
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                      },
                      { 
                        label: 'XP Minggu Ini', 
                        value: xpStats?.total_xp_this_week ?? 0,
                        icon: <TrendingUp className="w-4 h-4" />,
                        color: 'text-green-500',
                        bg: 'bg-green-500/10'
                      },
                      { 
                        label: 'Menit Nonton', 
                        value: xpStats?.minutes_watched_today ?? 0,
                        icon: <Clock className="w-4 h-4" />,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10'
                      },
                      { 
                        label: 'XP Rate', 
                        value: xpStats ? `${xpStats.current_xp_per_minute}/min` : '60/min',
                        icon: <Sparkles className="w-4 h-4" />,
                        color: 'text-yellow-500',
                        bg: 'bg-yellow-500/10'
                      }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-3 bg-bg-surface border border-border/40 rounded-xl space-y-1.5">
                        <div className={`p-1.5 ${stat.bg} rounded-lg w-fit ${stat.color}`}>
                          {stat.icon}
                        </div>
                        <div>
                          <span className="text-lg font-black text-text-primary font-heading">{stat.value}</span>
                          <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* XP Breakdown by Source */}
                  {xpStats && (
                    <div className="p-4 bg-bg-surface border border-border/40 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        Breakdown XP Hari Ini
                      </h4>
                      <div className="space-y-2.5">
                        {/* Watch XP */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-text-secondary flex items-center gap-1.5">
                              <Play className="w-3 h-3" /> Menonton
                            </span>
                            <span className="font-mono font-bold text-text-primary">+{xpStats.watch_xp_today} XP</span>
                          </div>
                          <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${xpStats.total_xp_today > 0 ? (xpStats.watch_xp_today / xpStats.total_xp_today) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        {/* Reward XP */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-text-secondary flex items-center gap-1.5">
                              <Gift className="w-3 h-3" /> Level Rewards
                            </span>
                            <span className="font-mono font-bold text-text-primary">+{xpStats.reward_xp_today} XP</span>
                          </div>
                          <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${xpStats.total_xp_today > 0 ? (xpStats.reward_xp_today / xpStats.total_xp_today) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {xpStats.vip_multiplier > 1 && (
                        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          <span className="text-[10px] text-primary font-bold">VIP {xpStats.vip_multiplier}x Multiplier Aktif</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Level Progression Timeline */}
                  <div className="p-4 bg-bg-surface border border-border/40 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      Progressi Level
                    </h4>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/40" />
                      
                      {/* Timeline items - show nearby levels */}
                      <div className="space-y-4">
                        {(() => {
                          const currentLevelNum = xpData?.level?.level_number ?? 1;
                          const nearbyLevels = levelsList.filter(
                            l => l.level_number >= currentLevelNum - 1 && l.level_number <= currentLevelNum + 3
                          );
                          if (nearbyLevels.length === 0) return null;
                          
                          return nearbyLevels.map((level) => {
                            const isUnlocked = xpData && xpData.current_xp >= level.xp_required_total;
                            const isCurrent = xpData?.level_id === level.id;
                            const progressPercent = isCurrent && xpData
                              ? xpData.progress.percent
                              : isUnlocked ? 100 : 0;
                            
                            return (
                              <div key={level.id} className="relative flex items-start gap-3 pl-10">
                                {/* Timeline dot */}
                                <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                                  isCurrent
                                    ? 'bg-primary border-primary shadow-glow-sm'
                                    : isUnlocked
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-bg-base border-border/60'
                                }`} />
                                
                                {/* Level info */}
                                <div className={`flex-1 p-3 rounded-xl border ${
                                  isCurrent
                                    ? 'bg-primary/5 border-primary/30'
                                    : isUnlocked
                                    ? 'bg-bg-base/50 border-border/40'
                                    : 'bg-bg-base/20 border-border/20 opacity-60'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                                        Level {level.level_number}: {level.title}
                                      </span>
                                      <p className="text-[9px] text-muted font-mono">{level.xp_required_total} XP</p>
                                    </div>
                                    {isCurrent && (
                                      <span className="text-[10px] font-black text-primary">{progressPercent.toFixed(0)}%</span>
                                    )}
                                    {isUnlocked && !isCurrent && (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                  </div>
                                  {isCurrent && (
                                    <div className="mt-2 h-1.5 bg-bg-base rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* XP History */}
                  {xpHistory.length > 0 && (
                    <div className="p-4 bg-bg-surface border border-border/40 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Riwayat XP Terbaru
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {xpHistory.slice(0, 10).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-2.5 bg-bg-base/40 rounded-xl">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 ${
                                entry.event_type === 'watch_progress_minute'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : entry.event_type === 'level_reward'
                                  ? 'bg-purple-500/10 text-purple-500'
                                  : entry.event_type === 'daily_login'
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-bg-base text-muted'
                              }`}>
                                {entry.event_type === 'watch_progress_minute' && <Play className="w-3 h-3" />}
                                {entry.event_type === 'level_reward' && <Gift className="w-3 h-3" />}
                                {entry.event_type === 'daily_login' && <Flame className="w-3 h-3" />}
                                {entry.event_type === 'event_bonus' && <Sparkles className="w-3 h-3" />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-text-primary block truncate">
                                  {entry.description || entry.event_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] text-muted font-mono">
                                  {new Date(entry.created_at).toLocaleString('id-ID', { 
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                            <span className={`text-xs font-black font-mono shrink-0 ${
                              entry.amount > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {entry.amount > 0 ? '+' : ''}{entry.amount} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Levels List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        Daftar Level & Reward
                      </h4>
                      <span className="text-[10px] text-muted font-mono">{levelsList.length} level</span>
                    </div>

                    {levelsList.length > 0 ? (
                      <div className="space-y-3">
                        {levelsList.map((level) => {
                          const isCurrentLevel = xpData?.level_id === level.id;
                          const isUnlocked = xpData && xpData.current_xp >= level.xp_required_total;
                          const hasUnclaimedRewards = level.rewards?.some(r => !r.claimed && r.is_active);
                          const unclaimedCount = level.rewards?.filter(r => !r.claimed && r.is_active).length ?? 0;
                          const isClaiming = claimingReward === -level.id;

                          return (
                            <div
                              key={level.id}
                              className={`p-4 border rounded-2xl transition-all ${
                                isCurrentLevel
                                  ? 'bg-primary/5 border-primary/40 shadow-glow-sm'
                                  : isUnlocked
                                  ? 'bg-bg-surface border-border/40 hover:border-primary/30'
                                  : 'bg-bg-base/30 border-border/20 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`p-2 rounded-xl shrink-0 ${
                                    isCurrentLevel
                                      ? 'bg-primary text-black'
                                      : isUnlocked
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-bg-base text-muted'
                                  }`}>
                                    <Award className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-sm font-bold text-text-primary truncate">
                                        Level {level.level_number}: {level.title}
                                      </h5>
                                      {isCurrentLevel && (
                                        <span className="px-1.5 py-0.5 bg-primary text-black text-[8px] font-black uppercase rounded font-mono">Current</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted font-mono mt-0.5">
                                      {level.xp_required_total} XP diperlukan
                                    </p>
                                  </div>
                                </div>

                                {/* Claim All Button */}
                                {isUnlocked && hasUnclaimedRewards && (
                                  <button
                                    onClick={() => handleClaimAllRewards(level.id, level.title)}
                                    disabled={isClaiming}
                                    className="shrink-0 px-3 py-1.5 bg-primary hover:bg-primary-light text-black text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {isClaiming ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    Klaim Semua ({unclaimedCount})
                                  </button>
                                )}

                                {/* Locked indicator */}
                                {!isUnlocked && (
                                  <div className="shrink-0 p-1.5 bg-bg-base rounded-lg">
                                    <Lock className="w-4 h-4 text-muted" />
                                  </div>
                                )}

                                {/* All claimed indicator */}
                                {isUnlocked && !hasUnclaimedRewards && level.rewards && level.rewards.length > 0 && (
                                  <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span className="text-[9px] text-green-500 font-bold">Diklaim</span>
                                  </div>
                                )}
                              </div>

                              {/* Rewards List */}
                              {level.rewards && level.rewards.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                                  {level.rewards.map((reward) => (
                                    <div
                                      key={reward.id}
                                      className={`flex items-center justify-between p-2.5 rounded-xl ${
                                        reward.claimed
                                          ? 'bg-bg-base/30 opacity-60'
                                          : isUnlocked
                                          ? 'bg-bg-base/50 hover:bg-bg-base/70'
                                          : 'bg-bg-base/20'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg ${
                                          reward.type === 'COIN'
                                            ? 'bg-yellow-500/10 text-yellow-500'
                                            : reward.type === 'VIP_DAYS'
                                            ? 'bg-purple-500/10 text-purple-500'
                                            : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                          {reward.type === 'COIN' && <Gift className="w-3.5 h-3.5" />}
                                          {reward.type === 'VIP_DAYS' && <Star className="w-3.5 h-3.5" />}
                                          {reward.type === 'VOUCHER' && <Ticket className="w-3.5 h-3.5" />}
                                        </div>
                                        <div>
                                          <span className="text-[11px] font-bold text-text-primary block">
                                            {reward.type === 'COIN' && `${reward.coins_amount} Coins`}
                                            {reward.type === 'VIP_DAYS' && `${reward.vip_days} Hari VIP`}
                                            {reward.type === 'VOUCHER' && `Voucher ${reward.voucher_valid_days} hari`}
                                          </span>
                                          <span className="text-[9px] text-muted font-mono uppercase">
                                            {reward.type}
                                          </span>
                                        </div>
                                      </div>

                                      {reward.claimed ? (
                                        <span className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          Diklaim
                                        </span>
                                      ) : isUnlocked && reward.is_active ? (
                                        <button
                                          onClick={() => handleClaimReward(reward.id, reward.type)}
                                          disabled={claimingReward === reward.id}
                                          className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                                        >
                                          {claimingReward === reward.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3" />
                                          )}
                                          Klaim
                                        </button>
                                      ) : (
                                        <Lock className="w-3.5 h-3.5 text-muted" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* No rewards */}
                              {(!level.rewards || level.rewards.length === 0) && (
                                <p className="mt-3 pt-3 border-t border-border/20 text-[10px] text-muted italic">
                                  Belum ada reward untuk level ini.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted text-xs">
                        <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>Gagal memuat daftar level.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Riwayat Tontonan Lokal (YouTube Horizontal Scroll Style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold font-heading text-text-primary">Riwayat</h3>
          </div>
          <Link 
            to="/history"
            className="px-3 py-1 text-xs font-bold text-primary hover:text-primary-light border border-primary/20 hover:border-primary/45 rounded-full transition-all"
          >
            Lihat semua
          </Link>
        </div>

        {watchHistory.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x">
            {watchHistory.slice(0, 10).map((h) => {
              const percentage = Math.round(h.progress * 100);
              return (
                <Link
                  key={h.id}
                  to={`/watch/${h.animeSlug}/ep/${h.episodeNumber}`}
                  className="group snap-start w-48 sm:w-56 shrink-0 block space-y-2 focus:outline-none"
                >
                  <div className="relative aspect-[16/9] bg-bg-base rounded-xl overflow-hidden border border-border/60 group-hover:border-primary/45 transition-colors shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                    <img
                      src={h.animeCover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop'}
                      alt={h.episodeTitle}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-2 bg-primary text-black rounded-full shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-black text-black" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/55">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>

                    <span className="absolute bottom-2 left-2 bg-black/80 text-white font-mono text-[8px] px-1 py-0.5 rounded font-bold">
                      {percentage}% selesai
                    </span>
                  </div>

                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                      {h.animeTitle}
                    </h4>
                    <p className="text-[10px] text-text-secondary truncate font-medium">
                      Episode {h.episodeNumber}: {h.episodeTitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/10 flex flex-col items-center justify-center p-4">
            <History className="w-8 h-8 text-muted/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">Belum ada riwayat tontonan</h4>
            <p className="text-[10px] text-muted max-w-xs mt-1 leading-normal">
              Tonton anime favoritmu tanpa iklan untuk memunculkan riwayat di sini.
            </p>
          </div>
        )}
      </div>

      {/* 4. Daftar Tersimpan / Bookmarks (YouTube Horizontal Scroll Style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold font-heading text-text-primary">Tersimpan</h3>
          </div>
          <Link 
            to="/bookmarks"
            className="px-3 py-1 text-xs font-bold text-primary hover:text-primary-light border border-primary/20 hover:border-primary/45 rounded-full transition-all"
          >
            Lihat semua
          </Link>
        </div>

        {bookmarks.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x">
            {bookmarks.slice(0, 10).map((b) => (
              <Link
                key={b.id}
                to={b.itemType === 'anime' ? `/anime/${b.itemId}` : `/read/${b.slug}`}
                className="group snap-start w-28 sm:w-32 shrink-0 block space-y-2 focus:outline-none"
              >
                <div className="relative aspect-[2/3] bg-bg-base rounded-xl overflow-hidden border border-border/60 group-hover:border-primary/45 transition-colors shadow-md">
                  <div className="absolute inset-0 bg-bg-elevated animate-shimmer" />
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onLoad={(e) => {
                      (e.currentTarget.previousSibling as HTMLElement)?.remove();
                    }}
                  />
                  
                  {/* Overlay Type */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/85 text-[8px] font-bold text-white rounded uppercase tracking-wider font-mono">
                    {b.itemType}
                  </span>
                </div>

                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[9px] text-primary-light font-medium tracking-wide">
                    {b.progressText}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-border/80 rounded-2xl bg-bg-surface/10 flex flex-col items-center justify-center p-4">
            <Bookmark className="w-8 h-8 text-muted/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">Daftar Tersimpan Kosong</h4>
            <p className="text-[10px] text-muted max-w-xs mt-1 leading-normal">
              Bookmark anime atau manga favoritmu untuk menyimpannya di sini.
            </p>
          </div>
        )}
      </div>

      {/* 5. Layanan & Pengaturan (Collapsible YouTube Style menu items) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold font-heading text-text-primary border-b border-border/40 pb-2">
          Layanan & Pengaturan
        </h3>

        <div className="border border-border/40 rounded-2xl bg-bg-surface overflow-hidden divide-y divide-border/30">
          
          {/* Account Details */}
          <div className="w-full">
            <button
              onClick={() => setActiveSection(prev => prev === 'account' ? 'none' : 'account')}
              className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated transition-colors text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-sm font-semibold text-text-primary block">Informasi Personal</span>
                  <span className="text-[10px] text-muted">Nama, email, dan detail akun Anda</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${activeSection === 'account' ? 'rotate-180' : ''}`} />
            </button>

            {activeSection === 'account' && (
              <div className="p-5 bg-bg-sidebar/40 border-t border-border/30 space-y-4">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Detail Akun</span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-primary hover:text-primary-light font-bold flex items-center gap-1 focus:outline-none"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Batal' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      disabled={!isEditing}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 px-3 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Username</label>
                    <input
                      type="text"
                      value={username}
                      disabled={!isEditing}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-9 px-3 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Alamat Email (Akun Google)</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full h-9 px-3 bg-bg-base/50 border border-border/30 opacity-60 rounded-lg text-xs text-muted focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Jenis Kelamin</label>
                    <select
                      value={gender}
                      disabled={!isEditing}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full h-9 px-2 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Pilih...</option>
                      <option value="MALE">Laki-laki (Male)</option>
                      <option value="FEMALE">Perempuan (Female)</option>
                      <option value="OTHER">Lainnya (Other)</option>
                    </select>
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary block font-semibold">Tanggal Lahir</label>
                      {isBirthdateSet && (
                        <span className="text-[9px] text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">Terkunci</span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={birthdate ? birthdate.substring(0, 10) : ''}
                      disabled={!isEditing || isBirthdateSet}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full h-9 px-3 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Bio */}
                  <div className="sm:col-span-2 space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Bio / Slogan</label>
                    <textarea
                      value={bio}
                      disabled={!isEditing}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="Tuliskan biografi singkat kamu..."
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-black font-bold text-xs rounded-xl shadow-glow hover:opacity-95 active:scale-95 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Player Customization */}
          <div className="w-full">
            <button
              onClick={() => setActiveSection(prev => prev === 'player' ? 'none' : 'player')}
              className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated transition-colors text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-sm font-semibold text-text-primary block">Kustomisasi Pemutar</span>
                  <span className="text-[10px] text-muted">Subtitle default dan kualitas resolusi default</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${activeSection === 'player' ? 'rotate-180' : ''}`} />
            </button>

            {activeSection === 'player' && (
              <div className="p-5 bg-bg-sidebar/40 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-text-secondary block font-semibold">Subtitle Default</label>
                  <select
                    value={subLang}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSubLang(val);
                      updateProfile({ subPreference: val });
                      addToast('success', 'Preferensi subtitle berhasil diperbarui!');
                    }}
                    className="w-full h-9 px-2 bg-bg-base border border-border/60 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">Bahasa Inggris (English)</option>
                    <option value="off">Mati (Tanpa Subtitle)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-text-secondary block font-semibold">Kualitas Video Default</label>
                  <select
                    value={quality}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setQuality(val);
                      updateProfile({ qualityPreference: val });
                      addToast('success', 'Preferensi kualitas video berhasil diperbarui!');
                    }}
                    className="w-full h-9 px-2 bg-bg-base border border-border/60 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="360p">360p (Hemat Kuota)</option>
                    <option value="480p">480p (Standar)</option>
                    <option value="720p">720p (HD - Rekomendasi)</option>
                    <option value="1080p">1080p (FHD - Jernih)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* New Release Alerts */}
          <div className="flex items-center justify-between p-4 hover:bg-bg-elevated transition-colors text-left">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary animate-pulse" />
              <div>
                <span className="text-sm font-semibold text-text-primary block">Notifikasi Rilis Baru</span>
                <span className="text-[10px] text-muted">Alert saat anime/manga tersimpan merilis bab baru</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const val = !notify;
                setNotify(val);
                updateProfile({ notify: val });
                addToast('success', val ? 'Notifikasi diaktifkan!' : 'Notifikasi dimatikan.');
              }}
              className={`w-10 h-5.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                notify ? 'bg-primary' : 'bg-bg-elevated border border-border/80'
              }`}
              aria-label="Toggle notifikasi"
            >
              <span 
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  notify ? 'translate-x-4.5' : 'translate-x-0 bg-muted'
                }`}
              />
            </button>
          </div>

          {/* About App */}
          <div className="w-full">
            <button
              onClick={() => setActiveSection(prev => prev === 'app' ? 'none' : 'app')}
              className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated transition-colors text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-sm font-semibold text-text-primary block">Tentang NanimeID</span>
                  <span className="text-[10px] text-muted">Spesifikasi aplikasi dan detail versi</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${activeSection === 'app' ? 'rotate-180' : ''}`} />
            </button>

            {activeSection === 'app' && (
              <div className="p-5 bg-bg-sidebar/40 border-t border-border/30 text-xs text-text-secondary space-y-2 text-left">
                <p><strong>Aplikasi:</strong> NanimeID Web Client</p>
                <p><strong>Versi:</strong> 1.0.0 (Production Build)</p>
                <p><strong>Kanal API:</strong> http://192.168.1.6:3000/2.1.0</p>
                <p><strong>Deskripsi:</strong> Proyek Frontend adaptif premium yang terhubung dengan API Anime stabil.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
