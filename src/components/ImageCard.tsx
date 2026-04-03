import { formatBytes, compressionRatio, getOutputFilename } from '../utils/imageProcessor';
import { useI18n } from '../i18n/useI18n';

interface Props {
  id: string;
  originalFile: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedWidth: number;
  processedHeight: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  onRemove: (id: string) => void;
  onCompare?: () => void;
  format: string;
}

export default function ImageCard({
  id, originalFile, originalUrl,
  originalWidth, originalHeight,
  processedBlob, processedUrl,
  processedWidth, processedHeight,
  status, error, onRemove, onCompare, format,
}: Props) {
  const { t } = useI18n();
  const ratio = processedBlob ? compressionRatio(originalFile.size, processedBlob.size) : 0;
  const grew = ratio < 0;

  const download = () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getOutputFilename(originalFile.name, format);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="glass-1 img-card"
      style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}
    >
      {/* Preview */}
      <div
        onClick={() => status === 'done' && onCompare?.()}
        style={{
          position: 'relative',
          aspectRatio: '4/3',
          background: 'rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: status === 'done' ? 'zoom-in' : 'default',
        }}>
        <img
          src={processedUrl || originalUrl}
          alt={originalFile.name}
          loading="lazy"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            opacity: status === 'processing' ? 0.35 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Processing overlay */}
        {status === 'processing' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(8,11,18,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="2" className="spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{t.cardProcessing}</span>
          </div>
        )}

        {/* Pending shimmer */}
        {status === 'pending' && (
          <div className="shimmer" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(240,91,91,0.1)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
          }}>
            <span style={{ fontSize: 11, color: 'var(--error)', textAlign: 'center', lineHeight: 1.5 }}>
              {error || t.cardFailed}
            </span>
          </div>
        )}

        {/* Compression badge */}
        {status === 'done' && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '3px 8px', borderRadius: 6,
            fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
            letterSpacing: '-0.01em',
            background: grew ? 'rgba(240,91,91,0.9)' : 'rgba(52,201,138,0.9)',
            color: grew ? '#fff' : '#030b06',
            backdropFilter: 'blur(4px)',
            boxShadow: grew
              ? '0 2px 8px rgba(240,91,91,0.4)'
              : '0 2px 8px rgba(52,201,138,0.35)',
          }}>
            {grew ? '+' : '-'}{Math.abs(ratio)}%
          </div>
        )}

        {/* Remove button — revealed on card hover via CSS */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          aria-label="이미지 삭제"
          className="card-remove-btn"
          style={{
            position: 'absolute', top: 10, left: 10,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(8,11,18,0.72)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', opacity: 0,
            transition: 'opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(240,91,91,0.85)';
            el.style.borderColor = 'rgba(240,91,91,0.4)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(8,11,18,0.72)';
            el.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Meta */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{
          fontSize: 11, fontWeight: 500,
          color: 'var(--text-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 10, letterSpacing: '-0.005em',
        }} title={originalFile.name}>
          {originalFile.name}
        </p>

        {/* Size comparison */}
        <div style={{ display: 'flex', gap: 6 }}>
          <StatBox label={t.cardOriginal} accent={false}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatBytes(originalFile.size)}
            </span>
            {originalWidth > 0 && (
              <span style={{ display: 'block', fontSize: 9, color: 'var(--text-ghost)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {originalWidth}×{originalHeight}
              </span>
            )}
          </StatBox>

          <StatBox label={t.cardCompressed} accent={!!processedBlob}>
            {processedBlob ? (
              <>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBytes(processedBlob.size)}
                </span>
                <span style={{ display: 'block', fontSize: 9, color: 'rgba(52,201,138,0.5)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {processedWidth}×{processedHeight}
                </span>
              </>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-ghost)' }}>—</span>
            )}
          </StatBox>
        </div>

        {/* Download */}
        {status === 'done' && processedBlob && (
          <button
            onClick={download}
            style={{
              marginTop: 10, width: '100%',
              padding: '9px 0', borderRadius: 8,
              fontSize: 11, fontWeight: 600, letterSpacing: '-0.01em',
              color: 'var(--text-tertiary)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--accent)';
              el.style.background = 'rgba(232,160,48,0.07)';
              el.style.borderColor = 'rgba(232,160,48,0.22)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--text-tertiary)';
              el.style.background = 'rgba(255,255,255,0.04)';
              el.style.borderColor = 'rgba(255,255,255,0.07)';
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.actDownload}
          </button>
        )}
      </div>

      {/* Hover-reveal remove button */}
      <style>{`.img-card:hover .card-remove-btn { opacity: 1 !important; }`}</style>
    </div>
  );
}

function StatBox({
  label, accent, children,
}: {
  label: string;
  accent: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      flex: 1,
      background: accent ? 'var(--success-dim)' : 'rgba(255,255,255,0.03)',
      border: accent ? '1px solid rgba(52,201,138,0.18)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '8px 10px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 600,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: accent ? 'rgba(52,201,138,0.6)' : 'var(--text-ghost)',
        marginBottom: 4, transition: 'color 0.3s ease',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
