import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { 
  Bell, Edit3, Save, History, 
  Bookmark, LogOut, ChevronDown, User, Play, Info, Sliders,
  MessageSquare, CheckCircle, Flame, Clock, Heart, ExternalLink, Lock, Loader2
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
  const [activeTab, setActiveTab] = useState<'watched' | 'comments' | 'completed' | 'streak'>('watched');
  const [loadingTab, setLoadingTab] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

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
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider">
              Level {userProfile.level} ({userProfile.xp} XP)
            </span>
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
