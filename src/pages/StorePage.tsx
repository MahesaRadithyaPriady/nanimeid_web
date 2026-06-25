import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, Wallet, Package, ShoppingCart, Trophy, Star, Sparkles, Gem, Clock, CircleDollarSign, ArrowUpRight, UserCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { resolveSrc } from '../lib/utils';
import { getWallet, earnCoins, getStoreItems, getCoinPacks, purchaseVip, purchaseBadge, getUserBadges, activateBadge, deactivateBadge, getSuperbadges, activateSuperbadge, deactivateSuperbadge, getStickers, purchaseSticker, getCoinTransactions, getCashoutRequests, requestCashout, getStoreBorders, purchaseStoreBorder, getQrisLogo, createQrisRequest, uploadQrisProof, getQrisRequests } from '../lib/storeApi';
import type { ApiStoreItem, ApiUserWallet, ApiUserBadge, ApiUserSuperBadge, ApiSticker, ApiSuperBadgeCatalog, ApiCoinTransaction, ApiCashoutRequest, ApiQrisInfo, ApiQrisRequest } from '../types';

export const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, addToast, userProfile, updateProfile } = useAppStore();

  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') || 'belanja';
  const [activeTab, setActiveTab] = useState<'belanja' | 'dompet' | 'inventaris'>(defaultTab as any);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [coinPacks, setCoinPacks] = useState<ApiStoreItem[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  // QRIS State
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisInfo, setQrisInfo] = useState<ApiQrisInfo | null>(null);
  const [qrisAmount, setQrisAmount] = useState('');
  const [qrisNote, setQrisNote] = useState('');
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisProcessing, setQrisProcessing] = useState(false);
  const [qrisActiveRequest, setQrisActiveRequest] = useState<ApiQrisRequest | null>(null);

  const handleOpenTopup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenQris();
  };

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as any);
    }
  }, [location.search]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    navigate(`/store?tab=${tab}`, { replace: true });
  };

  const handleOpenQris = async () => {
    setShowTopupModal(false);
    setShowQrisModal(true);
    setQrisProcessing(true);
    try {
      const res = await getQrisLogo();
      setQrisInfo(res.qris);
    } catch(err: any) {
      addToast('error', 'Gagal memuat info QRIS.');
      setShowQrisModal(false);
    } finally {
      setQrisProcessing(false);
    }
  };

  const handleSubmitQris = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrisFile) {
      addToast('error', 'Pilih file bukti pembayaran terlebih dahulu.');
      return;
    }
    const amt = parseInt(qrisAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('error', 'Nominal koin tidak valid.');
      return;
    }
    setQrisProcessing(true);
    setQrisActiveRequest(null);
    try {
      const reqRes = await createQrisRequest({ amount: amt, note: qrisNote });
      const reqId = reqRes.data.id;
      await uploadQrisProof(reqId, qrisFile);
      addToast('success', 'Permintaan topup berhasil dibuat! Menunggu verifikasi admin.');
      setShowQrisModal(false);
      setQrisAmount('');
      setQrisNote('');
      setQrisFile(null);
      handleTabChange('dompet');
    } catch(err: any) {
      if (err.code === 'QRIS_ACTIVE_REQUEST_EXISTS' || err.alreadyOwned || err.message?.toLowerCase().includes('belum selesai')) {
        addToast('error', err.message || 'Anda masih memiliki permintaan QRIS aktif.');
        if (err.data) setQrisActiveRequest(err.data);
      } else {
        addToast('error', err.message || 'Gagal mengirim permintaan QRIS.');
      }
    } finally {
      setQrisProcessing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Store className="w-20 h-20 text-border mb-6" />
        <h2 className="text-2xl font-bold font-heading mb-2">Akses Terbatas</h2>
        <p className="text-text-secondary max-w-md mb-8">Silakan login terlebih dahulu untuk mengakses Toko, Dompet, dan Inventaris.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>Login Sekarang</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <Store className="w-6 h-6" />
            <h2 className="text-lg font-bold uppercase tracking-wider">Store & Wallet</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-4">
            Toko NanimeID
          </h1>
          <p className="text-text-secondary max-w-2xl text-lg">
            Beli paket VIP, Badge eksklusif, Superbadge, hingga Stiker untuk profilmu.
          </p>
        </div>
        
        {/* Quick Wallet Summary */}
        <div className="bg-bg-surface/50 border border-border/50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-bg-surface transition-colors" onClick={() => handleTabChange('dompet')}>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <CircleDollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Saldo Koin</p>
            <p className="text-2xl font-bold font-mono text-yellow-400">{userProfile.coins ?? 0}</p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            className="ml-2 rounded-xl font-bold" 
            onClick={handleOpenTopup} 
          >
            + Koin
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border/50 mb-8 gap-6">
        {[
          { id: 'belanja', label: 'Toko Utama', icon: ShoppingCart },
          { id: 'dompet', label: 'Riwayat Koin', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 pb-4 px-2 text-sm md:text-base font-bold whitespace-nowrap transition-colors border-b-2 ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'belanja' && <ShopTab />}
        {activeTab === 'dompet' && <WalletTab />}
      </div>



      {showQrisModal && (
        <Modal isOpen={true} onClose={() => setShowQrisModal(false)} title="Topup Manual QRIS">
          <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
            {qrisProcessing && !qrisInfo && !qrisActiveRequest ? (
              <div className="text-center py-10 animate-pulse text-text-muted">Memuat QRIS...</div>
            ) : qrisActiveRequest ? (
               <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                 <h3 className="font-bold text-red-500 mb-2">Permintaan Aktif Ditemukan!</h3>
                 <p className="text-sm text-text-secondary mb-4">Anda masih memiliki permintaan sebesar {qrisActiveRequest.amount_coins} Koin yang berstatus {qrisActiveRequest.status}. Harap tunggu proses selesai maksimal 7 jam sebelum membuat yang baru.</p>
                 <Button variant="outline" onClick={() => setShowQrisModal(false)}>Tutup</Button>
               </div>
            ) : qrisInfo && (
              <form onSubmit={handleSubmitQris} className="space-y-6">
                <div className="flex flex-col items-center p-4 bg-bg-surface border border-border/50 rounded-xl">
                  <img src={qrisInfo.logoUrl} alt="QRIS" className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-lg mb-4 bg-white p-2" />
                  <p className="text-sm text-center text-text-secondary">{qrisInfo.note}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Nominal Koin</label>
                  <input type="number" required min="1" value={qrisAmount} onChange={e => setQrisAmount(e.target.value)} className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Contoh: 1000" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Catatan (Opsional)</label>
                  <input type="text" value={qrisNote} onChange={e => setQrisNote(e.target.value)} className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Catatan tambahan..." />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Bukti Pembayaran (Screenshot)</label>
                  <input type="file" required accept="image/*" onChange={e => setQrisFile(e.target.files?.[0] || null)} className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-3 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                </div>
                
                <div className="flex items-center gap-3 justify-end pt-4 border-t border-border/50">
                  <Button variant="ghost" type="button" onClick={() => setShowQrisModal(false)} disabled={qrisProcessing}>Batal</Button>
                  <Button variant="primary" type="submit" disabled={qrisProcessing || !qrisFile || !qrisAmount}>
                    {qrisProcessing ? 'Memproses...' : 'Kirim Bukti'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------------
// TAB: BELANJA (SHOP)
// --------------------------------------------------------------------------------
const ShopTab: React.FC = () => {
  const { addToast, updateProfile } = useAppStore();
  const [items, setItems] = useState<ApiStoreItem[]>([]);
  const [stickersCatalog, setStickersCatalog] = useState<ApiSticker[]>([]);
  const [storeBorders, setStoreBorders] = useState<any[]>([]);
  const [userPreview, setUserPreview] = useState<{avatar_url: string, full_name: string} | null>(null);
  const [loading, setLoading] = useState(true);

  // Buy state
  const [buyingItem, setBuyingItem] = useState<ApiStoreItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track purchased items locally for instant UI update
  const [purchasedBorderIds, setPurchasedBorderIds] = useState<Set<number>>(new Set());
  const [purchasedStickerItemIds, setPurchasedStickerItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [res, stRes, borderRes] = await Promise.all([
        getStoreItems(),
        getStickers().catch(() => ({ data: [] })),
        getStoreBorders().catch(() => ({ data: [], user_preview: null }))
      ]);
      setItems(res.data || []);
      setStickersCatalog(stRes.data || []);
      setStoreBorders(borderRes?.data || []);
      setUserPreview(borderRes?.user_preview || null);

      // Seed owned items from API response (if border has owned/purchased flag)
      const ownedBorders = new Set<number>();
      (borderRes?.data || []).forEach((b: any) => {
        if (b.owned || b.purchased || b.is_owned) ownedBorders.add(b.id);
      });
      setPurchasedBorderIds(ownedBorders);

      // Seed owned stickers from catalog (if has owned flag)
      const ownedStickerItems = new Set<number>();
      (stRes.data || []).forEach((s: any) => {
        if (s.owned || s.purchased || s.is_owned) {
          // Find matching store item by sticker_id
          const matchingItem = (res.data || []).find((i: any) => i.sticker_id === s.id || (i as any).sticker?.id === s.id);
          if (matchingItem) ownedStickerItems.add(matchingItem.id);
        }
      });
      setPurchasedStickerItemIds(ownedStickerItems);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat katalog toko.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!buyingItem) return;
    setIsProcessing(true);
    try {
      let res;
      if (buyingItem.item_type === 'VIP') {
        res = await purchaseVip(buyingItem.id);
      } else if (buyingItem.item_type === 'BADGE' || buyingItem.item_type === 'SUPERBADGE') {
        res = await purchaseBadge(buyingItem.id, buyingItem.item_type);
      } else if (buyingItem.item_type === 'STICKER') {
        res = await purchaseSticker(buyingItem.id);
      } else if (buyingItem.item_type === 'BORDER') {
        res = await purchaseStoreBorder(buyingItem.id);
      } else {
        throw new Error('Tipe item tidak didukung');
      }
      
      addToast('success', res.message || 'Pembelian berhasil!');
      if (res.wallet) {
        updateProfile({ coins: res.wallet.balance_coins });
      }

      // Update local purchase tracking for instant UI update
      if (buyingItem.item_type === 'BORDER') {
        setPurchasedBorderIds(prev => new Set(prev).add(buyingItem.id));
      } else if (buyingItem.item_type === 'STICKER') {
        setPurchasedStickerItemIds(prev => new Set(prev).add(buyingItem.id));
      }

      setBuyingItem(null);
    } catch (err: any) {
      if (err.message?.includes('sudah dimiliki') || err.alreadyOwned) {
        addToast('error', 'Item ini sudah Anda miliki!');
      } else {
        addToast('error', err.message || 'Gagal membeli item.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-text-muted">Memuat katalog toko...</div>;
  }

  const vipItems = items.filter(i => i.item_type === 'VIP');
  const superbadgeItems = items.filter(i => i.item_type === 'SUPERBADGE');
  const stickerItems = items.filter(i => i.item_type === 'STICKER');

  const renderGrid = (list: ApiStoreItem[], title: string, icon: any) => {
    if (list.length === 0) return null;
    const Icon = icon;
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Icon className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold font-heading">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
          {list.map(item => {
            const isPurchased = item.item_type === 'STICKER' && purchasedStickerItemIds.has(item.id);
            return (
            <div key={item.id} className={`bg-bg-surface border border-border/50 hover:border-primary/50 transition-colors rounded-2xl p-4 sm:p-6 flex flex-col justify-between group shadow-sm ${isPurchased ? 'opacity-70' : ''}`}>
              <div>
                <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4 gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {item.item_type === 'VIP' && <Gem className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400" />}
                    {item.item_type === 'BADGE' && <Trophy className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-400" />}
                    {item.item_type === 'SUPERBADGE' && <Star className="w-5 h-5 sm:w-8 sm:h-8 text-purple-400" />}
                    {item.item_type === 'STICKER' && <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-pink-400" />}
                  </div>
                  <Badge variant={item.item_type === 'VIP' ? 'completed' : 'rating'} className="text-[9px] sm:text-xs py-0.5 px-1.5 sm:px-2.5 whitespace-nowrap">
                    {item.item_type}
                  </Badge>
                </div>
                {/* Bagian Gambar */}
                {(() => {
                  const stickerMatch = item.sticker_id ? stickersCatalog.find(s => s.id === item.sticker_id) : null;
                  const img = stickerMatch?.image_url || item.badge_icon || (item as any).badge_url || (item as any).image_url || (item as any).sticker_url || (item as any).icon_url || (item as any).icon || (item as any).image;
                  
                  const nestedObj = (item as any).sticker || (item as any).badge || (item as any).sticker_data || {};
                  const nestedImg = nestedObj.image_url || nestedObj.badge_url || nestedObj.badge_icon || nestedObj.icon;
                  
                  const fallbackImg = img || nestedImg || Object.values(item).find(v => typeof v === 'string' && (v.includes('.png') || v.includes('.jpg') || v.includes('.webp') || v.includes('.gif') || v.includes('/static/'))) as string | undefined;
                  
                  return fallbackImg ? (
                    <div className="w-full aspect-square flex items-center justify-center mb-3 sm:mb-6 mt-2 relative group-hover:scale-110 transition-transform duration-300">
                      <img src={resolveSrc(fallbackImg)} alt={item.title} className="w-[80%] h-[80%] object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
                    </div>
                  ) : null;
                })()}

                {/* Bagian Teks */}
                <h4 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{item.title}</h4>
                {item.description && (
                  <p className="hidden sm:block text-text-secondary text-xs sm:text-sm mb-4 line-clamp-2">{item.description}</p>
                )}
              </div>
              
              <div className="flex flex-row items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-4 border-t border-border/50 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-yellow-400 text-sm sm:text-lg">
                  <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg">{item.coin_price}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => !isPurchased && setBuyingItem(item)}
                  disabled={isPurchased}
                  className={`px-3 sm:px-5 py-2 sm:py-2 text-xs sm:text-sm font-bold shadow-glow transition-all ${
                    isPurchased
                      ? 'opacity-60 cursor-default'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  {isPurchased ? '✓ Dimiliki' : 'Beli'}
                </Button>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    );
  };

  const renderBordersGrid = () => {
    if (storeBorders.length === 0) return null;
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <UserCircle className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold font-heading">Avatar Border</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
          {storeBorders.filter(b => !purchasedBorderIds.has(b.id)).map(border => (
            <div key={border.id} className="bg-bg-surface border border-border/50 hover:border-primary/50 transition-colors rounded-2xl p-4 sm:p-6 flex flex-col justify-between group shadow-sm">
              <div>
                <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4 gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <UserCircle className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-400" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="rating" className="text-[9px] sm:text-xs py-0.5 px-1.5 sm:px-2.5 whitespace-nowrap">
                      Tier {border.tier}
                    </Badge>
                    {border.is_limited && (
                      <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">Limited</span>
                    )}
                  </div>
                </div>
                
                <div className="relative aspect-square w-full bg-bg-base/50 rounded-xl mb-3 sm:mb-4 overflow-hidden flex flex-col items-center justify-center p-4 border border-border/30 group-hover:border-primary/30 transition-colors">
                  <div className="relative w-[80%] h-[80%] flex items-center justify-center">
                    {userPreview?.avatar_url && (
                      <img src={resolveSrc(userPreview.avatar_url)} alt="Avatar" className="w-[65%] h-[65%] rounded-full object-cover z-0" />
                    )}
                    <img 
                      src={resolveSrc(border.image_url)} 
                      alt={border.title} 
                      className="absolute inset-0 w-full h-full object-cover z-10"
                    />
                  </div>
                </div>
                
                <h4 className="font-bold text-base sm:text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{border.title}</h4>
                {border.is_limited && border.remaining !== null && (
                  <p className="text-[10px] sm:text-xs text-text-muted mt-1">
                    Sisa: <span className="text-white font-bold">{border.remaining}</span> / {border.total_supply}
                  </p>
                )}
              </div>
              
              <div className="flex flex-row items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-4 border-t border-border/50 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-yellow-400 text-sm sm:text-lg">
                  <CircleDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg">{border.coin_price}</span>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={border.is_limited && border.remaining === 0}
                  onClick={() => setBuyingItem({ ...border, item_type: 'BORDER' })} 
                  className="px-3 sm:px-5 py-2 sm:py-2 text-xs sm:text-sm font-bold shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {border.is_limited && border.remaining === 0 ? 'Habis' : 'Beli'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderGrid(vipItems, 'Keanggotaan VIP', Gem)}
      {renderBordersGrid()}
      {renderGrid(superbadgeItems, 'Koleksi Superbadge', Star)}
      {renderGrid(stickerItems, 'Koleksi Stiker', Sparkles)}

      {/* Buy Modal */}
      {buyingItem && (
        <Modal isOpen={true} onClose={() => !isProcessing && setBuyingItem(null)} title="Konfirmasi Pembelian">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Konfirmasi Pembelian</h2>
            <p className="text-text-secondary mb-6">
              Anda akan membeli <strong>{buyingItem.title}</strong> seharga <span className="text-yellow-400 font-bold">{buyingItem.coin_price} Koin</span>. Lanjutkan?
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBuyingItem(null)} disabled={isProcessing}>Batal</Button>
              <Button variant="primary" onClick={handlePurchase} disabled={isProcessing}>
                {isProcessing ? 'Memproses...' : 'Ya, Beli Sekarang'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------------
// TAB: INVENTARIS (INVENTORY)
// --------------------------------------------------------------------------------
const InventoryTab: React.FC = () => {
  const { addToast } = useAppStore();
  const [badges, setBadges] = useState<ApiUserBadge[]>([]);
  const [superbadges, setSuperbadges] = useState<ApiSuperBadgeCatalog[]>([]);
  const [stickers, setStickers] = useState<ApiSticker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [bRes, sbRes, stRes] = await Promise.all([
        getUserBadges().catch(() => []),
        getSuperbadges().catch(() => ({ data: [] })),
        getStickers().catch(() => ({ data: [] }))
      ]);
      setBadges(Array.isArray(bRes) ? bRes : (bRes as any).data || []);
      setSuperbadges((sbRes.data || []).filter(sb => sb.is_owned));
      setStickers((stRes.data || []).filter(st => st.is_owned));
    } catch (err: any) {
      addToast('error', 'Gagal memuat inventaris.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBadge = async (badgeName: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await deactivateBadge(); // This deactivates ALL badges based on the API spec, wait, we might need deactivateOne
        addToast('success', 'Badge dilepas.');
      } else {
        await activateBadge(badgeName); // Activates one badge, max 3
        addToast('success', 'Badge digunakan.');
      }
      loadInventory();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengubah status badge.');
    }
  };

  const handleToggleSuperbadge = async (badgeId: number, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await deactivateSuperbadge();
        addToast('success', 'Superbadge dilepas.');
      } else {
        await activateSuperbadge(badgeId);
        addToast('success', 'Superbadge digunakan.');
      }
      loadInventory();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengubah status superbadge.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-text-muted">Memuat inventaris Anda...</div>;
  }

  return (
    <div className="space-y-12">
      {/* Superbadges */}
      <div>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Star className="text-purple-400" /> Superbadge Saya</h3>
        {superbadges.length === 0 ? (
          <p className="text-text-muted">Anda belum memiliki superbadge.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {superbadges.map(sb => (
              <div key={sb.id} className={`p-4 rounded-2xl border ${sb.is_active ? 'border-primary bg-primary/10 shadow-glow' : 'border-border/50 bg-bg-surface'} flex flex-col items-center text-center transition-colors`}>
                <img src={resolveSrc(sb.badge_url || (sb as any).badge_icon || (sb as any).image_url)} alt={sb.name} className="w-20 h-20 object-contain mb-3 drop-shadow-md" referrerPolicy="no-referrer" />
                <p className="font-bold text-sm mb-3 line-clamp-2">{sb.name}</p>
                <Button variant={sb.is_active ? 'primary' : 'outline'} size="sm" className="w-full text-xs" onClick={() => handleToggleSuperbadge(sb.id, sb.is_active)}>
                  {sb.is_active ? 'Dipakai' : 'Gunakan'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stickers */}
      <div>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-pink-400" /> Stiker Saya</h3>
        {stickers.length === 0 ? (
          <p className="text-text-muted">Anda belum memiliki stiker.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {stickers.map(st => (
              <div key={st.id} className="p-3 rounded-xl border border-border/50 bg-bg-surface flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-colors">
                <img src={resolveSrc(st.image_url || (st as any).badge_icon)} alt={st.name} className="w-24 h-24 object-contain mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" referrerPolicy="no-referrer" />
                <p className="font-bold text-[11px] line-clamp-2 leading-tight">{st.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// TAB: DOMPET & RIWAYAT (WALLET & CASHOUT)
// --------------------------------------------------------------------------------
const WalletTab: React.FC = () => {
  const { addToast, userProfile, updateProfile } = useAppStore();
  const [wallet, setWallet] = useState<ApiUserWallet | null>(null);
  const [txs, setTxs] = useState<ApiCoinTransaction[]>([]);
  const [cashouts, setCashouts] = useState<ApiCashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingEarn, setProcessingEarn] = useState(false);

  // Cashout form
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutCoins, setCashoutCoins] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState('');
  const [cashoutAddress, setCashoutAddress] = useState('');
  const [processingCashout, setProcessingCashout] = useState(false);

  const [qrisReqs, setQrisReqs] = useState<ApiQrisRequest[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, txRes, cRes, qrRes] = await Promise.all([
        getWallet(),
        getCoinTransactions(1, 10).catch(() => ({ data: [] })),
        getCashoutRequests(1, 10).catch(() => ({ data: [] })),
        getQrisRequests(1, 10).catch(() => ({ items: [] }))
      ]);
      setWallet(wRes);
      updateProfile({ coins: wRes.balance_coins });
      setTxs(txRes.data || []);
      setCashouts(cRes.data || []);
      setQrisReqs(qrRes.items || []);
    } catch (err: any) {
      addToast('error', 'Gagal memuat data dompet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEarnCoins = async () => {
    setProcessingEarn(true);
    try {
      const res = await earnCoins('manual_claim');
      setWallet(res);
      updateProfile({ coins: res.balance_coins });
      addToast('success', 'Berhasil mengklaim 10 Koin!');
      loadData(); // reload txs
    } catch (err: any) {
      addToast('error', err.message || 'Gagal klaim koin.');
    } finally {
      setProcessingEarn(false);
    }
  };

  const handleCashoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const coins = parseInt(cashoutCoins);
    if (!coins || coins < 100) {
      addToast('error', 'Minimal pencairan adalah 100 koin.');
      return;
    }
    if (coins > (wallet?.balance_coins || 0)) {
      addToast('error', 'Saldo koin tidak mencukupi.');
      return;
    }
    
    setProcessingCashout(true);
    try {
      await requestCashout({
        coins,
        payoutMethod: cashoutMethod,
        payoutAddress: cashoutAddress
      });
      addToast('success', 'Pengajuan cashout berhasil dibuat!');
      setShowCashoutModal(false);
      setCashoutCoins('');
      setCashoutMethod('');
      setCashoutAddress('');
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengajukan cashout.');
    } finally {
      setProcessingCashout(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-text-muted">Memuat data dompet...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Riwayat */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Riwayat Koin Terakhir</h3>
          {txs.length === 0 ? (
            <div className="p-8 border border-border/50 border-dashed rounded-2xl text-center text-text-muted">Belum ada transaksi koin.</div>
          ) : (
            <div className="bg-bg-surface border border-border/50 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-elevated text-text-secondary">
                  <tr>
                    <th className="p-4 font-semibold">Tipe</th>
                    <th className="p-4 font-semibold">Jumlah</th>
                    <th className="p-4 font-semibold">Referensi</th>
                    <th className="p-4 font-semibold">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {txs.map(tx => (
                    <tr key={tx.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="p-4">
                        <Badge variant={tx.type === 'EARN' ? 'completed' : tx.type === 'SPEND' ? 'rating' : 'type'}>{tx.type}</Badge>
                      </td>
                      <td className={`p-4 font-bold font-mono ${tx.type === 'EARN' ? 'text-green-400' : tx.type === 'SPEND' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {tx.type === 'EARN' ? '+' : tx.type === 'SPEND' ? '-' : ''}{tx.amount}
                      </td>
                      <td className="p-4 text-text-secondary">{tx.ref || '-'}</td>
                      <td className="p-4 text-text-muted">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Riwayat QRIS */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Riwayat Topup Manual QRIS</h3>
          {qrisReqs.length === 0 ? (
            <div className="p-8 border border-border/50 border-dashed rounded-2xl text-center text-text-muted">Belum ada riwayat topup QRIS.</div>
          ) : (
            <div className="bg-bg-surface border border-border/50 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-elevated text-text-secondary">
                  <tr>
                    <th className="p-4 font-semibold">Nominal (Koin)</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {qrisReqs.map(req => (
                    <tr key={req.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="p-4 font-bold font-mono text-yellow-400">+{req.amount_coins}</td>
                      <td className="p-4">
                        {req.status === 'APPROVED' || req.status === 'PAID' ? (
                          <span className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full bg-green-500/20 text-green-400">Berhasil</span>
                        ) : req.status === 'PENDING' ? (
                          <span className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full bg-yellow-500/20 text-yellow-400">Menunggu</span>
                        ) : req.status === 'REJECTED' || req.status === 'CANCELED' ? (
                          <span className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full bg-red-500/20 text-red-400">Ditolak</span>
                        ) : (
                          <span className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full bg-gray-500/20 text-gray-400">{req.status}</span>
                        )}
                      </td>
                      <td className="p-4 text-text-muted">
                        {(req.created_at || (req as any).createdAt) 
                          ? new Date(req.created_at || (req as any).createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) 
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};
