import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';
import CompareModal from './CompareModal';

interface CardData {
  label: string;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  reduction: number;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return Math.round(bytes / 1024) + ' KB';
}

export default function CompressionShowcase({ onScrollToDropZone }: { onScrollToDropZone: () => void }) {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [compareCard, setCompareCard] = useState<CardData | null>(null);

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
      originalUrl: '/demo/card-1-original.jpg',
      compressedUrl: '/demo/card-1.webp',
      originalSize: 491861,
      compressedSize: 189296,
      width: 2400,
      height: 1600,
      reduction: 62,
    },
    {
      label: t.showcaseCard2,
      originalUrl: '/demo/card-2-original.jpg',
      compressedUrl: '/demo/card-2.webp',
      originalSize: 247858,
      compressedSize: 19316,
      width: 2400,
      height: 1600,
      reduction: 92,
    },
    {
      label: t.showcaseCard3,
      originalUrl: '/demo/card-3-original.jpg',
      compressedUrl: '/demo/card-3.webp',
      originalSize: 97853,
      compressedSize: 22692,
      width: 2400,
      height: 1600,
      reduction: 77,
    },
  ];

  return (
    <>
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
            <ShowcaseCard
              key={i}
              card={card}
              index={i}
              isVisible={isVisible}
              onClick={() => setCompareCard(card)}
            />
          ))}
        </div>

        <button
          onClick={onScrollToDropZone}
          className="showcase-cta"
        >
          {t.showcaseCta} <span style={{ marginLeft: 4, display: 'inline-block' }}>↓</span>
        </button>
      </section>

      {compareCard && (
        <CompareModal
          originalUrl={compareCard.originalUrl}
          processedUrl={compareCard.compressedUrl}
          originalSize={compareCard.originalSize}
          processedSize={compareCard.compressedSize}
          originalWidth={compareCard.width}
          originalHeight={compareCard.height}
          processedWidth={compareCard.width}
          processedHeight={compareCard.height}
          fileName={compareCard.label}
          onClose={() => setCompareCard(null)}
        />
      )}
    </>
  );
}

function ShowcaseCard({ card, index, isVisible, onClick }: {
  card: CardData; index: number; isVisible: boolean; onClick: () => void;
}) {
  const [animatedReduction, setAnimatedReduction] = useState(0);

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

  return (
    <div
      className={`showcase-card glass-1 ${isVisible ? 'showcase-card-visible' : ''}`}
      style={{ animationDelay: `${index * 0.08}s`, cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Image */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        height: 160,
        borderRadius: '21px 21px 0 0',
      }}>
        <img
          src={card.compressedUrl}
          alt={card.label}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Reduction badge */}
        <div className="showcase-badge">
          -{animatedReduction}%
        </div>
      </div>

      {/* Info */}
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
          <span style={{ color: 'var(--text-muted)' }}>{formatSize(card.originalSize)}</span>
          <span style={{ color: 'var(--text-ghost)', fontSize: 10 }}>→</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatSize(card.compressedSize)}</span>
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
