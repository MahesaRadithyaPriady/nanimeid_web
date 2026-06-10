import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Mail, Bell, Settings, Award, Edit3, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userProfile, updateProfile, addToast } = useAppStore();

  // Local Form state
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [subLang, setSubLang] = useState(userProfile.subPreference);
  const [quality, setQuality] = useState(userProfile.qualityPreference);
  const [notify, setNotify] = useState(userProfile.notify);

  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-left">
      
      {/* 1. Profile Header Card */}
      <div className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        
        {/* User Avatar */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-glow relative">
            <img 
              src={userProfile.avatarUrl} 
              alt="Avatar User" 
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleAvatarChange}
            className="absolute bottom-0 right-0 p-1.5 bg-primary hover:bg-primary-light text-black rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
            aria-label="Ganti avatar"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Card text info */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-text-primary tracking-tight">
            {userProfile.name}
          </h2>
          <p className="text-sm text-text-secondary font-medium flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-4 h-4 text-muted" />
            <span>{userProfile.email}</span>
          </p>
          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            <Badge variant="type" className="bg-primary-deep text-white border-none text-[10px] font-bold">WIBU AKTIF</Badge>
            <Badge variant="type" className="text-[10px]">VERSI WEB 1.0</Badge>
          </div>
        </div>

        {/* Quick Edit Trigger */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
            isEditing 
              ? 'bg-bg-elevated border-primary text-primary-light'
              : 'bg-black/35 border-border hover:border-primary text-text-primary'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Batal Mengubah' : 'Edit Pengaturan'}</span>
        </button>

      </div>

      {/* 2. Stats Dashboard Block */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Simpanan Anime', val: userProfile.animeCount, desc: 'Anime tersimpan' },
          { label: 'Simpanan Manga', val: userProfile.mangaCount, desc: 'Manga tersimpan' },
          { label: 'Episode Ditonton', val: userProfile.episodesWatchedCount, desc: 'Jumlah total tayang' }
        ].map((item, idx) => (
          <div key={idx} className="bg-bg-surface border border-border/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-start">
            <Award className="w-5 h-5 text-primary mb-1.5 shrink-0" />
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary leading-tight font-mono">{item.val}</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1">{item.label}</span>
          </div>
        ))}
      </div>

      {/* 3. Settings Forms (Editing & Preferences) */}
      <form onSubmit={handleSaveProfile} className="bg-bg-surface border border-border/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold font-heading text-text-primary border-b border-border/50 pb-3">
          Preferensi Akun & Video
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* A. Account Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider block">Informasi Personal</h4>
            
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary block font-semibold">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-bg-base border border-border/80 disabled:opacity-60 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary block font-semibold">Alamat Email</label>
              <input
                type="email"
                value={email}
                disabled={!isEditing}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-bg-base border border-border/80 disabled:opacity-60 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* B. Video Preferences */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider block">Kustomisasi Pemutar</h4>

            {/* Subtitle language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary block font-semibold">Subtitle Default</label>
              <select
                value={subLang}
                onChange={(e) => setSubLang(e.target.value as any)}
                className="w-full h-10 px-3 bg-bg-base border border-border/80 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">Bahasa Inggris (English)</option>
                <option value="off">Mati (Tanpa Subtitle)</option>
              </select>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary block font-semibold">Kualitas Video Default</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full h-10 px-3 bg-bg-base border border-border/80 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="360p">360p (Hemat Kuota)</option>
                <option value="480p">480p (Standar)</option>
                <option value="720p">720p (HD - Rekomendasi)</option>
                <option value="1080p">1080p (FHD - Jernih)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/40 my-4" />

        {/* C. Push Notification preferences */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 text-left">
            <label className="text-sm font-semibold text-text-primary block flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Notifikasi Rilis Baru</span>
            </label>
            <span className="text-xs text-muted">Dapatkan alert saat anime/manga tersimpan merilis episode baru.</span>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setNotify(!notify)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              notify ? 'bg-primary' : 'bg-bg-elevated border border-border'
            }`}
            aria-label="Toggle notifikasi"
          >
            <span 
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                notify ? 'translate-x-5' : 'translate-x-0 bg-muted'
              }`}
            />
          </button>
        </div>

        {/* Save Form Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-black font-semibold text-sm rounded-xl shadow-glow hover:opacity-95 active:scale-95 transition-all"
          >
            <Save className="w-4.5 h-4.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>

      </form>

    </div>
  );
};

// Simple Badge inline for stats
const Badge: React.FC<{ children: React.ReactNode; variant?: 'type'; className?: string }> = ({ children, className }) => (
  <span className={`px-2 py-0.5 rounded bg-bg-base border border-border text-[9px] font-mono text-muted uppercase font-semibold ${className}`}>
    {children}
  </span>
);

export default ProfilePage;
