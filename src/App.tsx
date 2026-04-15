import { useState, useEffect, useCallback } from 'react';
import DropZone from './components/DropZone';
import OptionsPanel from './components/OptionsPanel';
import ImageCard from './components/ImageCard';
import CompareModal from './components/CompareModal';
import PrivacyModal from './components/PrivacyModal';
import LocaleSwitcher from './components/LocaleSwitcher';
import CompressionShowcase from './components/CompressionShowcase';
import ToastHost from './components/Toast';
import { useI18n } from './i18n/useI18n';
import { useImageStore } from './hooks/useImageStore';
import {
  type ProcessOptions,
  type ProcessedImage,
  formatBytes,
  compressionRatio,
  getOutputFilename,
} from './utils/imageProcessor';

const STORAGE_KEY = 'imgpress-options';

function loadOptions(): ProcessOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.quality && parsed.format) return parsed;
    }
  } catch { /* ignore */ }
  return { quality: 0.8, format: 'image/webp' };
}

export default function App() {
  const { t } = useI18n();
  const [options, setOptions] = useState<ProcessOptions>(loadOptions);
  const {
    images, isProcessing, selected,
    addFiles, processAll, retryImage, removeImage, clearAll,
    toggleSelect, selectAll, deselectAll,
  } = useImageStore();
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Persist options to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files, 'paste');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const done = images.filter((i) => i.status === 'done' && i.processedBlob);
  const totalOrig = done.reduce((s, i) => s + i.originalFile.size, 0);
  const totalProc = done.reduce((s, i) => s + (i.processedBlob?.size ?? 0), 0);
  const saved = totalOrig - totalProc;
  const ratio = totalOrig > 0 ? compressionRatio(totalOrig, totalProc) : 0;
  const hasImages = images.length > 0;
  const [compareImg, setCompareImg] = useState<ProcessedImage | null>(null);

  const downloadAll = useCallback(async () => {
    if (done.length === 1) {
      // Single file: direct download
      const img = done[0];
      if (!img.processedBlob) return;
      const url = URL.createObjectURL(img.processedBlob);
      Object.assign(document.createElement('a'), {
        href: url,
        download: getOutputFilename(img.originalFile.name, options.format),
      }).click();
      URL.revokeObjectURL(url);
      return;
    }
    // Multiple files: ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    done.forEach((img) => {
      if (!img.processedBlob) return;
      zip.file(getOutputFilename(img.originalFile.name, options.format), img.processedBlob);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
      href: url,
      download: 'imgpress-compressed.zip',
    }).click();
    URL.revokeObjectURL(url);
  }, [done, options.format]);

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

  const TRUST = [t.trustFree, t.trustOffline, t.trustNoInstall];

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

              <div className="privacy-guarantee anim-fade-up anim-delay-3">
                <div className="privacy-shield">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <div className="privacy-main">
                  <div className="privacy-zero">0%</div>
                  <div className="privacy-label">사진 유출 가능성</div>
                </div>
                <div className="privacy-divider" />
                <div className="privacy-desc-block">
                  <p className="privacy-claim">사진 파일이 이 기기를 벗어나지 않습니다</p>
                  <p className="privacy-sub-claim">서버 전송 없음 · 브라우저에서만 처리 · 오프라인 작동</p>
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

              {(done.length > 0 || isProcessing) && (
                <div className="anim-scale-in summary-bar" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className={isProcessing ? 'dot-processing' : 'dot-live'} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isProcessing ? 'var(--accent)' : 'var(--success)' }}>
                      {isProcessing
                        ? `${done.length}/${images.length}`
                        : `${done.length}${t.summaryDone}`
                      }
                    </span>
                  </div>
                  {done.length > 0 && (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Showcase — between Hero and DropZone */}
          {!hasImages && (
            <div className="anim-fade-up anim-delay-3" style={{ marginBottom: 48 }}>
              <CompressionShowcase
                onScrollToDropZone={() =>
                  document.getElementById('dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              />
            </div>
          )}

          {/* Drop zone */}
          <div id="dropzone" className={hasImages ? '' : 'anim-fade-up anim-delay-4'}>
            <DropZone onFiles={addFiles} hasFiles={hasImages} />
          </div>

          {/* Workspace */}
          {hasImages && (
            <div className="workspace-grid" style={{ marginTop: 24, alignItems: 'start' }}>
              <div className="image-grid">
                {images.map((img, idx) => (
                  <div key={img.id} className="card-enter" style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}>
                    <ImageCard
                      {...img}
                      onRemove={removeImage}
                      onRetry={() => retryImage(img.id, options)}
                      format={options.format}
                      onCompare={() => img.status === 'done' && img.processedUrl && setCompareImg(img)}
                      selected={selected.has(img.id)}
                      onToggleSelect={toggleSelect}
                    />
                  </div>
                ))}
              </div>
              <div className="sidebar-sticky">
                <OptionsPanel
                  options={options}
                  onChange={setOptions}
                  onProcess={() => processAll(options)}
                  onClear={clearAll}
                  onDownloadAll={downloadAll}
                  imageCount={images.length}
                  doneCount={done.length}
                  isProcessing={isProcessing}
                  selectedCount={selected.size}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                />
              </div>
            </div>
          )}

          {/* Features */}
          {!hasImages && (
            <div className="feature-grid anim-fade-up anim-delay-5" style={{ maxWidth: 720, margin: '72px auto 0' }}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} feature={f} delay={i} />
              ))}
            </div>
          )}

          {/* Trust */}
          {!hasImages && (
            <div className="trust-row anim-fade-up" style={{ marginTop: 44, animationDelay: '0.48s' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>Canvas API · No WASM · No Upload</span>
              <button
                onClick={() => setShowPrivacy(true)}
                style={{ fontSize: 11, color: 'var(--text-ghost)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-ghost)'; }}
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast host — fires from anywhere via showToast() */}
      <ToastHost />

      {/* Compare modal */}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

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
