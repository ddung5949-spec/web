import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 2800
}

/**
 * Global helper functions to show toasts from anywhere without prop drilling
 */
export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  duration = 2800
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { type, title, message, duration },
      })
    );
  }
};

export const toast = {
  success: (title: string, message?: string, duration = 2800) =>
    showToast('success', title, message, duration),
  error: (title: string, message?: string, duration = 3200) =>
    showToast('error', title, message, duration),
  warning: (title: string, message?: string, duration = 3000) =>
    showToast('warning', title, message, duration),
  info: (title: string, message?: string, duration = 2800) =>
    showToast('info', title, message, duration),
  loading: (title: string, message?: string) =>
    showToast('loading', title, message, 0),
};

interface ToastContainerProps {
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts: externalToasts,
  onDismiss: externalOnDismiss,
}) => {
  const [internalToasts, setInternalToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: ToastType;
        title: string;
        message?: string;
        duration?: number;
      }>;
      if (!customEvent.detail) return;
      const { type, title, message, duration } = customEvent.detail;
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setInternalToasts((prev) => [
        ...prev,
        { id, type, title, message, duration: duration ?? 2800 },
      ]);
    };

    window.addEventListener('app:toast', handleCustomToast);
    return () => {
      window.removeEventListener('app:toast', handleCustomToast);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setInternalToasts((prev) => prev.filter((t) => t.id !== id));
    if (externalOnDismiss) {
      externalOnDismiss(id);
    }
  };

  // Merge external and internal toasts
  const allToasts = [...(externalToasts || []), ...internalToasts];

  if (allToasts.length === 0) return null;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-2 pointer-events-none"
    >
      {allToasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={handleDismiss} />
      ))}
    </aside>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast: item,
  onDismiss,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (item.type === 'loading') return;
    const duration = item.duration || 2800;
    const hideTimer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onDismiss(item.id), 250);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [item, onDismiss]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onDismiss(item.id), 200);
  };

  const getStyle = () => {
    switch (item.type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/95 text-white border-emerald-400/60 shadow-emerald-950/60 ring-1 ring-emerald-500/30',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />,
          badge: 'bg-emerald-800 text-emerald-100 border-emerald-500/50',
          badgeText: 'THÀNH CÔNG',
        };
      case 'error':
        return {
          bg: 'bg-red-950/95 text-white border-red-400/60 shadow-red-950/60 ring-1 ring-red-500/30',
          icon: <XCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />,
          badge: 'bg-red-900 text-red-100 border-red-500/50',
          badgeText: 'CẢNH BÁO LỖI',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 text-white border-amber-400/60 shadow-amber-950/60 ring-1 ring-amber-500/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />,
          badge: 'bg-amber-900 text-amber-100 border-amber-500/50',
          badgeText: 'LƯU Ý',
        };
      case 'loading':
        return {
          bg: 'bg-slate-900/95 text-white border-slate-500/60 shadow-slate-950/60 ring-1 ring-slate-400/30',
          icon: <Loader2 className="w-5 h-5 text-amber-300 animate-spin shrink-0 mt-0.5" />,
          badge: 'bg-slate-800 text-slate-200 border-slate-600',
          badgeText: 'ĐANG XỬ LÝ',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-950/95 text-white border-sky-400/60 shadow-sky-950/60 ring-1 ring-sky-500/30',
          icon: <Info className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />,
          badge: 'bg-sky-900 text-sky-100 border-sky-500/50',
          badgeText: 'THÔNG BÁO',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-xl p-3.5 border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 ${
        isClosing
          ? 'opacity-0 -translate-y-2 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-3 fade-in'
      } ${style.bg}`}
    >
      {style.icon}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border tracking-wider select-none ${style.badge}`}
          >
            {style.badgeText}
          </span>
          <h4 className="text-xs sm:text-sm font-bold leading-snug">{item.title}</h4>
        </div>
        {item.message && (
          <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed break-words whitespace-pre-wrap mt-0.5">
            {item.message}
          </p>
        )}
      </div>
      {item.type !== 'loading' && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông báo"
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

