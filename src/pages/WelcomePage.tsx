import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';

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
          Selamat datang di portal anime Indonesia terlengkap. Streaming, baca, dan simpan favoritmu dalam satu tempat.
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
