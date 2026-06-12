import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { 
  Mail, Bell, Edit3, Save, History, 
  Bookmark, LogOut, ChevronDown, User, Play, Info, Sliders 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    userProfile, updateProfile, addToast, 
    watchHistory, bookmarks, logout, fetchAndSetMissingCovers 
  } = useAppStore();

  useEffect(() => {
    fetchAndSetMissingCovers();
  }, [fetchAndSetMissingCovers]);

  // Local Form state
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [subLang, setSubLang] = useState(userProfile.subPreference);
  const [quality, setQuality] = useState(userProfile.qualityPreference);
  const [notify, setNotify] = useState(userProfile.notify);

  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'none' | 'account' | 'player' | 'app'>('none');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      subPreference: subLang,
      qualityPreference: quality,
      notify
    });
    setIsEditing(false);
    addToast('success', 'Profil dan preferensi berhasil diperbarui!');
  };

  const handleAvatarChange = () => {
    addToast('info', 'Mengganti avatar dinonaktifkan dalam versi demo ini.');
  };

  const handleLogout = () => {
    logout();
    addToast('success', 'Berhasil keluar dari akun');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left">
      
      {/* 1. Header Profil (YouTube Style) */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8">
        
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-glow relative">
            <UserAvatar
              src={userProfile.avatarUrl}
              name={userProfile.name}
              className="w-full h-full rounded-full text-2xl"
            />
          </div>
          <button
            onClick={handleAvatarChange}
            className="absolute bottom-0 right-0 p-1.5 bg-primary hover:bg-primary-light text-black rounded-full shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none"
            aria-label="Ganti avatar"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>

        {/* User metadata */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-heading text-text-primary tracking-tight">
            {userProfile.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-text-secondary font-medium">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-muted" />
              <span>{userProfile.email}</span>
            </span>
            <span className="hidden sm:inline text-muted">•</span>
            <span className="text-primary-light font-semibold">@andi_wibu</span>
          </div>
          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase font-mono tracking-wider">
              WIBU AKTIF
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-bg-base border border-border/60 text-[10px] font-bold text-muted uppercase font-mono tracking-wider">
              VERSI WEB 1.0
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Anime Tersimpan', val: bookmarks.filter(b => b.itemType === 'anime').length },
          { label: 'Manga Tersimpan', val: bookmarks.filter(b => b.itemType === 'manga').length },
          { label: 'Episode Ditonton', val: userProfile.episodesWatchedCount }
        ].map((item, idx) => (
          <div key={idx} className="bg-bg-surface border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-primary font-mono leading-none">{item.val}</span>
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1.5">{item.label}</span>
          </div>
        ))}
      </div>

      {/* 3. Riwayat Tontonan (YouTube Horizontal Scroll Style) */}
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

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-text-secondary block font-semibold">Alamat Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled={!isEditing}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 px-3 bg-bg-base border border-border/60 disabled:opacity-75 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
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
