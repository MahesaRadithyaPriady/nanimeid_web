import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { ToastMessage } from '../../stores/useAppStore';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { activeToasts, removeToast } = useAppStore();

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-[104px] left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-96 max-w-sm pointer-events-none">
      {activeToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  const titles = {
    success: 'Sukses',
    error: 'Gagal',
    info: 'Info'
  };

  const colors = {
    success: {
      border: 'border-green-500/30 dark:border-green-500/20',
      bg: 'bg-white dark:bg-bg-surface',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_15px_rgba(74,222,128,0.08)]',
      badge: 'bg-green-100 text-green-600 border-green-500/30 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30 dark:shadow-[0_0_12px_rgba(74,222,128,0.2)]',
      titleText: 'text-green-600 dark:text-green-400',
      progressBar: 'bg-green-500 dark:bg-green-400'
    },
    error: {
      border: 'border-red-500/30 dark:border-red-500/20',
      bg: 'bg-white dark:bg-bg-surface',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_15px_rgba(248,113,113,0.08)]',
      badge: 'bg-red-100 text-red-600 border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30 dark:shadow-[0_0_12px_rgba(248,113,113,0.2)]',
      titleText: 'text-red-600 dark:text-red-400',
      progressBar: 'bg-red-500 dark:bg-red-400'
    },
    info: {
      border: 'border-primary/30 dark:border-primary/20',
      bg: 'bg-white dark:bg-bg-surface',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_15px_rgba(255,102,205,0.08)]',
      badge: 'bg-pink-50 text-primary border-primary/30 dark:bg-primary/15 dark:border-primary/30 dark:shadow-[0_0_12px_rgba(255,102,205,0.2)]',
      titleText: 'text-primary',
      progressBar: 'bg-primary'
    }
  };

  const currentStyle = colors[toast.type];

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-center justify-between p-4 ${currentStyle.bg} backdrop-blur-xl border ${currentStyle.border} rounded-2xl ${currentStyle.glow} animate-toast-in transition-all duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className={`flex items-center justify-center p-2 rounded-xl shrink-0 border ${currentStyle.badge}`}>
          {icons[toast.type]}
        </div>
        <div className="flex flex-col min-w-0 pl-0.5 pt-0.5">
          <span className={`text-[10px] font-black tracking-wider uppercase font-heading ${currentStyle.titleText}`}>
            {titles[toast.type]}
          </span>
          <p className="text-xs sm:text-sm font-sans font-semibold text-text-primary/95 mt-0.5 leading-relaxed break-words whitespace-normal">
            {toast.message}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-3 p-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-xl text-muted hover:text-text-primary transition-all focus:outline-none active:scale-90 shrink-0 self-start"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Disappearing Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5">
        <div className={`h-full ${currentStyle.progressBar} animate-toast-progress`} />
      </div>
    </div>
  );
};

export default ToastContainer;
