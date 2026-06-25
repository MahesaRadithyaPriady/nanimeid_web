import React, { useState, useEffect } from 'react';
import { Heart, Flame, CheckCircle, Clock, Trash2, Check, X, Loader2, UserPlus, Search } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useConfirmStore } from '../stores/useConfirmStore';
import { fetchMyAffinities, respondAffinity, deleteAffinity, requestAffinity } from '../lib/affinityApi';
import { searchUsers } from '../lib/profileApi';
import type { ApiAffinityRecord, AffinityRelationType } from '../types';
import { Link } from 'react-router-dom';
import { UserAvatar } from './ui/UserAvatar';
import { Modal } from './ui/Modal';

export const AffinityTab: React.FC = () => {
  const { addToast } = useAppStore();
  const confirm = useConfirmStore((s) => s.confirm);
  const [affinities, setAffinities] = useState<ApiAffinityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<AffinityRelationType>('TEMAN');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchUsers({ q: searchQuery });
        setSearchResults(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleOpenModal = (presetType: AffinityRelationType = 'TEMAN') => {
    setIsModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setTargetId('');
    setTargetType(presetType);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchMyAffinities();
      setAffinities(res.data || []);
    } catch (err: any) {
      console.error(err);
      addToast('error', err.message || 'Gagal memuat data afinitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespond = async (id: number, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      const res = await respondAffinity(id, status);
      addToast('success', res.message || `Permintaan ${status === 'ACCEPTED' ? 'diterima' : 'ditolak'}.`);
      await loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal merespon permintaan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: 'Hapus Afinitas',
      message: 'Yakin ingin menghapus / membatalkan afinitas ini?',
      confirmText: 'Hapus',
      variant: 'danger'
    })) return;
    setProcessingId(id);
    try {
      const res = await deleteAffinity(id);
      addToast('success', res.message || 'Afinitas berhasil dihapus.');
      await loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus afinitas.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) {
      addToast('error', 'Masukkan ID Pengguna');
      return;
    }
    setSubmittingRequest(true);
    try {
      const res = await requestAffinity(Number(targetId), targetType);
      addToast('success', res.message || 'Permintaan afinitas terkirim!');
      setIsModalOpen(false);
      setTargetId('');
      await loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengirim permintaan');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <span className="text-xs text-muted">Memuat afinitas...</span>
      </div>
    );
  }

  const { userProfile } = useAppStore.getState();
  const myId = userProfile?.id;

  const pendingReceived = affinities.filter(a => a.status === 'PENDING' && a.target_user.id === myId);
  const pendingSent = affinities.filter(a => a.status === 'PENDING' && a.user.id === myId);
  const activeAffinities = affinities.filter(a => a.status === 'ACCEPTED');

  const getIcon = (type: string) => {
    if (type === 'PACAR') return <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />;
    if (type === 'SAHABAT') return <Flame className="w-4 h-4 fill-orange-500/50 text-orange-500" />;
    return <CheckCircle className="w-4 h-4 text-blue-500" />;
  };

  const UserCard = ({ user, type, subtitle, rightElement }: { user: any, type: string, subtitle: React.ReactNode, rightElement: React.ReactNode }) => (
    <div className="flex items-center justify-between p-3 bg-bg-base/40 hover:bg-bg-base border border-border/40 rounded-xl transition-all">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${user.id}`} className="shrink-0 relative">
          <UserAvatar src={user.avatar_url || ''} name={user.full_name || user.username} className="w-10 h-10 rounded-full" />
          {user.avatar_border_active_url && (
            <div 
              className="absolute inset-0 z-10 pointer-events-none bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(${user.avatar_border_active_url})` }}
            />
          )}
        </Link>
        <div>
          <Link to={`/profile/${user.id}`} className="text-sm font-bold text-text-primary hover:text-primary transition-colors flex items-center gap-1.5">
            {user.full_name || user.username}
            {getIcon(type)}
          </Link>
          <div className="text-[10px] text-muted">{subtitle}</div>
        </div>
      </div>
      <div>{rightElement}</div>
    </div>
  );

  // Visualization Setup
  const pacarAffinities = activeAffinities.filter(a => a.relation_type === 'PACAR');
  const sahabatAffinities = activeAffinities.filter(a => a.relation_type === 'SAHABAT');
  const temanAffinities = activeAffinities.filter(a => a.relation_type === 'TEMAN');

  const slots = [
    pacarAffinities[0] || null,
    sahabatAffinities[0] || null,
    temanAffinities[0] || null,
    temanAffinities[1] || null,
  ];

  const positions = [
    { left: '50%', top: '15%', cx: '50%', cy: '15%', type: 'PACAR', label: 'Pasangan', hexColor: '#ec4899', colorClass: 'text-pink-500', borderClass: 'border-pink-500/50', hoverBorder: 'group-hover:border-pink-500', hoverBg: 'group-hover:bg-pink-500/20', bgClass: 'bg-pink-500/5', badgeBg: 'bg-pink-500/10' }, // Top
    { left: '85%', top: '50%', cx: '85%', cy: '50%', type: 'SAHABAT', label: 'Sahabat', hexColor: '#f97316', colorClass: 'text-orange-500', borderClass: 'border-orange-500/50', hoverBorder: 'group-hover:border-orange-500', hoverBg: 'group-hover:bg-orange-500/20', bgClass: 'bg-orange-500/5', badgeBg: 'bg-orange-500/10' }, // Right
    { left: '50%', top: '85%', cx: '50%', cy: '85%', type: 'TEMAN', label: 'Teman', hexColor: '#3b82f6', colorClass: 'text-blue-500', borderClass: 'border-blue-500/50', hoverBorder: 'group-hover:border-blue-500', hoverBg: 'group-hover:bg-blue-500/20', bgClass: 'bg-blue-500/5', badgeBg: 'bg-blue-500/10' }, // Bottom
    { left: '15%', top: '50%', cx: '15%', cy: '50%', type: 'TEMAN', label: 'Teman', hexColor: '#3b82f6', colorClass: 'text-blue-500', borderClass: 'border-blue-500/50', hoverBorder: 'group-hover:border-blue-500', hoverBg: 'group-hover:bg-blue-500/20', bgClass: 'bg-blue-500/5', badgeBg: 'bg-blue-500/10' }, // Left
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-2">
      
      {/* Visualisasi Tree Afinitas */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-pink-500 uppercase tracking-wider text-center flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
          Jaringan Afinitas
        </h4>
        
        <div className="relative w-full max-w-sm mx-auto aspect-square bg-bg-surface border border-border/40 rounded-[3rem] overflow-hidden shadow-inner ring-1 ring-white/5">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {positions.map((pos, idx) => {
              const isActive = slots[idx] !== null;
              return (
                <line 
                  key={idx}
                  x1="50%" 
                  y1="50%" 
                  x2={pos.cx} 
                  y2={pos.cy} 
                  stroke={isActive ? pos.hexColor : "rgba(255, 255, 255, 0.08)"} 
                  strokeWidth={isActive ? "3" : "2"} 
                  strokeDasharray={isActive ? "none" : "6 4"} 
                  className={isActive ? "animate-pulse opacity-80" : ""}
                />
              );
            })}
          </svg>

          {/* Center Profile (Me) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-bg-surface bg-bg-base shadow-glow-sm shadow-primary/50 flex items-center justify-center z-10">
              {userProfile?.avatarBorderActive && (
                <div 
                  className="absolute inset-0 z-20 pointer-events-none bg-cover bg-center scale-[1.2]"
                  style={{ backgroundImage: `url(${userProfile.avatarBorderActive.image_url})` }}
                />
              )}
              <UserAvatar src={userProfile?.avatarUrl || ''} name={userProfile?.name || ''} className="w-full h-full rounded-full" />
            </div>
            <span className="mt-2 text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full shadow-sm">
              Saya
            </span>
          </div>

          {/* Render 4 Slots */}
          {slots.map((aff, idx) => {
            const pos = positions[idx];
            if (aff) {
              const otherUser = aff.user.id === myId ? aff.target_user : aff.user;
              return (
                <Link 
                  key={idx}
                  to={`/profile/${otherUser.id}`}
                  className="absolute z-10 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-300"
                  style={{ left: pos.left, top: pos.top }}
                  title={`${otherUser.full_name} (${aff.relation_type})`}
                >
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 ${pos.borderClass} ${pos.bgClass} shadow-md flex items-center justify-center`}>
                     {otherUser.avatar_border_active_url && (
                        <div 
                          className="absolute inset-0 z-20 pointer-events-none bg-cover bg-center scale-[1.2]"
                          style={{ backgroundImage: `url(${otherUser.avatar_border_active_url})` }}
                        />
                      )}
                    <UserAvatar src={otherUser.avatar_url || ''} name={otherUser.full_name || otherUser.username} className="w-full h-full rounded-full" />
                    
                    {/* Tiny Badge */}
                    <div className="absolute -bottom-1 -right-1 p-1 bg-bg-surface border border-border/50 rounded-full shadow-sm z-30">
                      {getIcon(aff.relation_type)}
                    </div>
                  </div>
                  <span className={`mt-1 text-[9px] font-bold text-text-primary bg-bg-base/80 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[60px] text-center block border ${pos.borderClass}`}>
                    {otherUser.username}
                  </span>
                </Link>
              );
            } else {
              return (
                <button 
                  key={idx}
                  onClick={() => handleOpenModal(pos.type as AffinityRelationType)}
                  className="absolute z-10 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-300 focus:outline-none group"
                  style={{ left: pos.left, top: pos.top }}
                  title={`Tambah ${pos.label}`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed ${pos.borderClass} ${pos.bgClass} ${pos.hoverBg} ${pos.hoverBorder} flex items-center justify-center backdrop-blur-sm transition-all`}>
                    <UserPlus className={`w-5 h-5 ${pos.colorClass}`} />
                  </div>
                  <span className={`mt-1 text-[9px] font-bold ${pos.colorClass} ${pos.badgeBg} px-2 py-0.5 rounded-full border ${pos.borderClass} ${pos.hoverBg} transition-colors`}>
                    + {pos.label}
                  </span>
                </button>
              );
            }
          })}
        </div>
      </div>

      {/* Permintaan Masuk */}
      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Permintaan Masuk ({pendingReceived.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {pendingReceived.map(a => (
              <UserCard
                key={a.id}
                user={a.user}
                type={a.relation_type}
                subtitle={`Meminta menjadi ${a.relation_type === 'PACAR' ? 'pasangan' : a.relation_type.toLowerCase()}`}
                rightElement={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(a.id, 'ACCEPTED')}
                      disabled={processingId === a.id}
                      className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 rounded-lg transition-all"
                    >
                      {processingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRespond(a.id, 'REJECTED')}
                      disabled={processingId === a.id}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* List Afinitas Aktif */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border/40 pb-2">
          Daftar Afinitas ({activeAffinities.length})
        </h4>
        {activeAffinities.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {activeAffinities.map(a => {
              const otherUser = a.user.id === myId ? a.target_user : a.user;
              return (
                <UserCard
                  key={a.id}
                  user={otherUser}
                  type={a.relation_type}
                  subtitle={
                    <span className="flex items-center gap-1 text-[9px] font-mono">
                      <Clock className="w-3 h-3" /> Sejak {new Date(a.responded_at || a.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  }
                  rightElement={
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={processingId === a.id}
                      className="px-2.5 py-1.5 bg-bg-base hover:bg-red-500/10 text-muted hover:text-red-500 border border-border/60 hover:border-red-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      {processingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted italic">
            Daftar afinitas masih kosong. Ayo cari teman baru!
          </div>
        )}
      </div>

      {/* Permintaan Terkirim */}
      {pendingSent.length > 0 && (
        <div className="space-y-3 pt-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
            Permintaan Terkirim ({pendingSent.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 opacity-75 hover:opacity-100 transition-opacity">
            {pendingSent.map(a => (
              <UserCard
                key={a.id}
                user={a.target_user}
                type={a.relation_type}
                subtitle="Menunggu persetujuan..."
                rightElement={
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={processingId === a.id}
                    className="px-2.5 py-1.5 bg-bg-base hover:bg-border/60 text-text-secondary text-[10px] font-bold rounded-lg transition-colors border border-border/40"
                  >
                    Batal
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Ajukan Afinitas */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajukan Afinitas">
        <div className="p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-pink-500/ rounded-full flex items-center justify-center mx-auto border border-pink-500/30">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500/20" />
          </div>
          
          <div>
            <h3 className="text-xl font-black font-heading text-text-primary">Ajak Afinitas Baru</h3>
            <p className="text-sm text-text-secondary mt-1">
              Masukkan ID pengguna yang ingin diajak menjalin hubungan afinitas.
            </p>
          </div>

          <form onSubmit={handleSendRequest} className="space-y-4">
            <div className="space-y-1.5 text-left relative">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block">Cari Pengguna</label>
              
              {!selectedUser ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ketik username atau nama..."
                      className="w-full h-11 pl-10 pr-4 bg-bg-base border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    {isSearching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-bg-surface border border-border/60 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setTargetId(String(user.id));
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-bg-elevated flex items-center gap-3 transition-colors border-b border-border/20 last:border-0"
                        >
                          <UserAvatar src={user.profile?.avatar_url || ''} name={user.profile?.full_name || user.username} className="w-8 h-8 rounded-full shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-text-primary truncate">{user.profile?.full_name || user.username}</div>
                            <div className="text-[10px] text-muted truncate">@{user.username}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-bg-surface border border-border/60 rounded-xl shadow-xl p-3 text-xs text-center text-muted">
                      Pengguna tidak ditemukan
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={selectedUser.profile?.avatar_url || ''} name={selectedUser.profile?.full_name || selectedUser.username} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="text-sm font-bold text-primary">{selectedUser.profile?.full_name || selectedUser.username}</div>
                      <div className="text-xs text-muted">@{selectedUser.username}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setTargetId('');
                    }}
                    className="p-2 hover:bg-bg-base rounded-lg text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-muted uppercase tracking-wider block">Pilih Status Hubungan</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'PACAR', label: 'Pasangan', icon: <Heart className="w-4 h-4 text-pink-500" /> },
                  { value: 'SAHABAT', label: 'Sahabat', icon: <Flame className="w-4 h-4 text-orange-500" /> },
                  { value: 'TEMAN', label: 'Teman', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetType(opt.value as AffinityRelationType)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      targetType === opt.value
                        ? 'border-primary bg-primary/10 shadow-glow-sm'
                        : 'border-border/40 bg-bg-base/50 hover:bg-bg-base hover:border-primary/50'
                    }`}
                  >
                    {opt.icon}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${targetType === opt.value ? 'text-primary' : 'text-text-primary'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingRequest || !targetId}
              className="w-full h-11 bg-primary hover:bg-primary-light text-black font-bold rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {submittingRequest ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className="w-5 h-5 fill-black" />
              )}
              {submittingRequest ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </form>
        </div>
      </Modal>

    </div>
  );
};
