import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import { canInstall, promptInstall } from '../utils/pwa';

const DISMISS_KEY = 'imgpress-pwa-dismissed';

interface Props {
  /** Show only after user has completed at least one download. */
  triggerVisible: boolean;
}

/**
 * One-shot install banner per the planning team's UX decision:
 * - Never appears on landing
 * - Appears once after the user's first successful download
 * - Once dismissed, doesn't reappear in this browser
 * - Footer link remains as a persistent install entry point
 */
export default function PwaInstallBanner({ triggerVisible }: Props) {
  const { t } = useI18n();
  const [installable, setInstallable] = useState<boolean>(canInstall());
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ canInstall: boolean }>).detail;
      setInstallable(detail.canInstall);
    };
    window.addEventListener('imgpress:pwa-installable', handler);
    return () => window.removeEventListener('imgpress:pwa-installable', handler);
  }, []);

  if (!installable || !triggerVisible || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch { /* ignore */ }
  };

  const accept = async () => {
    const ok = await promptInstall('banner');
    if (ok) dismiss();
  };

  return (
    <div
      role="dialog"
      aria-label={t.pwaInstallTitle}
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 150,
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-2-border)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.4)',
        animation: 'toast-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'rgba(232,160,48,0.12)',
        border: '1px solid rgba(232,160,48,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {t.pwaInstallTitle}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t.pwaInstallDesc}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
        <button
          onClick={dismiss}
          className="btn-ghost"
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          {t.pwaInstallDismiss}
        </button>
        <button
          onClick={accept}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}
        >
          {t.pwaInstallButton}
        </button>
      </div>
    </div>
  );
}
