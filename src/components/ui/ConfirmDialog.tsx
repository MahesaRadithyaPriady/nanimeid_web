import React, { useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useConfirmStore } from '../../stores/useConfirmStore';

export const ConfirmDialog: React.FC = () => {
  const { isOpen, options, close } = useConfirmStore();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const variant = options.variant ?? 'info';
  const icons = {
    danger: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    info: <Info className="w-6 h-6 text-primary" />,
  };

  const confirmBtnColors = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    info: 'bg-primary hover:bg-primary/90 text-black',
  };

  return (
    <div
      onClick={() => close(false)}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-bg-elevated border border-border/80 rounded-2xl shadow-glow-lg overflow-hidden animate-scale-up"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              {icons[variant]}
            </div>
            <div className="flex-1 min-w-0">
              {options.title && (
                <h3 className="text-base font-heading font-bold text-text-primary mb-1">
                  {options.title}
                </h3>
              )}
              <p className="text-sm font-sans text-text-primary/80 leading-relaxed">
                {options.message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 text-sm font-semibold text-text-primary/70 hover:text-text-primary bg-bg-surface hover:bg-bg-surface/80 border border-border/60 rounded-xl transition-all active:scale-95"
            >
              {options.cancelText ?? 'Batal'}
            </button>
            <button
              onClick={() => close(true)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${confirmBtnColors[variant]}`}
            >
              {options.confirmText ?? 'Ya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
