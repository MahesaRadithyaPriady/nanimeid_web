import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Play, Star, Sparkles, Shield, Zap, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { UserProfile } from '../stores/useAppStore';
import { verifyGoogleToken, decodeJwtPayload } from '../lib/api';

/* ─── Google Icon SVG ─────────────────────────────────────────────── */
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── Floating anime tag decorations ─────────────────────────────── */
const FloatingTag: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <div className={`absolute hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated/80 border border-border/60 backdrop-blur-md text-[11px] font-mono font-semibold text-muted whitespace-nowrap select-none pointer-events-none ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
    {label}
  </div>
);

/* ─── Feature item ────────────────────────────────────────────────── */
const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="text-left">
      <p className="text-sm font-semibold text-text-primary leading-tight">{title}</p>
      <p className="text-xs text-muted mt-0.5 leading-snug">{desc}</p>
    </div>
  </div>
);

/* ─── Shared button UI ────────────────────────────────────────────── */
const LoginButtonShell: React.FC<{
  isLoading: boolean;
  label: string;
  onClick: () => void;
}> = ({ isLoading, label, onClick }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-bg-elevated hover:bg-bg-surface border border-border/80 hover:border-primary/40 text-text-primary font-semibold text-sm transition-all duration-200 hover:shadow-[0_4px_24px_rgba(255,102,205,0.15)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 group relative overflow-hidden"
  >
    <div className="absolute inset-0 pointer-events-none" />
    {isLoading ? (
      <>
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        <span>Menghubungkan...</span>
      </>
    ) : (
      <>
        <GoogleIcon className="w-5 h-5 shrink-0" />
        <span>{label}</span>
      </>
    )}
  </button>
);

/* ─── Real OAuth button — must live inside GoogleOAuthProvider ──── */
const GoogleOAuthButton: React.FC<{
  isLoading: boolean;
  onStart: () => void;
  onDone: (token: string, profile: Partial<UserProfile>) => void;
  onFail: (msg: string) => void;
}> = ({ isLoading, onStart, onDone, onFail }) => {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-6 space-y-3 bg-bg-base/40 border border-border/40 rounded-xl animate-pulse">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted font-medium">Menghubungkan ke Google...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center [&_iframe]:!rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_24px_rgba(255,102,205,0.12)] rounded-xl overflow-hidden">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            onStart();
            const idToken = credentialResponse.credential;
            if (!idToken) throw new Error('Google did not return an id_token.');

            const data = await verifyGoogleToken({ id_token: idToken });

            const jwt = data.token ?? data.access_token;
            if (!jwt) throw new Error('Server did not return a token.');

            const claims = decodeJwtPayload(jwt);
            const serverUser = data.user ?? {};
            const profile: Partial<UserProfile> = {
              name:      serverUser.name      ?? (claims.name      as string) ?? '',
              email:     serverUser.email     ?? (claims.email     as string) ?? '',
              avatarUrl: serverUser.avatar    ??
                         serverUser.avatar_url??
                         serverUser.picture   ??
                         (claims.picture      as string) ?? '',
            };

            onDone(jwt, profile);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Login gagal.';
            onFail(msg);
          }
        }}
        onError={() => {
          onFail('Login Google gagal. Pastikan popup tidak diblokir browser kamu.');
        }}
        theme="filled_black"
        shape="rectangular"
        size="large"
        text="continue_with"
        width="336"
      />
    </div>
  );
};

/* ─── Flag: real client ID present in env? ───────────────────────── */
const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ═══════════════════════════════════════════════════════════════════ */
/* LOGIN PAGE                                                          */
/* ═══════════════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setAuthToken } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleDone = (token: string, profile: Partial<UserProfile>) => {
    setAuthToken(token);
    login(profile);
    navigate(from, { replace: true });
  };

  const handleFail = (msg: string) => {
    setError(msg);
    setIsLoading(false);
  };

  /* Demo login when no real client ID is configured */
  const handleDemoLogin = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      handleDone('demo-token', { name: 'Demo User', email: 'demo@nanime.id', avatarUrl: '' });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col lg:flex-row overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Brand visual (desktop only)                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative flex-1 bg-bg-base overflow-hidden items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.05] blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,102,205,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,102,205,0.4) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

        <FloatingTag label="Action"   className="top-[15%] left-[8%] opacity-70 rotate-[-6deg]" />
        <FloatingTag label="Romance"  className="top-[22%] right-[12%] opacity-60 rotate-[4deg]" />
        <FloatingTag label="Fantasy"  className="top-[55%] left-[6%] opacity-50 rotate-[3deg]" />
        <FloatingTag label="Isekai"   className="bottom-[22%] right-[10%] opacity-65 rotate-[-3deg]" />
        <FloatingTag label="Shounen"  className="bottom-[38%] left-[5%] opacity-45 rotate-[5deg]" />
        <FloatingTag label="Mystery"  className="top-[38%] right-[7%] opacity-55 rotate-[-5deg]" />

        <div className="relative z-10 flex flex-col items-center px-16 text-center select-none">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/ border border-primary/30 flex items-center justify-center shadow-glow">
              <img src="/logo.png" alt="NanimeID" className="w-12 h-12 object-contain" />
            </div>
            <div className="absolute inset-[-6px] rounded-[22px] border border-primary/20 animate-pulse" />
          </div>

          <h1 className="font-heading font-black text-4xl xl:text-5xl tracking-tight mb-4">
            <span className="text-text-primary">NANIME</span>
            <span className="text-primary drop-shadow-[0_0_20px_rgba(255,102,205,0.6)]">ID</span>
          </h1>
          <p className="text-text-secondary text-base xl:text-lg max-w-xs leading-relaxed mb-12">
            Portal anime & manga Indonesia terlengkap. Streaming, baca, dan simpan favoritmu.
          </p>

          <div className="w-full max-w-[320px] space-y-5">
            <FeatureItem icon={<Play className="w-4.5 h-4.5 text-primary fill-primary" />} title="Streaming Gratis" desc="Ribuan episode anime subtitle Indonesia tanpa biaya" />
            <FeatureItem icon={<Star className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400" />} title="Koleksi Terkurasi" desc="Rating dan rekomendasi dari komunitas anime Indonesia" />
            <FeatureItem icon={<Sparkles className="w-4.5 h-4.5 text-primary" />} title="Update Mingguan" desc="Episode & chapter terbaru setiap minggu tepat waktu" />
          </div>

          <div className="mt-12 flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated/60 border border-border/50 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['#FF6B9D', '#A78BFA', '#34D399', '#FBBF24'].map((color, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-base" style={{ backgroundColor: color, opacity: 0.85 }} />
              ))}
            </div>
            <span className="text-xs text-text-secondary font-medium">
              <span className="text-text-primary font-bold">50K+</span> penonton aktif
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Login form                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 lg:max-w-[520px] xl:max-w-[560px] items-center justify-center px-6 sm:px-10 py-12 relative bg-bg-base">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-primary/[0.05] blur-[80px] pointer-events-none lg:hidden" />

        <div className="relative z-10 w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="w-16 h-16 rounded-2xl bg-primary/ border border-primary/30 flex items-center justify-center shadow-glow mb-4">
              <img src="/logo.png" alt="NanimeID" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-heading font-black text-3xl tracking-tight">
              <span className="text-text-primary">NANIME</span><span className="text-primary">ID</span>
            </span>
            <p className="text-muted text-xs mt-1.5 text-center">Portal anime Indonesia</p>
          </div>

          {/* Heading */}
          <div className="mb-8 text-left">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary tracking-tight leading-tight mb-2">
              Selamat Datang
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Masuk untuk menyimpan tontonan, melacak riwayat, dan menikmati pengalaman personal.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-bg-surface border border-border/60 rounded-2xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

            {/* Demo mode notice */}
            {!hasClientId && (
              <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-yellow-500/[0.08] border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-300/80 leading-relaxed">
                  <span className="font-semibold text-yellow-300">Mode Demo</span> — Tambahkan{' '}
                  <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>{' '}
                  di <code className="font-mono bg-yellow-500/10 px-1 rounded">.env.local</code> untuk Google OAuth nyata.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] font-semibold text-muted uppercase tracking-widest whitespace-nowrap">Masuk dengan</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
              </div>
            )}

            {/*
              When VITE_GOOGLE_CLIENT_ID is set  → render GoogleOAuthButton (uses useGoogleLogin hook inside GoogleOAuthProvider)
              When not set                        → render a plain demo button (no hook needed)
            */}
            {hasClientId ? (
              <GoogleOAuthButton
                isLoading={isLoading}
                onStart={() => { setIsLoading(true); setError(null); }}
                onDone={handleDone}
                onFail={handleFail}
              />
            ) : (
              <LoginButtonShell
                isLoading={isLoading}
                label="Lanjutkan dengan Google (Demo)"
                onClick={handleDemoLogin}
              />
            )}

            <p className="mt-5 text-center text-[11px] text-muted/70 leading-relaxed">
              Dengan masuk, kamu setuju dengan{' '}
              <span className="text-primary/80 hover:text-primary cursor-pointer transition-colors">Syarat Layanan</span>{' '}
              dan{' '}
              <span className="text-primary/80 hover:text-primary cursor-pointer transition-colors">Kebijakan Privasi</span>{' '}
              NanimeID.
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted/60">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Login aman menggunakan akun Google kamu</span>
          </div>

          {/* Feature chips (mobile only) */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
            {['Streaming Gratis', 'Update Mingguan', 'Tanpa Iklan Berlebih'].map((f) => (
              <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface border border-border/50 text-[11px] text-muted font-medium">
                <Zap className="w-3 h-3 text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {/* Guest link */}
          <div className="mt-8 text-center">
            <span className="text-xs text-muted/70">Mau lihat-lihat dulu? </span>
            <Link to="/" className="text-xs font-semibold text-primary hover:text-primary-light transition-colors underline underline-offset-2">
              Jelajahi sebagai tamu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
