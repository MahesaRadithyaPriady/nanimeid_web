import React, { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap, Loader2, Tag, AlertCircle, Ticket, X } from 'lucide-react';
import { getVipPlans, buyVipPackage, validateVoucher, getAvailableVouchers } from '../lib/vipApi';
import { useAppStore } from '../stores/useAppStore';
import type { ApiVipPlan } from '../types';
import { useNavigate } from 'react-router-dom';

export const VipCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile, addToast } = useAppStore();
  const [plans, setPlans] = useState<ApiVipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Checkout states
  const [checkoutPlan, setCheckoutPlan] = useState<ApiVipPlan | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherApplied, setVoucherApplied] = useState(false);

  // Voucher List states
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await getVipPlans(1, 20, false);
      if (res && res.data && res.data.items) {
        setPlans(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load VIP plans:', err);
      // Fallback dummy data if backend is not ready
      setPlans([
        { id: 1, name: 'Silver', description: 'Akses fitur dasar premium.', benefits: ['Bebas Iklan', 'Kualitas 720p', 'Badge Silver'], price_coins: 500, duration_days: 7, color: '#C0C0C0', is_active: true },
        { id: 2, name: 'Gold', description: 'Akses penuh fitur premium terbaik.', benefits: ['Bebas Iklan', 'Kualitas 1080p', 'Badge Gold', 'Akses Lebih Awal'], price_coins: 1000, duration_days: 30, color: '#FFD700', is_active: true },
        { id: 3, name: 'Diamond', description: 'Pengalaman menonton kasta tertinggi.', benefits: ['Bebas Iklan', 'Kualitas 4K', 'Badge Diamond', 'Akses Lebih Awal', 'Prioritas Support'], price_coins: 2500, duration_days: 90, color: '#00BFFF', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = (plan: ApiVipPlan) => {
    if (!userProfile) {
      addToast('error', 'Silakan login terlebih dahulu.');
      return;
    }
    setCheckoutPlan(plan);
    setVoucherCode('');
    setFinalPrice(plan.price_coins);
    setVoucherApplied(false);
    setVoucherError(null);
  };

  const openVoucherList = async () => {
    setShowVoucherList(true);
    setLoadingVouchers(true);
    try {
      const res = await getAvailableVouchers();
      if (res?.data?.items) {
        setAvailableVouchers(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const selectVoucher = (code: string) => {
    setVoucherCode(code);
    setShowVoucherList(false);
    handlePreviewVoucher(code); // Langsung otomatis validasi
  };

  const handlePreviewVoucher = async (directCode?: string) => {
    const codeToValidate = directCode || voucherCode;
    if (!codeToValidate.trim() || !checkoutPlan) return;
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const res = await validateVoucher(codeToValidate);
      if (res.data && res.data.valid && res.data.voucher) {
        let price = checkoutPlan.price_coins;
        let discount = 0;
        if (res.data.voucher.discount_percent) {
          discount += Math.floor(price * (res.data.voucher.discount_percent / 100));
        }
        if (res.data.voucher.discount_amount) {
          discount += res.data.voucher.discount_amount;
        }
        setFinalPrice(Math.max(0, price - discount));
        setVoucherApplied(true);
        addToast('success', 'Voucher berhasil diterapkan!');
      } else {
        throw new Error(res.data?.reason || 'Voucher tidak valid.');
      }
    } catch (err: any) {
      setVoucherError(err.message || 'Voucher tidak dapat digunakan.');
      setVoucherApplied(false);
      setFinalPrice(checkoutPlan.price_coins);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutPlan) return;
    
    if ((userProfile?.coins || 0) < (finalPrice ?? checkoutPlan.price_coins)) {
      addToast('error', 'Koin tidak cukup untuk membeli paket ini.');
      return;
    }

    setProcessingId(checkoutPlan.id);
    const planToProcess = checkoutPlan;
    setCheckoutPlan(null); // Tutup modal checkout

    try {
      const res = await buyVipPackage({
        planId: planToProcess.id,
        voucherCode: voucherApplied ? voucherCode : undefined,
        durationDays: planToProcess.duration_days
      });
      updateProfile({ coins: res.wallet_balance, vipLevel: res.vip.level, isVip: true });
      navigate(`/profile?tab=vip&success_vip=true&plan=${encodeURIComponent(planToProcess.name)}`);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal berlangganan paket VIP.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
        <p className="text-text-muted animate-pulse">Memuat katalog eksklusif...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-12 bg-yellow-500/ border border-yellow-500/20 p-8 sm:p-16 text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-6">
            <Crown className="w-10 h-10 text-bg-base" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-heading mb-4 text-yellow-500">
            Tingkatkan Pengalaman Nontonmu!
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Berlangganan NanimeID VIP dan nikmati ribuan episode anime tanpa jeda iklan, kualitas maksimal, serta koleksi lencana eksklusif di profilmu.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isProcessing = processingId === plan.id;
          const isDiamond = plan.name.toLowerCase().includes('diamond');
          const isCurrentVip = userProfile?.vipLevel?.toLowerCase() === plan.name.toLowerCase();
          
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-6 sm:p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2
                ${isDiamond 
                  ? 'bg-cyan-500/ border-cyan-400/50 shadow-2xl shadow-cyan-400/10' 
                  : 'bg-bg-surface border-border/50 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/5'
                }`}
            >
              {isDiamond && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-blue-500/20">
                  <Star className="w-3 h-3 fill-white" />
                  PALING POPULER
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black font-heading mb-2 flex items-center gap-2" style={{ color: plan.color || '#fff' }}>
                  {plan.name}
                  {isCurrentVip && (
                    <span className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 uppercase tracking-wider">
                      Aktif
                    </span>
                  )}
                </h3>
                <p className="text-sm text-text-muted min-h-[40px]">
                  {plan.description || `Paket eksklusif ${plan.name} untuk pengalaman luar biasa.`}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black font-heading tracking-tight">{plan.price_coins.toLocaleString('id-ID')}</span>
                  <span className="text-text-muted text-sm pb-1 font-bold">Koin</span>
                </div>
                <div className="text-sm text-yellow-500/80 font-semibold bg-yellow-500/10 inline-block px-3 py-1 rounded-full mt-2">
                  Aktif {plan.duration_days || 30} Hari
                </div>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.benefits?.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 min-w-[20px] w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-text-secondary leading-snug">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCheckoutClick(plan)}
                disabled={processingId !== null || isCurrentVip}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
                  ${isCurrentVip
                    ? 'bg-green-500/10 border border-green-500/50 text-green-400 cursor-default'
                    : isDiamond
                      ? 'bg-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                      : 'bg-yellow-500 text-bg-base hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/25'
                  }
                  ${(processingId !== null && !isCurrentVip) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentVip ? (
                  <>
                    <Check className="w-5 h-5" /> Paket Saat Ini
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Beli Sekarang
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center p-12 bg-bg-surface border border-border/50 rounded-2xl">
          <p className="text-text-muted">Katalog VIP sedang kosong atau tidak tersedia saat ini.</p>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-bg-elevated border border-border/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Konfirmasi Pembelian VIP
            </h2>
            
            <div className="bg-bg-surface rounded-xl p-4 mb-6 border border-border/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary">Paket:</span>
                <span className="font-bold text-white">{checkoutPlan.name} ({checkoutPlan.duration_days || 30} Hari)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Harga Asli:</span>
                <span className={`font-bold ${voucherApplied ? 'line-through text-red-400/80 text-sm' : 'text-yellow-400 text-lg'}`}>
                  {checkoutPlan.price_coins.toLocaleString('id-ID')} Koin
                </span>
              </div>
              {voucherApplied && finalPrice !== null && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                  <span className="text-green-400 font-bold flex items-center gap-1"><Tag className="w-4 h-4"/> Setelah Voucher:</span>
                  <span className="font-bold text-green-400 text-xl">{finalPrice.toLocaleString('id-ID')} Koin</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-text-secondary mb-2">Punya Kode Voucher?</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Masukkan kode..."
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  disabled={voucherLoading || voucherApplied}
                  className="flex-1 bg-bg-base border border-border/50 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
                />
                {!voucherApplied ? (
                  <button
                    onClick={() => handlePreviewVoucher()}
                    disabled={!voucherCode.trim() || voucherLoading}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-3 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {voucherLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Terapkan'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setVoucherApplied(false);
                      setVoucherCode('');
                      setFinalPrice(checkoutPlan.price_coins);
                    }}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={openVoucherList}
                  className="text-sm text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Ticket className="w-4 h-4" /> Lihat Voucher Tersedia
                </button>
              </div>
              {voucherError && (
                <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {voucherError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setCheckoutPlan(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-bg-surface hover:bg-bg-base transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-yellow-500 text-bg-base hover:bg-yellow-400 transition-colors"
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Vouchers Modal */}
      {showVoucherList && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-bg-elevated border border-border/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                <Ticket className="w-5 h-5 text-yellow-500" /> Voucher Tersedia
              </h2>
              <button onClick={() => setShowVoucherList(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {loadingVouchers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>
              ) : availableVouchers.length > 0 ? (
                availableVouchers.map(v => (
                  <div key={v.id} className="bg-bg-surface border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-colors" />
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <div className="font-black text-yellow-400 text-lg tracking-wider font-heading">{v.code}</div>
                        <div className="text-sm font-bold text-white mt-1">
                          Diskon {v.discount_percent ? `${v.discount_percent}%` : `${v.discount_amount?.toLocaleString('id-ID')} Koin`}
                        </div>
                      </div>
                      <button 
                        onClick={() => selectVoucher(v.code)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-bg-base font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-lg shadow-yellow-500/20"
                      >
                        Pakai
                      </button>
                    </div>
                    {v.expires_at && (
                      <div className="text-xs text-text-muted mt-2 border-t border-border/50 pt-2 flex items-center gap-1 z-10">
                        <AlertCircle className="w-3 h-3" /> Berlaku s/d {new Date(v.expires_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted">
                  Belum ada voucher yang tersedia saat ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
