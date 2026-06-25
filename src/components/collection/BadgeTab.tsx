import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, Award, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { resolveSrc } from '../../lib/utils';
import {
  getMyBadges,
  activateOneBadge,
  deactivateOneBadge,
} from '../../lib/storeApi';
import type { ApiBadgeMineItem } from '../../types';

export const BadgeTab: React.FC = () => {
  const { addToast, fetchMyProfileData } = useAppStore();
  const [owned, setOwned] = useState<ApiBadgeMineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await getMyBadges();
      setOwned(mine);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat badge');
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeCount = owned.filter(b => b.is_active).length;

  const handleActivate = async (badgeName: string) => {
    if (activeCount >= 3) { addToast('error', 'Maksimal 3 badge aktif. Nonaktifkan salah satu dulu.'); return; }
    setActivating(badgeName);
    try {
      await activateOneBadge(badgeName);
      addToast('success', 'Badge diaktifkan!');
      await loadData();
      await fetchMyProfileData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengaktifkan badge');
    } finally { setActivating(null); }
  };

  const handleDeactivate = async (badgeName: string) => {
    setDeactivating(badgeName);
    try {
      await deactivateOneBadge(badgeName);
      addToast('success', 'Badge dinonaktifkan!');
      await loadData();
      await fetchMyProfileData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menonaktifkan badge');
    } finally { setDeactivating(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Active badges info */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 bg-bg-surface border border-border/40 rounded-xl p-3">
          <Award className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-text-secondary">{activeCount}/3 badge aktif</span>
        </div>
      )}

      {/* Owned grid only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {owned.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Award className="w-10 h-10 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">Belum ada badge dimiliki</p>
            <p className="text-xs text-muted mt-1">Beli badge di Toko untuk menambah koleksi</p>
          </div>
        ) : owned.map((badge) => (
            <div key={badge.id} className={`bg-bg-surface rounded-xl overflow-hidden border transition-colors ${badge.is_active ? 'border-primary ring-1 ring-primary/30' : 'border-border/40 hover:border-primary/50'}`}>
              <div className="relative aspect-square flex items-center justify-center bg-bg-base/50">
                {badge.badge_icon ? (
                  <img src={resolveSrc(badge.badge_icon)} alt={badge.badge_name} className="w-full h-full object-cover" />
                ) : (
                  <Award className="w-8 h-8 text-muted" />
                )}
                {badge.is_active && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Aktif
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-text-primary truncate" style={badge.title_color ? { color: badge.title_color } : undefined}>
                  {badge.badge_name}
                </p>
                <p className="text-[10px] text-muted mb-2">Diperoleh: {new Date(badge.obtained_at).toLocaleDateString('id-ID')}</p>
                {badge.is_active ? (
                  <button onClick={() => handleDeactivate(badge.badge_name)} disabled={deactivating === badge.badge_name} className="w-full text-[10px] bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                    {deactivating === badge.badge_name ? '...' : <><X className="w-3 h-3" /> Nonaktifkan</>}
                  </button>
                ) : (
                  <button onClick={() => handleActivate(badge.badge_name)} disabled={activating === badge.badge_name} className="w-full text-[10px] bg-primary hover:bg-primary/90 text-white py-1.5 rounded-lg font-bold disabled:opacity-50 transition-colors">
                    {activating === badge.badge_name ? '...' : 'Aktifkan'}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
