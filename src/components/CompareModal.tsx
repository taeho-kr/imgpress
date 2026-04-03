import { useState, useEffect } from 'react';
import { formatBytes, compressionRatio } from '../utils/imageProcessor';
import { useI18n } from '../i18n/useI18n';

interface Props {
  originalUrl: string;
  processedUrl: string;
  originalSize: number;
  processedSize: number;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  fileName: string;
  onClose: () => void;
}

export default function CompareModal({
  originalUrl, processedUrl,
  originalSize, processedSize,
  originalWidth, originalHeight,
  processedWidth, processedHeight,
  fileName, onClose,
}: Props) {
  const { t } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);
  const ratio = compressionRatio(originalSize, processedSize);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fade-in 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-2"
        style={{
          borderRadius: 'var(--r-2xl)',
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {fileName}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: ratio > 0 ? 'var(--success)' : 'var(--error)',
              background: ratio > 0 ? 'var(--success-dim)' : 'var(--error-dim)',
              padding: '2px 8px', borderRadius: 6,
            }}>
              {ratio > 0 ? '-' : '+'}{Math.abs(ratio)}%
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t.compareClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'var(--error-dim)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image area */}
        <div
          onClick={() => setShowOriginal(!showOriginal)}
          style={{
            position: 'relative',
            flex: 1,
            overflow: 'hidden',
            cursor: 'pointer',
            minHeight: 300,
            maxHeight: 'calc(90vh - 160px)',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <img
            src={showOriginal ? originalUrl : processedUrl}
            alt={showOriginal ? t.compareOriginal : t.compareCompressed}
            style={{
              display: 'block', width: '100%', height: '100%', objectFit: 'contain',
            }}
          />

          {/* Toggle indicator */}
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 4,
            padding: 4, borderRadius: 100,
            background: 'rgba(8,11,18,0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <TogglePill active={showOriginal} onClick={() => setShowOriginal(true)} label={t.compareOriginal} />
            <TogglePill active={!showOriginal} onClick={() => setShowOriginal(false)} label={t.compareCompressed} accent />
          </div>

          {/* Hint */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            padding: '5px 14px', borderRadius: 100,
            background: 'rgba(8,11,18,0.7)',
            backdropFilter: 'blur(6px)',
            fontSize: 12, color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}>
            {t.compareClickToToggle}
          </div>
        </div>

        {/* Footer stats */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
        }}>
          <Stat label={t.compareOriginal} value={formatBytes(originalSize)} sub={`${originalWidth}×${originalHeight}`} highlight={showOriginal} />
          <div style={{ color: 'var(--text-ghost)', fontSize: 18 }}>→</div>
          <Stat label={t.compareCompressed} value={formatBytes(processedSize)} sub={`${processedWidth}×${processedHeight}`} accent highlight={!showOriginal} />
          <Stat label={t.compareSaved} value={formatBytes(originalSize - processedSize)} sub={`${Math.abs(ratio)}% ${t.compareReduction}`} accent />
        </div>
      </div>
    </div>
  );
}

function TogglePill({ active, onClick, label, accent }: { active: boolean; onClick: () => void; label: string; accent?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: '6px 16px', borderRadius: 100,
        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: active ? (accent ? 'var(--success)' : 'rgba(255,255,255,0.15)') : 'transparent',
        color: active ? (accent ? '#030b06' : 'var(--text-primary)') : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, sub, accent, highlight }: { label: string; value: string; sub: string; accent?: boolean; highlight?: boolean }) {
  return (
    <div style={{
      textAlign: 'center',
      opacity: highlight === undefined ? 1 : highlight ? 1 : 0.5,
      transition: 'opacity 0.2s ease',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-ghost)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: accent ? 'var(--success)' : 'var(--text-secondary)',
      }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}
