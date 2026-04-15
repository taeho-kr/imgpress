import { useEffect, useState } from 'react';
import type { ProcessOptions } from '../utils/imageProcessor';
import { useI18n } from '../i18n/useI18n';
import { mimeShort, trackFormatSelected } from '../utils/analytics';
import { supportsAvifEncoding } from '../utils/avifSupport';

interface Props {
  options: ProcessOptions;
  onChange: (opts: ProcessOptions) => void;
  onProcess: () => void;
  onClear: () => void;
  onDownloadAll: () => void;
  imageCount: number;
  doneCount: number;
  isProcessing: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const FORMATS = [
  { value: 'image/webp' as const, label: 'WebP', hintKey: true },
  { value: 'image/jpeg' as const, label: 'JPEG', hintKey: false },
  { value: 'image/png' as const, label: 'PNG', hintKey: false },
];


export default function OptionsPanel({
  options, onChange, onProcess, onClear, onDownloadAll,
  imageCount, doneCount, isProcessing,
  selectedCount, onSelectAll, onDeselectAll,
}: Props) {
  const { t } = useI18n();
  const [avifSupported, setAvifSupported] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = <K extends keyof ProcessOptions>(k: K, v: ProcessOptions[K]) =>
    onChange({ ...options, [k]: v });

  useEffect(() => {
    let cancelled = false;
    supportsAvifEncoding().then((ok) => {
      if (!cancelled) setAvifSupported(ok);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-expand advanced section when AVIF is the active format so it's
  // visible (e.g., after restore from localStorage).
  useEffect(() => {
    if (options.format === 'image/avif') setAdvancedOpen(true);
  }, [options.format]);

  const isLossy = options.format !== 'image/png';

  const selectFormat = (value: ProcessOptions['format']) => {
    // PNG is lossless, so target-size mode can't honor a target — silently
    // downshift to quality mode when switching to PNG.
    const nextMode: ProcessOptions['mode'] =
      value === 'image/png' ? 'quality' : options.mode;
    onChange({ ...options, format: value, mode: nextMode });
    trackFormatSelected({ format: mimeShort(value), source: 'user' });
  };

  const setMode = (next: ProcessOptions['mode']) => {
    if (next === 'target_size' && !isLossy) return; // disabled for PNG
    set('mode', next);
  };

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
                onClick={() => selectFormat(value)}
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

        {/* Advanced — collapsible, currently houses AVIF only.
            Hidden entirely when the browser cannot encode AVIF. */}
        {avifSupported && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 2px',
                color: 'var(--text-muted)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span>{t.optAdvanced}</span>
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.18s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {advancedOpen && (
              <button
                onClick={() => selectFormat('image/avif')}
                style={{
                  marginTop: 6,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  border: 'none',
                  background: options.format === 'image/avif'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  color: options.format === 'image/avif'
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  boxShadow: options.format === 'image/avif'
                    ? '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>AVIF</span>
                <span style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: 4,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                }}>
                  {t.optFormatExperimental}
                </span>
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Quality / Target size — segmented mode switch */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
        }}>
          {/* Mode segment switch (replaces the static label) */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            <ModePill
              active={options.mode === 'quality'}
              onClick={() => setMode('quality')}
              label={t.optModeQuality}
            />
            <ModePill
              active={options.mode === 'target_size'}
              onClick={() => setMode('target_size')}
              label={t.optModeTargetSize}
              disabled={!isLossy}
              title={!isLossy ? t.optTargetSizeDisabledPng : undefined}
            />
          </div>

          {/* Right-side value badge */}
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
            whiteSpace: 'nowrap',
          }}>
            {options.mode === 'quality'
              ? `${qualityPct}%`
              : `~${formatTargetSize(options.targetSizeKB)}`}
          </span>
        </div>

        {options.mode === 'quality' ? (
          <>
            <div style={{ position: 'relative' }}>
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
          </>
        ) : (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
            }}>
              <input
                type="number"
                min={20}
                max={50000}
                step={50}
                value={options.targetSizeKB}
                onChange={(e) => {
                  const n = Math.max(20, Math.min(50000, Number(e.target.value) || 0));
                  set('targetSizeKB', n);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '8px 12px',
                  fontSize: 14,
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  width: '100%',
                }}
              />
              <span style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.03)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}>
                KB
              </span>
            </div>
            <div style={{
              marginTop: 6,
              fontSize: 10,
              color: 'var(--text-ghost)',
              letterSpacing: '0.02em',
            }}>
              {t.optTargetSizeHint}
            </div>
          </>
        )}
      </div>

      {/* Selection */}
      {imageCount > 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={selectedCount < imageCount ? onSelectAll : onDeselectAll}
            className="btn-ghost"
            style={{ flex: 1, fontSize: 10, padding: '6px 8px' }}
          >
            {selectedCount < imageCount ? t.selectAll : t.deselectAll}
            {selectedCount > 0 && ` (${selectedCount})`}
          </button>
        </div>
      )}

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
              {t.actCompressing} {doneCount}/{imageCount}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {t.actCompress} · {selectedCount > 0 ? selectedCount : imageCount}
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

/* ── Mode pill (segmented switch) ── */
function ModePill({ active, onClick, label, disabled, title }: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: disabled
          ? 'var(--text-ghost)'
          : active ? 'var(--text-primary)' : 'var(--text-muted)',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        boxShadow: active
          ? '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'none',
      }}
    >
      {label}
    </button>
  );
}

function formatTargetSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
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

