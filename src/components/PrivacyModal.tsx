import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function PrivacyModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(4,7,14,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-2"
        style={{
          borderRadius: 'var(--r-2xl)',
          maxWidth: 640, width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(52,201,138,0.1)',
              border: '1px solid rgba(52,201,138,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--success)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Privacy Policy
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px 28px', overflowY: 'auto', lineHeight: 1.75 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Last updated: April 4, 2026
          </p>

          <Section title="Summary">
            <p>ImgPress processes all images <strong style={{ color: 'var(--success)' }}>locally in your browser</strong>. No images, files, or personal data are ever sent to any server. Your photos never leave your device.</p>
          </Section>

          <Section title="Data We Collect">
            <p>We collect <strong>no personal data</strong>. ImgPress does not use accounts, cookies, or tracking beyond anonymous analytics (page views only) to measure overall traffic.</p>
          </Section>

          <Section title="Image Processing">
            <p>All image compression and conversion is performed using your browser's built-in Canvas API and Web Workers. Files are processed entirely on your device. No image data is transmitted over the network at any point.</p>
          </Section>

          <Section title="Analytics">
            <p>We may use anonymous analytics tools (e.g. Google Analytics) to collect aggregated, non-personal data such as page views and country of origin. No personally identifiable information is collected.</p>
          </Section>

          <Section title="Advertising">
            <p>ImgPress may display third-party advertisements. Ad networks may use cookies or similar technologies in accordance with their own privacy policies. We recommend reviewing the privacy policies of any third-party ad providers.</p>
          </Section>

          <Section title="Contact">
            <p>For privacy-related questions, contact us at <span style={{ color: 'var(--accent)' }}>imgpress@taeho.world</span></p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
        {title}
      </h3>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}
