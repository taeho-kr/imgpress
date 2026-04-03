import type { ProcessOptions } from '../utils/imageProcessor';
import { useI18n } from '../i18n/useI18n';

interface Props {
  options: ProcessOptions;
  onChange: (opts: ProcessOptions) => void;
  onProcess: () => void;
  onClear: () => void;
  onDownloadAll: () => void;
  imageCount: number;
  doneCount: number;
  isProcessing: boolean;
}

const FORMATS = [
  { value: 'image/webp' as const, label: 'WebP', hintKey: true },
  { value: 'image/jpeg' as const, label: 'JPEG', hintKey: false },
  { value: 'image/png' as const, label: 'PNG', hintKey: false },
];


export default function OptionsPanel({
  options, onChange, onProcess, onClear, onDownloadAll,
  imageCount, doneCount, isProcessing,
}: Props) {
  const { t } = useI18n();
  const set = <K extends keyof ProcessOptions>(k: K, v: ProcessOptions[K]) =>
    onChange({ ...options, [k]: v });

  const qualityPct = Math.round(options.quality * 100);
  const trackFill = `${((options.quality - 0.1) / 0.9) * 100}%`;

  return (
    <div
      className="glass-2"
      style={{
        borderRadius: 'var(--r-xl)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      {/* Format */}
      <Section label={t.optFormat}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10,
          padding: 4,
        }}>
          {FORMATS.map(({ value, label, hintKey }) => {
            const hint = hintKey ? t.optFormatHint : null;
            const active = options.format === value;
            return (
              <button
                key={value}
                onClick={() => set('format', value)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: active
                    ? '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : 'none',
                }}
              >
                {label}
                {hint && (
                  <span style={{
                    display: 'block',
                    fontSize: 8,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    color: active ? 'var(--accent)' : 'var(--text-ghost)',
                    marginTop: 1,
                    transition: 'color 0.15s ease',
                  }}>
                    {hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Quality */}
      <Section
        label={t.optQuality}
        right={
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--accent)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            padding: '2px 8px',
            borderRadius: 6,
            letterSpacing: '-0.01em',
          }}>
            {qualityPct}%
          </span>
        }
      >
        <div style={{ position: 'relative' }}>
          {/* Visual fill track behind the range input */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            height: 3,
            width: trackFill,
            borderRadius: 2,
            background: 'linear-gradient(90deg, rgba(232,160,48,0.4), var(--accent))',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'width 0.1s ease',
          }} />
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={options.quality}
            onChange={(e) => set('quality', Number(e.target.value))}
            style={{ width: '100%', position: 'relative', zIndex: 2 }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          color: 'var(--text-ghost)',
          letterSpacing: '0.02em',
        }}>
          <span>{t.optQualityLow}</span>
          <span>{t.optQualityHigh}</span>
        </div>
      </Section>

      {/* Divider */}
      <div className="rule" />

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onProcess}
          disabled={imageCount === 0 || isProcessing}
          className="btn-primary"
          style={{ width: '100%', borderRadius: 'var(--r-lg)' }}
        >
          {isProcessing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" className="spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {t.actCompressing}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {t.actCompress} · {imageCount}
            </>
          )}
        </button>

        {doneCount > 0 && (
          <button
            onClick={onDownloadAll}
            className="btn-secondary"
            style={{ width: '100%', borderRadius: 'var(--r-lg)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.actDownloadAll} · {doneCount}
          </button>
        )}

        {imageCount > 0 && (
          <button
            onClick={onClear}
            className="btn-ghost"
            style={{ width: '100%', fontSize: 11 }}
          >
            {t.actClearAll}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  label, right, children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: 'var(--text-ghost)',
        }}>
          {label}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

