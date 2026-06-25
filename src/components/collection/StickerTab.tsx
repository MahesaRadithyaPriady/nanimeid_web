import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, Sticker as StickerIcon } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { resolveSrc } from '../../lib/utils';
import { getStickers } from '../../lib/storeApi';
import type { ApiSticker } from '../../types';

export const StickerTab: React.FC = () => {
  const { addToast } = useAppStore();
  const [stickers, setStickers] = useState<ApiSticker[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStickers();
      const all = res?.data ?? [];
      setStickers(all.filter((s) => s.is_owned));
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat stiker');
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {stickers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <StickerIcon className="w-10 h-10 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">Belum ada stiker dimiliki</p>
            <p className="text-xs text-muted mt-1">Beli stiker di Toko untuk menambah koleksi</p>
          </div>
        ) : stickers.map((sticker) => (
          <div key={sticker.id} className="bg-bg-surface border border-border/40 rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
            <div className="relative aspect-square flex items-center justify-center bg-bg-base/50">
              <img src={resolveSrc(sticker.image_url)} alt={sticker.name} className="w-full h-full object-cover" />
              <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Dimiliki
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold text-text-primary truncate">{sticker.name}</p>
              {sticker.description && <p className="text-[10px] text-muted truncate mb-2">{sticker.description}</p>}
              {sticker.acquired_at && (
                <p className="text-[10px] text-muted">Diperoleh: {new Date(sticker.acquired_at).toLocaleDateString('id-ID')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
