import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Crown, X, Loader2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { resolveSrc } from '../../lib/utils';
import {
  fetchMyAvatarBorders,
  fetchActiveAvatarBorder,
  setActiveAvatarBorder,
  disableActiveAvatarBorder,
  checkAvatarBorderVipEligibility,
} from '../../lib/avatarBorderApi';
import type {
  ApiUserAvatarBorder,
  AvatarBorderTier,
} from '../../types';

const tierColors: Record<AvatarBorderTier, string> = {
  C: 'bg-gray-500',
  B: 'bg-green-500',
  A: 'bg-blue-500',
  S: 'bg-purple-500',
  S_PLUS: 'bg-yellow-500',
  SS_PLUS: 'bg-orange-500',
  SSS_PLUS: 'bg-red-500',
};

const tierLabels: Record<AvatarBorderTier, string> = {
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
  S_PLUS: 'S+',
  SS_PLUS: 'SS+',
  SSS_PLUS: 'SSS+',
};

export const AvatarBorderTab: React.FC = () => {
  const { addToast, fetchMyProfileData } = useAppStore();
  const [owned, setOwned] = useState<ApiUserAvatarBorder[]>([]);
  const [active, setActive] = useState<ApiUserAvatarBorder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipData, setVipData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ownRes, actRes] = await Promise.all([
        fetchMyAvatarBorders(),
        fetchActiveAvatarBorder(),
      ]);
      setOwned(ownRes.items);
      setActive(actRes.item);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat avatar border');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleActivate = async (border: ApiUserAvatarBorder) => {
    setActivating(border.id);
    try {
      const elig = await checkAvatarBorderVipEligibility();
      if (!elig.data.eligible) {
        setVipData(elig.data);
        setShowVipModal(true);
        return;
      }
      await setActiveAvatarBorder(border.border_id);
      addToast('success', 'Border berhasil diaktifkan!');
      await loadData();
      await fetchMyProfileData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengaktifkan border');
    } finally { setActivating(null); }
  };

  const handleDeactivate = async () => {
    try {
      await disableActiveAvatarBorder();
      addToast('success', 'Border dinonaktifkan');
      await loadData();
      await fetchMyProfileData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menonaktifkan border');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Active border banner */}
      {active && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <img src={resolveSrc(active.image_url)} alt={active.title} className="w-12 h-12 rounded-lg object-cover border border-white/20" />
            <div>
              <p className="text-sm font-bold text-text-primary">{active.title}</p>
              <p className="text-xs text-purple-400">Border aktif</p>
            </div>
          </div>
          <button onClick={handleDeactivate} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Nonaktifkan
          </button>
        </div>
      )}

      {/* Owned grid only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {owned.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">Belum ada border dimiliki</p>
            <p className="text-xs text-muted mt-1">Beli border di Toko untuk menambah koleksi</p>
          </div>
        ) : owned.map((border) => (
          <div key={border.id} className={`bg-bg-surface rounded-2xl border transition-all ${border.is_active ? 'border-primary ring-2 ring-primary/30' : 'border-border/40 hover:border-primary/50'}`}>
            {/* Border preview — circular frame around avatar placeholder */}
            <div className="flex flex-col items-center pt-6 pb-4 px-4 gap-4">
              <div className="relative w-48 h-48 flex-shrink-0">
                {/* Avatar placeholder */}
                <div className="absolute inset-[14%] rounded-full bg-bg-elevated flex items-center justify-center z-10">
                  <span className="text-2xl font-black text-text-secondary select-none">A</span>
                </div>
                {/* Border image — full size, layered on top */}
                <img
                  src={resolveSrc(border.image_url)}
                  alt={border.title}
                  className="absolute inset-0 w-full h-full object-contain z-20"
                />
                {/* Active badge */}
                {border.is_active && (
                  <div className="absolute -top-1 -left-1 z-30 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow">
                    <Sparkles className="w-2.5 h-2.5" /> Aktif
                  </div>
                )}
                {/* Tier badge */}
                <div className={`absolute -top-1 -right-1 z-30 ${tierColors[border.tier]} text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow`}>
                  {tierLabels[border.tier]}
                </div>
              </div>

              <div className="w-full text-center space-y-0.5">
                <p className="text-xs font-bold text-text-primary truncate">{border.title}</p>
                <p className="text-[10px] text-muted">Diperoleh: {new Date(border.obtained_at).toLocaleDateString('id-ID')}</p>
              </div>

              {border.is_active ? (
                <button onClick={handleDeactivate} className="w-full text-[10px] bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1">
                  <X className="w-3 h-3" /> Nonaktifkan
                </button>
              ) : (
                <button onClick={() => handleActivate(border)} disabled={activating === border.id} className="w-full text-[10px] bg-primary hover:bg-primary/90 text-white py-1.5 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                  {activating === border.id ? '...' : <><Crown className="w-3 h-3" /> Aktifkan</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VIP Modal */}
      <Modal isOpen={showVipModal} onClose={() => setShowVipModal(false)} title="Fitur VIP">
        <div className="text-center py-2">
          <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
          <p className="text-sm text-text-primary font-bold mb-1">Fitur Khusus VIP</p>
          <p className="text-xs text-muted mb-3">{vipData?.reason || 'Anda perlu VIP untuk mengaktifkan border'}</p>
          {vipData?.required?.min_tier && <p className="text-xs text-purple-400 mb-3">Minimal: {vipData.required.min_tier}</p>}
          <Button variant="secondary" size="sm" onClick={() => setShowVipModal(false)}>Tutup</Button>
        </div>
      </Modal>
    </div>
  );
};
