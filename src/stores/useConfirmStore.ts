import { create } from 'zustand';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: { message: '' },
  resolve: null,
  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },
  close: (result) => {
    const { resolve } = get();
    resolve?.(result);
    set({ isOpen: false, resolve: null });
  },
}));
