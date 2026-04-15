/**
 * HEIC/HEIF decoding — dynamically loads libheif-js WASM bundle only when
 * needed, so the ~500KB dependency cost is paid exclusively by iPhone users
 * who drop HEIC files.
 *
 * Strategy: decode HEIC → JPEG at 92% quality → return as a standard File so
 * the rest of the pipeline stays HEIC-agnostic. 92% JPEG is visually
 * near-lossless, and the user's chosen output format (WebP/AVIF) will
 * re-encode from there.
 */

const HEIC_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeicFile(file: File): boolean {
  return HEIC_MIMES.has(file.type) || HEIC_EXT.test(file.name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let libheifPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLibheif(): Promise<any> {
  if (!libheifPromise) {
    libheifPromise = import('libheif-js/wasm-bundle').then((m) => m.default ?? m);
  }
  return libheifPromise;
}

export async function decodeHeic(file: File): Promise<File> {
  const libheif = await loadLibheif();
  const buffer = await file.arrayBuffer();
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(buffer);
  if (!images || images.length === 0) {
    throw new Error('HEIC contains no images');
  }
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const imageData = ctx.createImageData(width, height);

  await new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image.display(imageData, (displayData: any) => {
      if (!displayData) reject(new Error('HEIF decode failed'));
      else resolve();
    });
  });

  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });

  const newName = file.name.replace(HEIC_EXT, '.jpg');
  return new File([blob], newName.endsWith('.jpg') ? newName : `${newName}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}
