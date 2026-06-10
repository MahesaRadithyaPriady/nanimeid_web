import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { ToastMessage } from '../../stores/useAppStore';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { activeToasts, removeToast } = useAppStore();

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-4 right-4 sm:top-auto sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2.5 max-w-sm mx-auto sm:mx-0 pointer-events-none">
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
    success: <CheckCircle className="w-5 h-5 text-green-400 shrink-0 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0 drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]" />,
    info: <AlertCircle className="w-5 h-5 text-primary shrink-0 drop-shadow-[0_0_6px_rgba(255,102,205,0.4)]" />
  };

  const borders = {
    success: 'border-l-[4px] border-l-green-400 shadow-[inset_4px_0_0_0_rgba(74,222,128,0.1)]',
    error: 'border-l-[4px] border-l-red-400 shadow-[inset_4px_0_0_0_rgba(248,113,113,0.1)]',
    info: 'border-l-[4px] border-l-primary shadow-[inset_4px_0_0_0_rgba(255,102,205,0.1)]'
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 bg-bg-sidebar/95 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-toast-in ${borders[toast.type]}`}
      role="alert"
    >
      <div className="flex items-center gap-3 min-w-0">
        {icons[toast.type]}
        <p className="text-xs sm:text-sm font-sans font-semibold text-text-primary leading-snug truncate sm:whitespace-normal">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-3 p-1 hover:bg-white/[0.06] rounded-lg text-muted hover:text-text-primary transition-all focus:outline-none active:scale-90 shrink-0"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
