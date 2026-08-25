import React from 'react';
import { AlertCircle, WifiOff, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

export interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

interface ErrorToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all animate-bounce-subtle ${
              isError
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-[0_10px_25px_rgba(244,63,94,0.25)]'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900/90 border-sky-500/50 text-sky-100 shadow-xl'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isError ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-sky-400" />
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs leading-relaxed opacity-95">{toast.message}</p>

              {toast.actionText && toast.onAction && (
                <button
                  onClick={() => {
                    sounds.playButton();
                    toast.onAction!();
                    onDismiss(toast.id);
                  }}
                  className="mt-2 text-xs font-bold underline flex items-center gap-1 hover:opacity-80"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{toast.actionText}</span>
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => {
                sounds.playButton();
                onDismiss(toast.id);
              }}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
