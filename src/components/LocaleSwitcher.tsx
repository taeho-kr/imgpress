import { useState, useRef, useEffect } from 'react';
import { useI18n, LOCALES, type Locale } from '../i18n/useI18n';

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LOCALES[locale];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-muted)',
          fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="glass-2"
          style={{
            position: 'absolute', top: '100%', right: 0,
            marginTop: 6, borderRadius: 12,
            padding: 4, minWidth: 160,
            zIndex: 50,
            animation: 'scale-in 0.15s ease',
          }}
        >
          {(Object.entries(LOCALES) as [Locale, typeof current][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setLocale(key); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 12px',
                borderRadius: 8, border: 'none',
                background: key === locale ? 'rgba(232,160,48,0.1)' : 'transparent',
                color: key === locale ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: key === locale ? 600 : 400,
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (key !== locale) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (key !== locale) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{val.flag}</span>
              <span>{val.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
