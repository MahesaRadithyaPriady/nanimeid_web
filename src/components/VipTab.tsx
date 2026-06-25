import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useConfirmStore } from '../stores/useConfirmStore';
import { Button } from './ui/Button';
import { Crown, AlertCircle, Clock, CheckCircle, ShieldOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { getVipMe, cancelVip, getVipHistory } from '../lib/vipApi';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ApiVipDetail, ApiVipHistory } from '../types';

export const VipTab: React.FC = () => {
  const { userProfile, addToast } = useAppStore();
  const confirm = useConfirmStore((s) => s.confirm);
  const navigate = useNavigate();
  const location = useLocation();
  const [vipDetail, setVipDetail] = useState<ApiVipDetail | null>(null);
  const [history, setHistory] = useState<ApiVipHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; planName: string }>({ show: false, planName: '' });

  useEffect(() => {
    loadVipData();
    const params = new URLSearchParams(location.search);
    if (params.get('success_vip') === 'true') {
      setSuccessModal({ show: true, planName: params.get('plan') || '' });
      // Remove query string to prevent re-trigger on refresh
      navigate('/profile?tab=vip', { replace: true });
    }
  }, [location.search, navigate]);

  const loadVipData = async () => {
    setLoading(true);
    try {
      const [vipRes, histRes] = await Promise.all([
        getVipMe().catch(() => null),
        getVipHistory(1, 10).catch(() => null)
      ]);
      if (vipRes && vipRes.vip) setVipDetail(vipRes.vip);
      if (histRes && histRes.data) setHistory(histRes.data.items);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCatalog = () => {
    navigate('/vip');
  };

  const handleCancelVip = async () => {
    if (!await confirm({
      title: 'Batalkan Langganan VIP',
      message: 'Yakin ingin membatalkan langganan VIP?',
      confirmText: 'Ya, Batalkan',
      variant: 'warning'
    })) return;
    setProcessing(true);
    try {
      const res = await cancelVip('Dibatalkan oleh user dari profil');
      setVipDetail(res.vip);
      addToast('success', 'Langganan VIP telah dibatalkan.');
      loadVipData();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membatalkan VIP.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 animate-pulse text-text-muted">Memuat status VIP...</div>;
  }

  // Utamakan state global userProfile sebagai sumber kebenaran (Source of Truth)
  // karena backend mock getVipMe() kadang me-return hardcode 'Gold'
  const isVipActive = userProfile?.isVip || (vipDetail && vipDetail.status === 'ACTIVE');
  const displayVipLevel = userProfile?.vipLevel || (vipDetail?.vip_level) || 'FREE';

  return (
    <div className="space-y-6 py-4">
      {/* VIP Status Card */}
      <div className={`p-6 rounded-2xl border ${isVipActive ? 'bg-yellow-500/ border-yellow-500/30' : 'bg-bg-elevated border-border/50'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isVipActive ? 'bg-yellow-500/20 text-yellow-500' : 'bg-bg-surface text-text-muted'}`}>
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading">{isVipActive && displayVipLevel !== 'FREE' ? `VIP ${displayVipLevel}` : 'Belum VIP'}</h3>
              <p className="text-sm text-text-secondary mt-1">
                {isVipActive && vipDetail?.end_at
                  ? `Berakhir pada: ${new Date(vipDetail.end_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}` 
                  : 'Dapatkan akses ke fitur premium, stiker, dan badge eksklusif.'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {isVipActive ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                <CheckCircle className="w-3 h-3" /> Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-text-muted/20 text-text-secondary text-xs font-bold rounded-full">
                <AlertCircle className="w-3 h-3" /> Inaktif
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button 
            variant="primary" 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2" 
            onClick={handleGoToCatalog}
            disabled={processing}
          >
            {isVipActive ? 'Perpanjang VIP' : 'Lihat Katalog VIP'} <ArrowRight className="w-4 h-4" />
          </Button>
          
          {isVipActive && (
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none border-red-500/30 text-red-400 opacity-50 cursor-not-allowed"
              onClick={() => addToast('info', 'Fitur pembatalan VIP sedang dinonaktifkan')}
              disabled={true}
              title="Sedang dinonaktifkan"
            >
              Batalkan VIP
            </Button>
          )}
        </div>
      </div>

      {/* VIP History */}
      <div>
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Riwayat Pembayaran VIP
        </h4>
        {history.length === 0 ? (
          <div className="p-8 border border-border/50 border-dashed rounded-2xl text-center text-text-muted text-sm">
            Belum ada riwayat VIP.
          </div>
        ) : (
          <div className="bg-bg-surface border border-border/50 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-elevated text-text-secondary">
                <tr>
                  <th className="p-4 font-semibold">Aksi</th>
                  <th className="p-4 font-semibold">Durasi</th>
                  <th className="p-4 font-semibold">Koin / Metode</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        item.action === 'ACTIVATE' ? 'bg-blue-500/20 text-blue-400' :
                        item.action === 'RENEW' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.action}
                      </span>
                      {item.notes && <div className="text-xs text-text-muted mt-1.5">{item.notes}</div>}
                    </td>
                    <td className="p-4">{item.duration_days} Hari</td>
                    <td className="p-4 font-mono text-yellow-400">{item.coins_spent ? `${item.coins_spent.toLocaleString('id-ID')} Koin` : item.payment_method}</td>
                    <td className="p-4 text-text-muted">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Modal Popup */}
      {successModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-bg-elevated border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-yellow-500/20 transform animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/40">
              <Crown className="w-10 h-10 text-white animate-bounce" />
            </div>
            <h2 className="text-2xl font-black font-heading mb-2 text-white">Selamat!</h2>
            <p className="text-text-secondary mb-8">
              Kamu sekarang resmi berlangganan <strong className="text-yellow-400">VIP {successModal.planName}</strong>. Nikmati semua fitur premiumnya!
            </p>
            <button
              onClick={() => setSuccessModal({ show: false, planName: '' })}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-bg-base font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-yellow-500/25"
            >
              Lanjut
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
