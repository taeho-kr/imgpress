import { useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
}

interface ToastDetail {
  message: string;
  kind?: 'info' | 'success' | 'error';
  duration?: number;
}

const TOAST_EVENT = 'imgpress:toast';

/**
 * Fire a toast from anywhere without threading props. Kept window-scoped to
 * avoid a context provider for something this simple.
 */
export function showToast(detail: ToastDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}

let nextId = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      const id = nextId++;
      const kind = detail.kind ?? 'info';
      const duration = detail.duration ?? 2800;
      setToasts((prev) => [...prev, { id, message: detail.message, kind }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-2"
          style={{
            background: 'var(--bg-surface)',
            padding: '10px 18px',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 500,
            color:
              t.kind === 'error'
                ? 'var(--error)'
                : t.kind === 'success'
                  ? 'var(--success)'
                  : 'var(--text-primary)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'toast-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'auto',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
