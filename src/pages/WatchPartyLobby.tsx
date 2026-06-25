import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Lock, Globe, Loader2, Play,
  Key, ShieldAlert, ArrowRight, BookOpen, Clock, AlertCircle
} from 'lucide-react';
import { watchPartyApi } from '../lib/watchPartyApi';
import type { WatchPartySession } from '../lib/watchPartyApi';
import { fetchLiveSearch } from '../lib/animeApi';
import { useAppStore } from '../stores/useAppStore';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const WatchPartyLobby: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, addToast } = useAppStore();

  // Lobby lists and queries
  const [activeSessions, setActiveSessions] = useState<WatchPartySession[]>([]);
  const [visitedSessions, setVisitedSessions] = useState<WatchPartySession[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'visited'>('active');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHostQuery, setSearchHostQuery] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSessionToJoin, setSelectedSessionToJoin] = useState<WatchPartySession | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joining, setJoining] = useState(false);

  // Room Creation state
  const [createStep, setCreateStep] = useState<'search' | 'configure'>('search');
  const [animeSearchQuery, setAnimeSearchQuery] = useState('');
  const [animeSearchResults, setAnimeSearchResults] = useState<any[]>([]);
  const [searchingAnime, setSearchingAnime] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [animeDetailEpisodes, setAnimeDetailEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Creation options
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | ''>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  const [accessMode, setAccessMode] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS' | 'FOLLOWERS'>('PUBLIC');
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch active rooms & visited rooms
  const loadSessions = async () => {
    setLoading(true);
    try {
      // Fetch Active Rooms
      const activeRes = await watchPartyApi.listSessions({
        only_public: false,
      });
      if (activeRes?.ok) {
        setActiveSessions(activeRes.sessions || []);
      }

      // Fetch Visited Rooms (Requires Login)
      if (isLoggedIn) {
        const visitedRes = await watchPartyApi.getVisitedSessions();
        if (visitedRes?.ok) {
          setVisitedSessions(visitedRes.rooms || []);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [isLoggedIn]);

  // Handle Join Room directly
  const handleJoinSession = async (session: WatchPartySession, password?: string) => {
    if (!isLoggedIn) {
      addToast('error', 'Silakan login terlebih dahulu untuk bergabung Nobar.');
      navigate('/login');
      return;
    }

    setJoining(true);
    try {
      const res = await watchPartyApi.joinSession(session.code, password ? { password } : undefined);
      if (res?.ok) {
        addToast('success', `Berhasil bergabung ke room ${session.code}`);
        navigate(`/watch-party/${session.code}`);
      }
    } catch (err: any) {
      const errCode = err.code || err.message;
      if (errCode === 'password_required' || errCode === 'invalid_password') {
        setSelectedSessionToJoin(session);
        setJoinPassword('');
        setShowPasswordModal(true);
        if (errCode === 'invalid_password') {
          addToast('error', 'Password yang dimasukkan salah.');
        }
      } else if (errCode === 'followers_only_room') {
        addToast('error', 'Room ini khusus untuk follower host.');
      } else if (errCode === 'friends_only_room') {
        addToast('error', 'Room ini khusus untuk teman (saling follow) host.');
      } else {
        addToast('error', `Gagal join: ${err.message || 'Terjadi kesalahan'}`);
      }
    } finally {
      setJoining(false);
    }
  };

  // Join via Invite Code
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) return;

    if (!isLoggedIn) {
      addToast('error', 'Silakan login terlebih dahulu untuk bergabung Nobar.');
      navigate('/login');
      return;
    }

    setJoining(true);
    try {
      const detailRes = await watchPartyApi.getSessionDetails(code);
      if (detailRes?.ok && detailRes.session) {
        handleJoinSession(detailRes.session);
      }
    } catch (err: any) {
      addToast('error', `Room tidak ditemukan: ${err.message || 'Kode tidak valid'}`);
    } finally {
      setJoining(false);
    }
  };

  // Handle Search input trigger
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await watchPartyApi.searchSessions({
        q: searchQuery || undefined,
        host: searchHostQuery || undefined,
      });
      if (res?.ok) {
        setActiveSessions(res.sessions || []);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Pencarian room gagal.');
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete search for Anime during creation
  useEffect(() => {
    if (!animeSearchQuery.trim()) {
      setAnimeSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearchingAnime(true);
      try {
        const res = await fetchLiveSearch(animeSearchQuery);
        if (res?.data) {
          setAnimeSearchResults(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingAnime(false);
      }
    }, 450);

    return () => clearTimeout(delay);
  }, [animeSearchQuery]);

  // Step 2: Fetch episodes when anime is selected
  const handleSelectAnime = async (anime: any) => {
    setSelectedAnime(anime);
    setLoadingEpisodes(true);
    setCreateStep('configure');
    try {
      const res = await watchPartyApi.getAnimeDetails(anime.id);
      if (res?.ok) {
        setAnimeDetailEpisodes(res.episodes || []);
        if (res.episodes && res.episodes.length > 0) {
          setSelectedEpisodeId(res.episodes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat daftar episode anime.');
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Submit Room Creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      addToast('error', 'Silakan login terlebih dahulu untuk membuat Nobar.');
      return;
    }

    if (accessMode === 'PRIVATE' && !createPassword) {
      addToast('error', 'Password wajib diisi untuk Room Private.');
      return;
    }

    setCreating(true);
    try {
      const payload: any = {
        access_mode: accessMode,
        quality: selectedQuality,
      };
      if (selectedAnime) {
        payload.anime_id = selectedAnime.id;
      }
      if (selectedEpisodeId) {
        payload.episode_id = Number(selectedEpisodeId);
      }
      if (accessMode === 'PRIVATE') {
        payload.password = createPassword;
      }

      const res = await watchPartyApi.createSession(payload);
      if (res?.ok && res.session) {
        addToast('success', 'Berhasil membuat sesi Nobar!');
        setShowCreateModal(false);
        navigate(`/watch-party/${res.session.code}`);
      }
    } catch (err: any) {
      addToast('error', `Gagal membuat room: ${err.message || 'Error'}`);
    } finally {
      setCreating(false);
    }
  };

  // Visibilitas teks mode akses
  const renderAccessBadge = (mode: string) => {
    switch (mode) {
      case 'PUBLIC':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1"><Globe className="w-3 h-3" /> Publik</Badge>;
      case 'PRIVATE':
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 gap-1"><Lock className="w-3 h-3" /> Private</Badge>;
      case 'FRIENDS':
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 gap-1"><Users className="w-3 h-3" /> Teman</Badge>;
      case 'FOLLOWERS':
        return <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 gap-1"><Users className="w-3 h-3" /> Follower</Badge>;
      default:
        return <Badge>{mode}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-purple-500/ dark:from-purple-900/40 dark:via-pink-900/20 dark:to-black border border-border/40 dark:border-white/10 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/25 border border-primary/20 text-xs font-semibold text-primary">
            <Users className="w-4.5 h-4.5" /> Nobar V2
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-primary dark:text-white">
            Nonton Bareng <span className="text-pink-500">Real-Time</span>
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Buat ruang bioskop virtual Anda sendiri. Cari anime terbaru, sinkronkan pemutaran video secara presisi, gunakan micro-signaling voice chat (WebRTC), dan diskusikan tayangan favorit Anda dalam obrolan chat real-time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  addToast('error', 'Silakan login terlebih dahulu untuk membuat Nobar.');
                  navigate('/login');
                } else {
                  setCreateStep('search');
                  setSelectedAnime(null);
                  setAnimeSearchQuery('');
                  setAccessMode('PUBLIC');
                  setCreatePassword('');
                  setShowCreateModal(true);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-pink-500 hover:from-pink-600 hover:to-purple-700 text-white font-bold transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 active:scale-95 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4.5 h-4.5" /> Buat Room Baru
            </button>
            <button
              onClick={loadSessions}
              className="px-5 py-2.5 rounded-xl bg-bg-surface dark:bg-white/5 border border-border/40 dark:border-white/10 text-text-primary dark:text-white hover:bg-bg-elevated dark:hover:bg-white/10 transition-all font-semibold active:scale-95 text-sm"
            >
              Segarkan List
            </button>
          </div>
        </div>

        {/* Invite Code Quick Join box */}
        <div className="w-full md:w-80 bg-bg-surface/60 dark:bg-black/60 backdrop-blur-xl border border-border/40 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
          <h3 className="font-bold text-text-primary dark:text-white flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-primary" /> Masuk via Kode Room
          </h3>
          <form onSubmit={handleJoinWithCode} className="space-y-3">
            <input
              type="text"
              placeholder="CONTOH: ABC1D2"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              className="w-full bg-bg-base/50 dark:bg-white/5 border border-border/40 dark:border-white/10 rounded-xl px-4 py-2.5 text-center text-lg font-bold tracking-widest text-text-primary dark:text-white placeholder:text-text-secondary/50 dark:placeholder:text-text-secondary/35 uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="submit"
              disabled={joining || !inviteCodeInput.trim()}
              className="w-full py-2.5 rounded-xl bg-bg-base hover:bg-bg-elevated dark:bg-white/10 dark:hover:bg-white/15 text-text-primary dark:text-white font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm border border-border/40 dark:border-white/10"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gabung'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main filter & tab area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* Navigation Tabs */}
        <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-xl shrink-0 w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Room Aktif ({activeSessions.length})
          </button>
          {isLoggedIn && (
            <button
              onClick={() => setActiveTab('visited')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'visited' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Pernah Dikunjungi ({visitedSessions.length})
            </button>
          )}
        </div>

        {/* REST API Search form */}
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 flex-1 max-w-xl md:justify-end">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Cari anime atau episode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-white placeholder:text-text-secondary/40"
            />
          </div>
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Cari nama host..."
              value={searchHostQuery}
              onChange={(e) => setSearchHostQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-white placeholder:text-text-secondary/40"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Grid of rooms */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm">Memuat daftar room Nobar...</p>
        </div>
      ) : activeTab === 'active' ? (
        activeSessions.length === 0 ? (
          <div className="py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3 bg-white/[0.01]">
            <AlertCircle className="w-10 h-10 text-text-secondary/40" />
            <p className="font-semibold text-white">Tidak ada Nobar aktif</p>
            <p className="text-text-secondary text-xs max-w-xs leading-relaxed">
              Mungkin saat ini belum ada room publik yang aktif. Buat room Anda sendiri untuk mengajak teman nonton bersama!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((room) => (
              <div
                key={room.code}
                className="group relative bg-bg-sidebar/40 backdrop-blur-sm border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 flex flex-col text-left"
              >
                {/* Anime banner / thumbnail preview */}
                <div className="relative aspect-[16/9] w-full bg-black/60 overflow-hidden shrink-0">
                  {room.anime?.gambar_anime ? (
                    <img
                      src={room.anime.gambar_anime}
                      alt={room.anime.nama_anime}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg-elevated">
                      <BookOpen className="w-10 h-10 text-white/10" />
                    </div>
                  )}
                  {/* Badge Viewer count */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {room.viewer_count ?? 1} Penonton
                  </div>
                  {/* Access Mode badge */}
                  <div className="absolute bottom-3 left-3">
                    {renderAccessBadge(room.access_mode)}
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {room.anime?.nama_anime || 'Room Kustom'}
                    </h3>
                    <p className="text-text-secondary text-xs line-clamp-1">
                      {room.episode ? `Episode ${room.episode.nomor_episode}: ${room.episode.judul_episode}` : 'Menunggu pemilihan media'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    {/* Host avatar/details */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-500 text-white font-bold text-[10px] flex items-center justify-center border border-white/20 select-none shadow">
                        H
                      </div>
                      <div className="text-left leading-none">
                        <span className="text-[10px] text-text-secondary block">Host</span>
                        <span className="text-xs text-white font-bold block max-w-[100px] truncate">Room Sesi</span>
                      </div>
                    </div>

                    {/* Join button */}
                    <button
                      onClick={() => handleJoinSession(room)}
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white/10" /> Gabung
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Visited history tab
        visitedSessions.length === 0 ? (
          <div className="py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3 bg-white/[0.01]">
            <Clock className="w-10 h-10 text-text-secondary/40" />
            <p className="font-semibold text-white">Tidak ada riwayat room</p>
            <p className="text-text-secondary text-xs max-w-xs leading-relaxed">
              Anda belum pernah berkunjung ke room Watch Party mana pun sebelumnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitedSessions.map((room) => (
              <div
                key={room.code}
                className="group relative bg-bg-sidebar/40 border border-white/15 rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary tracking-widest">{room.code}</span>
                    {renderAccessBadge(room.access_mode)}
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                    {room.anime?.nama_anime || 'Room Kustom'}
                  </h3>
                  <p className="text-text-secondary text-xs line-clamp-1">
                    {room.episode ? `Episode ${room.episode.nomor_episode}: ${room.episode.judul_episode}` : 'Tanpa media'}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                  <span className="text-[10px] text-text-secondary">Visibilitas: {room.access_mode}</span>
                  <button
                    onClick={() => handleJoinSession(room)}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-1"
                  >
                    Masuk Kembali
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* --- PASSWORD MODAL FOR LOCKED ROOMS --- */}
      {showPasswordModal && selectedSessionToJoin && (
        <Modal
          isOpen={showPasswordModal}
          title="Room Nobar Terkunci"
          onClose={() => setShowPasswordModal(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowPasswordModal(false);
              handleJoinSession(selectedSessionToJoin, joinPassword);
            }}
            className="space-y-5 text-left"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <p className="text-xs leading-relaxed">
                Ruang tonton ini dikunci menggunakan password oleh host. Silakan masukkan password untuk bergabung.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Password Sesi</label>
              <input
                type="password"
                required
                placeholder="Masukkan password..."
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md shadow-primary/20"
              >
                Gabung Room
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- CREATE PARTY MODAL --- */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          title="Buat Sesi Nobar"
          onClose={() => setShowCreateModal(false)}
        >
          <div className="space-y-5 text-left">
            {createStep === 'search' ? (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Langkah 1: Cari dan pilih anime yang ingin Anda tonton bersama di ruang bioskop virtual.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
                    <input
                      type="text"
                      placeholder="Masukkan judul anime..."
                      value={animeSearchQuery}
                      onChange={(e) => setAnimeSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary text-white"
                    />
                  </div>

                  {/* Autocomplete list */}
                  {searchingAnime ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-text-secondary text-xs">
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" /> Mencari anime...
                    </div>
                  ) : animeSearchResults.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/5 bg-black/40">
                      {animeSearchResults.map((anime) => (
                        <button
                          key={anime.id}
                          onClick={() => handleSelectAnime(anime)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left transition-all group"
                        >
                          <img
                            src={anime.gambar_anime}
                            alt={anime.nama_anime}
                            className="w-10 aspect-[3/4] object-cover rounded bg-white/5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs group-hover:text-primary transition-colors block truncate">
                              {anime.nama_anime}
                            </span>
                            <span className="text-[10px] text-text-secondary block mt-0.5">
                              {anime.genre_anime?.join(', ') || 'Tanpa Genre'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : animeSearchQuery.trim() ? (
                    <div className="py-6 text-center text-text-secondary text-xs border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                      Anime tidak ditemukan.
                    </div>
                  ) : (
                    // Fallback to custom session without anime
                    <button
                      onClick={() => {
                        setSelectedAnime(null);
                        setAnimeDetailEpisodes([]);
                        setSelectedEpisodeId('');
                        setCreateStep('configure');
                      }}
                      className="w-full p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-center text-xs text-text-secondary hover:text-white transition-all font-semibold"
                    >
                      Lanjutkan Tanpa Memilih Anime (Kosong)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Step 2: Configure Room settings
              <form onSubmit={handleCreateRoom} className="space-y-4">
                {selectedAnime && (
                  <div className="flex items-center gap-3 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl shrink-0">
                    <img
                      src={selectedAnime.gambar_anime}
                      alt={selectedAnime.nama_anime}
                      className="w-12 aspect-[3/4] object-cover rounded bg-white/5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-primary font-bold block uppercase tracking-wider">Mulai Menonton</span>
                      <span className="font-bold text-white text-sm block truncate">{selectedAnime.nama_anime}</span>
                      <button
                        type="button"
                        onClick={() => setCreateStep('search')}
                        className="text-[10px] text-rose-400 hover:underline mt-1 font-semibold"
                      >
                        Ganti Anime
                      </button>
                    </div>
                  </div>
                )}

                {/* Episode & Quality details */}
                {selectedAnime && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-text-secondary">Pilih Episode</label>
                      {loadingEpisodes ? (
                        <div className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedEpisodeId}
                          onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
                          className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                        >
                          {animeDetailEpisodes.map((ep) => (
                            <option key={ep.id} value={ep.id}>
                              Episode {ep.nomor_episode}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-text-secondary">Resolusi Default</label>
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      >
                        <option value="360p">360p (Hemat)</option>
                        <option value="480p">480p (Standard)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (FHD)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Access mode selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary block">Visibilitas Room</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { mode: 'PUBLIC', label: 'Publik' },
                      { mode: 'PRIVATE', label: 'Private' },
                      { mode: 'FRIENDS', label: 'Teman' },
                      { mode: 'FOLLOWERS', label: 'Follower' }
                    ].map((item) => (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => {
                          setAccessMode(item.mode as any);
                          if (item.mode !== 'PRIVATE') setCreatePassword('');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                          accessMode === item.mode
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white/5 border-white/5 hover:border-white/15 text-text-secondary hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password input for Private Mode */}
                {accessMode === 'PRIVATE' && (
                  <div className="space-y-1.5 text-left animate-fade-in">
                    <label className="text-xs font-semibold text-text-secondary">Password Room (Wajib)</label>
                    <input
                      type="password"
                      required
                      placeholder="Buat password unik..."
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setCreateStep('search')}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-pink-500 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-pink-500/10 flex items-center gap-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat & Gabung'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WatchPartyLobby;
