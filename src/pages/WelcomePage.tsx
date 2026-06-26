import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Shield, Zap, ArrowRight, Download } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center overflow-y-auto overflow-x-hidden w-full px-4 py-8 sm:py-12 relative">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-primary/[0.07] blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-primary/[0.05] blur-[70px] sm:blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,102,205,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,102,205,0.4) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

      <div className="relative z-10 w-full max-w-[420px] sm:max-w-[480px] flex flex-col items-center text-center">

        {/* Logo */}
        <div className="relative mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-glow">
            <img src="/logo.png" alt="NanimeID" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          </div>
          <div className="absolute inset-[-6px] rounded-[22px] border border-primary/20 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3 sm:mb-4">
          <span className="text-text-primary">NANIME</span>
          <span className="text-primary drop-shadow-[0_0_20px_rgba(255,102,205,0.6)]">ID</span>
        </h1>

        {/* Welcome message */}
        <p className="text-text-secondary text-sm sm:text-base lg:text-lg max-w-xs sm:max-w-sm leading-relaxed mb-8 sm:mb-10">
          Selamat datang di portal anime terlengkap. Streaming, baca, dan simpan favoritmu dalam satu tempat.
        </p>

        {/* Feature highlights */}
        <div className="w-full max-w-[340px] space-y-4 sm:space-y-5 mb-8 sm:mb-10">
          <div className="flex items-start gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Play className="w-4 h-4 text-primary fill-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">Streaming Gratis</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">Ribuan episode anime subtitle Indonesia</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">Update Mingguan</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">Episode terbaru tepat waktu setiap minggu</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">Aman & Personal</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">Simpan riwayat dan kelola favoritmu</p>
            </div>
          </div>
        </div>

        {/* Login button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-[340px] flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-sm sm:text-base transition-all duration-200 hover:shadow-[0_4px_24px_rgba(255,102,205,0.3)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/30 group"
        >
          <span>Masuk ke NanimeID</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Download App Buttons */}
        <div className="w-full max-w-[340px] mt-4 space-y-2.5">
          <p className="text-[11px] text-muted font-medium text-center">Unduh aplikasi mobile</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Play Store */}
            <a
              href="https://play.google.com/store/apps/details?id=com.nanimeid.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white/5 border border-border/50 hover:bg-white/10 hover:border-primary/30 text-text-primary font-bold text-xs sm:text-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.628L15.392 12l2.306-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
              </svg>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[9px] text-muted">GET IT ON</span>
                <span>Google Play</span>
              </div>
            </a>
            {/* APK Direct */}
            <a
              href="/nanimeid.apk"
              download
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white/5 border border-border/50 hover:bg-white/10 hover:border-primary/30 text-text-primary font-bold text-xs sm:text-sm transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 shrink-0 text-primary" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[9px] text-muted">UNDUH</span>
                <span>APK Langsung</span>
              </div>
            </a>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2">
          {['Streaming Gratis', 'Update Mingguan', 'Tanpa Iklan Berlebih'].map((f) => (
            <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface border border-border/50 text-[11px] text-muted font-medium">
              <Zap className="w-3 h-3 text-primary shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-[11px] text-muted/60">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Login aman menggunakan akun Google</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
