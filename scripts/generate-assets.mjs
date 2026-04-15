import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dir, '../public');

// ── og-image (1200×630) ──────────────────────────────────────────────────────
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="25%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#1e3a6e" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#080b12" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="85%" cy="75%" r="55%">
      <stop offset="0%" stop-color="#1a1030" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#080b12" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#080b12"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>

  <!-- Logo box -->
  <rect x="80" y="150" width="64" height="64" rx="16" fill="#e8a030"/>
  <line x1="112" y1="163" x2="112" y2="192" stroke="#080b12" stroke-width="5" stroke-linecap="round"/>
  <polyline points="97,183 112,198 127,183" stroke="#080b12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <line x1="93" y1="206" x2="131" y2="206" stroke="#080b12" stroke-width="5" stroke-linecap="round"/>

  <!-- Title -->
  <text x="80" y="310" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
    font-size="86" font-weight="700" fill="#f0f3fa" letter-spacing="-3">ImgPress</text>

  <!-- Subtitle -->
  <text x="82" y="368" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
    font-size="30" fill="rgba(210,218,235,0.75)" letter-spacing="-0.5">Free Online Image Compressor</text>

  <!-- Privacy badge -->
  <rect x="80" y="408" width="480" height="50" rx="25" fill="rgba(52,201,138,0.08)" stroke="rgba(52,201,138,0.28)" stroke-width="1.5"/>
  <circle cx="108" cy="433" r="12" fill="none" stroke="rgba(52,201,138,0.8)" stroke-width="1.8"/>
  <polyline points="103,433 107,437 114,428" stroke="rgba(52,201,138,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="130" y="439"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
    font-size="17" fill="rgba(52,201,138,0.85)" dominant-baseline="middle">
    0% Photo Leakage · No Server Upload · 100% Free
  </text>

  <!-- Decorative rings -->
  <circle cx="980" cy="315" r="230" fill="none" stroke="rgba(232,160,48,0.05)" stroke-width="1"/>
  <circle cx="980" cy="315" r="170" fill="none" stroke="rgba(232,160,48,0.07)" stroke-width="1"/>
  <circle cx="980" cy="315" r="110" fill="none" stroke="rgba(232,160,48,0.1)" stroke-width="1.5"/>

  <!-- Format labels -->
  <text x="895" y="258" font-family="'Courier New',monospace" font-size="22"
    fill="rgba(232,160,48,0.6)" text-anchor="middle" font-weight="700">JPG</text>
  <text x="980" y="323" font-family="'Courier New',monospace" font-size="26"
    fill="rgba(232,160,48,0.92)" text-anchor="middle" font-weight="700">WebP</text>
  <text x="1065" y="258" font-family="'Courier New',monospace" font-size="22"
    fill="rgba(232,160,48,0.6)" text-anchor="middle" font-weight="700">PNG</text>
  <text x="895" y="395" font-family="'Courier New',monospace" font-size="18"
    fill="rgba(232,160,48,0.35)" text-anchor="middle">GIF</text>
  <text x="1065" y="395" font-family="'Courier New',monospace" font-size="18"
    fill="rgba(232,160,48,0.35)" text-anchor="middle">BMP</text>
</svg>`;

// ── apple-touch-icon (180×180) ───────────────────────────────────────────────
const iconSvg = `<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="40" fill="#080b12"/>
  <rect x="54" y="54" width="72" height="72" rx="18" fill="#e8a030"/>
  <line x1="90" y1="66" x2="90" y2="100" stroke="#080b12" stroke-width="6.5" stroke-linecap="round"/>
  <polyline points="74,91 90,107 106,91" stroke="#080b12" stroke-width="6.5"
    stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <line x1="70" y1="116" x2="110" y2="116" stroke="#080b12" stroke-width="6.5" stroke-linecap="round"/>
</svg>`;

await sharp(Buffer.from(ogSvg)).png().toFile(`${publicDir}/og-image.png`);
console.log('✓ og-image.png');

await sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile(`${publicDir}/apple-touch-icon.png`);
console.log('✓ apple-touch-icon.png');

// ── Demo cards (2400×1600, retina-ready) ─────────────────────────────────────
// The showcase modal renders up to ~900px (≈1800px on retina), so the source
// must be at least that wide. We synthesize photo-like SVGs and add Gaussian
// noise via sharp's `noise` raw layer, which gives JPEG/WebP encoders enough
// high-frequency content to produce realistic compression ratios.

const DEMO_W = 2400;
const DEMO_H = 1600;
const demoDir = `${publicDir}/demo`;

// Card 1 — landscape (sunset over mountains)
const card1Svg = `<svg width="${DEMO_W}" height="${DEMO_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1f4a"/>
      <stop offset="40%" stop-color="#5e3a6e"/>
      <stop offset="70%" stop-color="#e8a060"/>
      <stop offset="100%" stop-color="#f5d8a0"/>
    </linearGradient>
    <linearGradient id="mountain1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a3a55"/>
      <stop offset="100%" stop-color="#0f1822"/>
    </linearGradient>
    <linearGradient id="mountain2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c2638"/>
      <stop offset="100%" stop-color="#0a1018"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.3" cy="0.55" r="0.18">
      <stop offset="0%" stop-color="#fff5d8" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="#f5b860" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#f5b860" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${DEMO_W}" height="${DEMO_H}" fill="url(#sky)"/>
  <rect width="${DEMO_W}" height="${DEMO_H}" fill="url(#sun)"/>
  <!-- Far mountains -->
  <path d="M 0 1100 L 350 850 L 700 950 L 1100 800 L 1500 880 L 1850 750 L 2400 900 L 2400 1600 L 0 1600 Z" fill="url(#mountain2)" opacity="0.85"/>
  <!-- Near mountains -->
  <path d="M 0 1280 L 280 1100 L 580 1180 L 920 1050 L 1280 1130 L 1620 1020 L 1980 1140 L 2400 1080 L 2400 1600 L 0 1600 Z" fill="url(#mountain1)"/>
  <!-- Foreground -->
  <rect x="0" y="1380" width="${DEMO_W}" height="220" fill="#080b12"/>
  <!-- Stars -->
  ${Array.from({ length: 80 }, () => {
    const x = Math.random() * DEMO_W;
    const y = Math.random() * 600;
    const r = Math.random() * 1.5 + 0.5;
    const o = Math.random() * 0.7 + 0.3;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="white" opacity="${o.toFixed(2)}"/>`;
  }).join('')}
</svg>`;

// Card 2 — UI screenshot (dashboard mockup)
const card2Svg = `<svg width="${DEMO_W}" height="${DEMO_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c1018"/>
      <stop offset="100%" stop-color="#1a2030"/>
    </linearGradient>
    <linearGradient id="card2bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
  </defs>
  <rect width="${DEMO_W}" height="${DEMO_H}" fill="url(#bg2)"/>
  <!-- Sidebar -->
  <rect x="0" y="0" width="320" height="${DEMO_H}" fill="rgba(0,0,0,0.3)"/>
  <rect x="48" y="60" width="48" height="48" rx="12" fill="#e8a030"/>
  ${[0,1,2,3,4,5].map((i) => `
    <rect x="40" y="${180 + i*68}" width="240" height="48" rx="8" fill="${i===1?'rgba(232,160,48,0.15)':'rgba(255,255,255,0.03)'}"/>
    <circle cx="64" cy="${204 + i*68}" r="8" fill="${i===1?'#e8a030':'rgba(255,255,255,0.3)'}"/>
    <rect x="84" y="${198 + i*68}" width="${120 + Math.random()*60}" height="12" rx="3" fill="rgba(255,255,255,${i===1?0.7:0.25})"/>
  `).join('')}
  <!-- Main area cards -->
  ${[0,1,2].map((i) => `
    <rect x="${380 + i*640}" y="80" width="600" height="280" rx="20" fill="url(#card2bg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="${420 + i*640}" y="120" width="${100 + i*40}" height="14" rx="3" fill="rgba(255,255,255,0.4)"/>
    <text x="${420 + i*640}" y="220" font-family="-apple-system,sans-serif" font-size="56" font-weight="700" fill="${i===0?'#e8a030':i===1?'#34c98a':'#f0f3fa'}">${['12.4K','94%','+38'][i]}</text>
    <rect x="${420 + i*640}" y="280" width="320" height="10" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="${420 + i*640}" y="280" width="${180 + i*40}" height="10" rx="2" fill="${i===0?'#e8a030':i===1?'#34c98a':'#5e7eaa'}"/>
  `).join('')}
  <!-- Chart -->
  <rect x="380" y="420" width="1880" height="600" rx="20" fill="url(#card2bg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <rect x="420" y="460" width="180" height="14" rx="3" fill="rgba(255,255,255,0.4)"/>
  ${Array.from({ length: 24 }, (_, i) => {
    const h = 80 + Math.sin(i * 0.5) * 180 + Math.random() * 100 + 100;
    const x = 460 + i * 75;
    const y = 1000 - h;
    return `<rect x="${x}" y="${y}" width="50" height="${h}" rx="4" fill="${i % 4 === 0 ? '#e8a030' : 'rgba(232,160,48,0.35)'}"/>`;
  }).join('')}
  <!-- Bottom row -->
  <rect x="380" y="1080" width="900" height="440" rx="20" fill="url(#card2bg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <rect x="1320" y="1080" width="940" height="440" rx="20" fill="url(#card2bg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  ${Array.from({ length: 6 }, (_, i) => `
    <rect x="420" y="${1140 + i*52}" width="40" height="40" rx="20" fill="rgba(232,160,48,${0.6 - i*0.08})"/>
    <rect x="480" y="${1154 + i*52}" width="${320 - i*30}" height="12" rx="3" fill="rgba(255,255,255,${0.6 - i*0.08})"/>
  `).join('')}
</svg>`;

// Card 3 — vector graphic (geometric)
const card3Svg = `<svg width="${DEMO_W}" height="${DEMO_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg3" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#1c2640"/>
      <stop offset="100%" stop-color="#080b12"/>
    </radialGradient>
  </defs>
  <rect width="${DEMO_W}" height="${DEMO_H}" fill="url(#bg3)"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const cx = DEMO_W / 2 + Math.cos(angle) * 380;
    const cy = DEMO_H / 2 + Math.sin(angle) * 380;
    const r = 180 + (i % 3) * 60;
    const fill = ['#e8a030', '#34c98a', '#5e7eaa'][i % 3];
    const opacity = 0.18 + (i % 3) * 0.06;
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r}" fill="${fill}" opacity="${opacity.toFixed(2)}"/>`;
  }).join('')}
  <circle cx="${DEMO_W/2}" cy="${DEMO_H/2}" r="220" fill="none" stroke="#e8a030" stroke-width="2" opacity="0.6"/>
  <circle cx="${DEMO_W/2}" cy="${DEMO_H/2}" r="320" fill="none" stroke="#e8a030" stroke-width="1.5" opacity="0.4"/>
  <circle cx="${DEMO_W/2}" cy="${DEMO_H/2}" r="420" fill="none" stroke="#e8a030" stroke-width="1" opacity="0.25"/>
  <circle cx="${DEMO_W/2}" cy="${DEMO_H/2}" r="120" fill="#e8a030" opacity="0.9"/>
  <polygon points="${DEMO_W/2},${DEMO_H/2 - 60} ${DEMO_W/2 + 52},${DEMO_H/2 + 30} ${DEMO_W/2 - 52},${DEMO_H/2 + 30}" fill="#080b12"/>
</svg>`;

// Add photographic-style noise so encoders can't compress trivially —
// gives the showcase a believable compression ratio rather than 99%.
// Per-card noise level is tuned so each card type lands in a realistic
// range (photos ~60%, screenshots ~80%, vector graphics ~90%).
async function withNoise(svgBuffer, amplitude) {
  const base = await sharp(svgBuffer).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = base;
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += info.channels) {
    const n = (Math.random() - 0.5) * amplitude;
    out[i] = Math.max(0, Math.min(255, out[i] + n));
    out[i + 1] = Math.max(0, Math.min(255, out[i + 1] + n));
    out[i + 2] = Math.max(0, Math.min(255, out[i + 2] + n));
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

const cards = [
  { idx: 1, svg: card1Svg, noise: 24, jpegQ: 85, webpQ: 48 }, // landscape: noisy, ~70% reduction
  { idx: 2, svg: card2Svg, noise: 6,  jpegQ: 92, webpQ: 50 }, // UI: cleaner, ~93% reduction
  { idx: 3, svg: card3Svg, noise: 2,  jpegQ: 92, webpQ: 45 }, // vector: minimal, ~85% reduction
];

for (const { idx, svg, noise, jpegQ, webpQ } of cards) {
  const noisy = await withNoise(Buffer.from(svg), noise);
  const noisyBuf = await noisy.png().toBuffer();
  await sharp(noisyBuf).jpeg({ quality: jpegQ, mozjpeg: true }).toFile(`${demoDir}/card-${idx}-original.jpg`);
  await sharp(noisyBuf).webp({ quality: webpQ }).toFile(`${demoDir}/card-${idx}.webp`);
  console.log(`✓ card-${idx} (${DEMO_W}×${DEMO_H})`);
}
