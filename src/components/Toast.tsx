import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    if (toast.type === 'loading') return; // Do not auto-dismiss loading toasts
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/95 text-emerald-50 border-emerald-500/50 shadow-emerald-950/40',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />,
          badge: 'bg-emerald-800 text-emerald-200 border-emerald-600',
        };
      case 'error':
        return {
          bg: 'bg-red-950/95 text-red-50 border-red-500/50 shadow-red-950/40',
          icon: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
          badge: 'bg-red-900 text-red-200 border-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 text-amber-50 border-amber-500/50 shadow-amber-950/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          badge: 'bg-amber-900 text-amber-200 border-amber-700',
        };
      case 'loading':
        return {
          bg: 'bg-slate-900/95 text-slate-50 border-slate-600/50 shadow-slate-950/40',
          icon: <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0 mt-0.5" />,
          badge: 'bg-slate-800 text-slate-300 border-slate-600',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-950/95 text-blue-50 border-blue-500/50 shadow-blue-950/40',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
          badge: 'bg-blue-900 text-blue-200 border-blue-700',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto rounded-xl p-3.5 border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${style.bg}`}
    >
      {style.icon}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border tracking-wider ${style.badge}`}
          >
            HỆ THỐNG
          </span>
          <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
        </div>
        {toast.message && (
          <p className="text-[11px] opacity-90 leading-relaxed break-words whitespace-pre-wrap">
            {toast.message}
          </p>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
