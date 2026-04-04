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
