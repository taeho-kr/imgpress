import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/useI18n';

interface CardData {
  label: string;
  originalSize: string;
  compressedSize: string;
  reduction: number;
  beforeImg: string;
  afterImg: string;
}

export default function CompressionShowcase({ onScrollToDropZone }: { onScrollToDropZone: () => void }) {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cards: CardData[] = [
    {
      label: t.showcaseCard1,
      originalSize: '4.2 MB',
      compressedSize: '310 KB',
      reduction: 93,
      beforeImg: '/demo/card-1-before.jpg',
      afterImg: '/demo/card-1-after.webp',
    },
    {
      label: t.showcaseCard2,
      originalSize: '1.8 MB',
      compressedSize: '124 KB',
      reduction: 93,
      beforeImg: '/demo/card-2-before.jpg',
      afterImg: '/demo/card-2-after.webp',
    },
    {
      label: t.showcaseCard3,
      originalSize: '980 KB',
      compressedSize: '68 KB',
      reduction: 93,
      beforeImg: '/demo/card-3-before.jpg',
      afterImg: '/demo/card-3-after.webp',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`showcase-section ${isVisible ? 'showcase-visible' : ''}`}
      style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}
    >
      <h2 style={{
        fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: 'var(--text-primary)',
        marginBottom: 28,
      }}>
        {t.showcaseTitle}
      </h2>

      <div className="showcase-grid">
        {cards.map((card, i) => (
          <ShowcaseCard key={i} card={card} index={i} isVisible={isVisible} />
        ))}
      </div>

      <button
        onClick={onScrollToDropZone}
        className="showcase-cta"
      >
        {t.showcaseCta} <span style={{ marginLeft: 4, display: 'inline-block' }}>↓</span>
      </button>
    </section>
  );
}

function ShowcaseCard({ card, index, isVisible }: { card: CardData; index: number; isVisible: boolean }) {
  const { t } = useI18n();
  const [sliderPos, setSliderPos] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasSwept, setHasSwept] = useState(false);
  const [animatedReduction, setAnimatedReduction] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-sweep on first visibility
  useEffect(() => {
    if (!isVisible || hasSwept) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setSliderPos(50);
      setHasSwept(true);
      return;
    }
    const delay = 200 + index * 80;
    const timer = setTimeout(() => {
      const start = performance.now();
      const duration = 600;
      const from = 100;
      const to = 50;
      const ease = (p: number) => p * (2 - p);
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setSliderPos(from + (to - from) * ease(progress));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      setHasSwept(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [isVisible, hasSwept, index]);

  // Number count-up
  useEffect(() => {
    if (!isVisible) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setAnimatedReduction(card.reduction);
      return;
    }
    const delay = 400 + index * 80;
    const timer = setTimeout(() => {
      const start = performance.now();
      const duration = 900;
      const target = card.reduction;
      const ease = (p: number) => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p));
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setAnimatedReduction(Math.round(target * ease(progress)));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [isVisible, card.reduction, index]);

  const updateSlider = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSlider(e.clientX);
  }, [isMobile, updateSlider]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isMobile) return;
    updateSlider(e.clientX);
  }, [isDragging, isMobile, updateSlider]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`showcase-card glass-1 ${isVisible ? 'showcase-card-visible' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image comparison area */}
      <div
        ref={containerRef}
        className="showcase-image-area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => isMobile && setShowOriginal((v) => !v)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: 160,
          borderRadius: '21px 21px 0 0',
          cursor: isMobile ? 'pointer' : 'col-resize',
          touchAction: 'none',
        }}
      >
        {/* After (compressed) - bottom layer */}
        <img
          src={card.afterImg}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isMobile ? (showOriginal ? 0 : 1) : 1,
            transition: isMobile ? 'opacity 0.2s ease' : 'none',
          }}
        />

        {/* Before (original) - top layer with clip */}
        <img
          src={card.beforeImg}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            clipPath: isMobile ? 'none' : `inset(0 ${100 - sliderPos}% 0 0)`,
            opacity: isMobile ? (showOriginal ? 1 : 0) : 1,
            transition: isMobile ? 'opacity 0.2s ease' : 'none',
            willChange: isMobile ? 'auto' : 'clip-path',
          }}
        />

        {/* Slider handle - desktop only */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
              width: 2,
              background: 'rgba(255,255,255,0.7)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <div className="showcase-handle">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round">
                <path d="M9 4l-6 8 6 8" />
                <path d="M15 4l6 8-6 8" />
              </svg>
            </div>
          </div>
        )}

        {/* Before/After labels - desktop */}
        {!isMobile && (
          <>
            <span className="showcase-label" style={{ left: 8 }}>
              {t.cardOriginal}
            </span>
            <span className="showcase-label" style={{ right: 8 }}>
              {t.cardCompressed}
            </span>
          </>
        )}

        {/* Reduction badge */}
        <div className="showcase-badge">
          -{animatedReduction}%
        </div>
      </div>

      {/* Mobile toggle buttons */}
      {isMobile && (
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowOriginal(true); }}
            className="showcase-toggle-btn"
            style={{
              background: showOriginal ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: showOriginal ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {t.cardOriginal}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowOriginal(false); }}
            className="showcase-toggle-btn"
            style={{
              background: !showOriginal ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: !showOriginal ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {t.cardCompressed}
          </button>
        </div>
      )}

      {/* Info area */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {card.label}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>{card.originalSize}</span>
          <span style={{ color: 'var(--text-ghost)', fontSize: 10 }}>→</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{card.compressedSize}</span>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 10,
          height: 3,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              background: 'var(--success)',
              width: isVisible ? `${card.reduction}%` : '0%',
              transition: 'width 0.8s ease-out',
              transitionDelay: `${0.4 + index * 0.08}s`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
