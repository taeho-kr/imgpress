// WASM-codec encode layer.
//
// The browser still DECODES the input (createImageBitmap → OffscreenCanvas),
// which keeps universal input-format support (JPG/PNG/WebP/GIF/BMP/SVG). These
// WASM codecs only replace the ENCODE step, which is where Canvas.convertToBlob
// is objectively inferior (no trellis quantization, no modern formats). Each
// codec's WASM binary is lazy-loaded on first use so the initial bundle and the
// PWA offline cache stay small.
//
// Runs unchanged on the main thread or inside a Web Worker. Single-threaded
// builds are used implicitly (oxipng auto-detects the lack of SharedArrayBuffer
// and falls back to single-thread), so no COOP/COEP headers are required and the
// current static hosting is preserved.

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

// App quality is 0.1–1.0; every codec here takes an integer 1–100.
const toQ = (quality: number) => Math.max(1, Math.min(100, Math.round(quality * 100)));

export async function encodeImageData(
  imageData: ImageData,
  format: OutputFormat,
  quality: number,
): Promise<ArrayBuffer> {
  switch (format) {
    case 'image/jpeg': {
      // MozJPEG — progressive + optimized Huffman by default (see meta.js).
      const encode = (await import('@jsquash/jpeg/encode')).default;
      return encode(imageData, { quality: toQ(quality) });
    }
    case 'image/webp': {
      const encode = (await import('@jsquash/webp/encode')).default;
      return encode(imageData, { quality: toQ(quality) });
    }
    case 'image/avif': {
      // Opt-in output. AVIF encode is CPU-heavy; default speed (6) keeps it sane.
      const encode = (await import('@jsquash/avif/encode')).default;
      return encode(imageData, { quality: toQ(quality) });
    }
    case 'image/png': {
      // PNG is lossless — the quality slider does not affect fidelity here.
      // OxiPNG re-compresses losslessly; level 2 is a good speed/size balance.
      const optimise = (await import('@jsquash/oxipng/optimise')).default;
      return optimise(imageData, { level: 2 });
    }
  }
}
