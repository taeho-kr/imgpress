/**
 * AVIF encoding support detection. Runs once, caches the result. Browsers
 * that lack AVIF in toBlob silently fall back to PNG, so we test for the
 * actual MIME type on the produced blob.
 */

let cached: Promise<boolean> | null = null;

export function supportsAvifEncoding(): Promise<boolean> {
  if (cached) return cached;
  cached = new Promise<boolean>((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1, 1);
      canvas.toBlob(
        (blob) => resolve(!!blob && blob.type === 'image/avif'),
        'image/avif',
        0.8,
      );
    } catch {
      resolve(false);
    }
  });
  return cached;
}
