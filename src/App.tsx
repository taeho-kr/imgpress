import { useState } from 'react';
import DropZone from './components/DropZone';
import OptionsPanel from './components/OptionsPanel';
import ImageCard from './components/ImageCard';
import CompareModal from './components/CompareModal';
import LocaleSwitcher from './components/LocaleSwitcher';
import { useI18n } from './i18n/useI18n';
import { useImageStore } from './hooks/useImageStore';
import {
  type ProcessOptions,
  type ProcessedImage,
  formatBytes,
  compressionRatio,
  getOutputFilename,
} from './utils/imageProcessor';

const DEFAULT_OPTIONS: ProcessOptions = {
  quality: 0.8,
  format: 'image/webp',
};

export default function App() {
  const { t } = useI18n();
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const { images, isProcessing, addFiles, processAll, removeImage, clearAll } = useImageStore();

  const done = images.filter((i) => i.status === 'done' && i.processedBlob);
  const totalOrig = done.reduce((s, i) => s + i.originalFile.size, 0);
  const totalProc = done.reduce((s, i) => s + (i.processedBlob?.size ?? 0), 0);
  const saved = totalOrig - totalProc;
  const ratio = totalOrig > 0 ? compressionRatio(totalOrig, totalProc) : 0;
  const hasImages = images.length > 0;
  const [compareImg, setCompareImg] = useState<ProcessedImage | null>(null);

  const downloadAll = () => {
    done.forEach((img) => {
      if (!img.processedBlob) return;
      const url = URL.createObjectURL(img.processedBlob);
      Object.assign(document.createElement('a'), {
        href: url,
        download: getOutputFilename(img.originalFile.name, options.format),
      }).click();
      URL.revokeObjectURL(url);
    });
  };

  const FEATURES = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: t.featurePrivacyTitle,
      desc: t.featurePrivacyDesc,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      title: t.featureSpeedTitle,
      desc: t.featureSpeedDesc,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="m8 21 4-4 4 4" />
        </svg>
      ),
      title: t.featureBatchTitle,
      desc: t.featureBatchDesc,
    },
  ];

  const TRUST = [t.trustFree, t.trustOffline, t.trustNoInstall, t.trustNoAds];

  return (
    <>
      <div className="scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-accent" />
      </div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Nav */}
        <nav className="glass-0" style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(232,160,48,0.35)', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080b12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.025em', color: 'rgba(230,235,245,0.95)' }}>
                {t.navTitle}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }} className="hidden sm:flex">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t.navPrivacy}
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, width: '100%', maxWidth: 1152, margin: '0 auto', padding: `${hasImages ? 32 : 88}px 24px 80px`, transition: 'padding-top 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>

          {/* Hero */}
          {!hasImages && (
            <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
              <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 28, padding: '6px 14px', borderRadius: 100, background: 'rgba(232,160,48,0.08)', border: '1px solid rgba(232,160,48,0.22)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                {t.eyebrow}
              </div>

              <h1 className="gradient-text anim-fade-up anim-delay-1" style={{ fontSize: 'clamp(2.4rem, 5vw + 0.8rem, 4.5rem)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: 22 }}>
                {t.heroLine1}<br />
                <span style={{ color: 'var(--accent)', WebkitTextFillColor: 'var(--accent)' }}>{t.heroLine2}</span>{t.heroSuffix}
              </h1>

              <p className="anim-fade-up anim-delay-2" style={{ fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 420, margin: '0 auto 36px', letterSpacing: '-0.005em' }}>
                {t.heroSub1}<br />{t.heroSub2}
              </p>

              <div className="privacy-terminal anim-fade-up anim-delay-3">
                <div className="privacy-terminal-header">
                  <span className="terminal-dot" style={{ background: '#ff5f57' }} />
                  <span className="terminal-dot" style={{ background: '#ffbd2e' }} />
                  <span className="terminal-dot" style={{ background: '#28ca41' }} />
                  <span className="terminal-title">network_monitor.sh</span>
                </div>
                <div className="privacy-terminal-body">
                  <div className="terminal-line">
                    <span className="t-prompt">$</span>
                    <span className="t-cmd"> scanning outbound requests...</span>
                  </div>
                  <div className="terminal-line terminal-result">
                    <span className="t-check">✓</span>
                    <span className="t-key"> uploads_to_server</span>
                    <span className="t-sep">  →  </span>
                    <span className="t-val-zero">0 bytes</span>
                  </div>
                  <div className="terminal-line terminal-result">
                    <span className="t-check">✓</span>
                    <span className="t-key"> files_transmitted</span>
                    <span className="t-sep">  →  </span>
                    <span className="t-val-zero">NONE</span>
                  </div>
                  <div className="terminal-line terminal-result">
                    <span className="t-check">✓</span>
                    <span className="t-key"> processing_location</span>
                    <span className="t-sep">  →  </span>
                    <span className="t-val-local">localhost (this device)</span>
                  </div>
                  <div className="terminal-line terminal-result">
                    <span className="t-check">✓</span>
                    <span className="t-key"> leakage_probability</span>
                    <span className="t-sep">  →  </span>
                    <span className="t-val-zero t-val-big">0.000%</span>
                  </div>
                  <div className="terminal-line terminal-status">
                    <span className="t-status-dot" />
                    <span className="t-status-text">privacy guaranteed — all processing runs in your browser via Canvas API</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workspace header */}
          {hasImages && (
            <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                  {images.length}{t.workspaceFiles}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.workspaceHint}</p>
              </div>

              {done.length > 0 && (
                <div className="anim-scale-in summary-bar" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="dot-live" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)' }}>
                      {done.length}{t.summaryDone}
                    </span>
                  </div>
                  <div className="stat-divider" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {formatBytes(totalOrig)} → {formatBytes(totalProc)}
                  </span>
                  <div className="stat-divider" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: ratio > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {ratio > 0 ? '-' : '+'}{Math.abs(ratio)}%
                  </span>
                  {saved > 0 && (
                    <>
                      <div className="stat-divider" />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(saved)} {t.summarySaved}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Drop zone */}
          <div className={hasImages ? '' : 'anim-fade-up anim-delay-3'}>
            <DropZone onFiles={addFiles} hasFiles={hasImages} />
          </div>

          {/* Workspace */}
          {hasImages && (
            <div className="workspace-grid" style={{ marginTop: 24, alignItems: 'start' }}>
              <div className="image-grid">
                {images.map((img, idx) => (
                  <div key={img.id} className="card-enter" style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}>
                    <ImageCard {...img} onRemove={removeImage} format={options.format} onCompare={() => img.status === 'done' && img.processedUrl && setCompareImg(img)} />
                  </div>
                ))}
              </div>
              <div className="sidebar-sticky">
                <OptionsPanel options={options} onChange={setOptions} onProcess={() => processAll(options)} onClear={clearAll} onDownloadAll={downloadAll} imageCount={images.length} doneCount={done.length} isProcessing={isProcessing} />
              </div>
            </div>
          )}

          {/* Features */}
          {!hasImages && (
            <div className="feature-grid anim-fade-up anim-delay-4" style={{ maxWidth: 720, margin: '72px auto 0' }}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} feature={f} delay={i} />
              ))}
            </div>
          )}

          {/* Trust */}
          {!hasImages && (
            <div className="trust-row anim-fade-up anim-delay-5" style={{ marginTop: 44 }}>
              {TRUST.map((label) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '-0.005em' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(232,160,48,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '18px 24px' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>{t.footer}</span>
            <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>Canvas API · No WASM · No Upload</span>
          </div>
        </footer>
      </div>

      {/* Compare modal */}
      {compareImg && compareImg.processedUrl && compareImg.processedBlob && (
        <CompareModal
          originalUrl={compareImg.originalUrl}
          processedUrl={compareImg.processedUrl}
          originalSize={compareImg.originalFile.size}
          processedSize={compareImg.processedBlob.size}
          originalWidth={compareImg.originalWidth}
          originalHeight={compareImg.originalHeight}
          processedWidth={compareImg.processedWidth}
          processedHeight={compareImg.processedHeight}
          fileName={compareImg.originalFile.name}
          onClose={() => setCompareImg(null)}
        />
      )}
    </>
  );
}

function FeatureCard({ feature, delay }: { feature: { icon: React.ReactNode; title: string; desc: string }; delay: number }) {
  return (
    <div
      className="glass-1 anim-fade-up"
      style={{ animationDelay: `${0.32 + delay * 0.08}s`, borderRadius: 'var(--r-xl)', padding: '26px 22px', transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)', cursor: 'default' }}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; el.style.borderColor = 'rgba(232,160,48,0.2)'; el.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.borderColor = 'var(--glass-1-border)'; el.style.background = 'var(--glass-1-bg)'; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(232,160,48,0.08)', border: '1px solid rgba(232,160,48,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 18 }}>
        {feature.icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.015em', marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.7, letterSpacing: '-0.005em' }}>{feature.desc}</p>
    </div>
  );
}
