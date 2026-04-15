export type ProcessMode = 'quality' | 'target_size';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export interface ProcessOptions {
  quality: number; // 0.0 ~ 1.0, used when mode === 'quality'
  format: OutputFormat;
  mode: ProcessMode;
  targetSizeKB: number; // used when mode === 'target_size'
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  thumbnailUrl: string | null;
  originalWidth: number;
  originalHeight: number;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedWidth: number;
  processedHeight: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

const FORMAT_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

export function getOutputFilename(originalName: string, format: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}_compressed${FORMAT_EXT[format] || '.jpg'}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function compressionRatio(original: number, processed: number): number {
  return Math.round((1 - processed / original) * 100);
}

// ─── Thumbnail Generation ────────────────────────────────────────────────────

const THUMB_MAX = 320;

export async function generateThumbnail(file: File): Promise<{ url: string; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { naturalWidth: w, naturalHeight: h } = img;

    // Skip thumbnail if already small enough
    if (w <= THUMB_MAX && h <= THUMB_MAX) {
      return { url: URL.createObjectURL(file), width: w, height: h };
    }

    const scale = Math.min(THUMB_MAX / w, THUMB_MAX / h);
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, tw, th);

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.6);
    return { url: URL.createObjectURL(blob), width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── Worker Pool ──────────────────────────────────────────────────────────────

const supportsWorker =
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

const MAX_CONCURRENT = Math.min(
  typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 2) : 2,
  4,
);

let activeWorkers = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeWorkers < MAX_CONCURRENT) {
    activeWorkers++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeWorkers++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeWorkers--;
  const next = waitQueue.shift();
  if (next) next();
}

async function processWithWorker(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  await acquireSlot();
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent) => {
      worker.terminate();
      releaseSlot();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve({ blob: e.data.blob, width: e.data.width, height: e.data.height });
    };
    worker.onerror = (e: ErrorEvent) => {
      worker.terminate();
      releaseSlot();
      reject(new Error(e.message || 'Worker error'));
    };
    worker.postMessage({ file, format: options.format, quality: options.quality });
  });
}

// ─── Main Thread Fallback ─────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      format,
      quality,
    );
  });
}

async function processOnMainThread(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { naturalWidth: width, naturalHeight: height } = img;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, options.format, options.quality);
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function encodeOnce(
  file: File,
  format: ProcessOptions['format'],
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const opts: ProcessOptions = { format, quality, mode: 'quality', targetSizeKB: 0 };
  if (supportsWorker) {
    try {
      return await processWithWorker(file, opts);
    } catch {
      // fall through to main thread
    }
  }
  return processOnMainThread(file, opts);
}

/**
 * Binary-search quality to hit a target file size. Only meaningful for lossy
 * formats (JPEG/WebP) — PNG ignores the quality param, so callers should
 * avoid this path for PNG.
 *
 * Returns the best-achieved result plus a flag indicating whether the target
 * was met (size <= target). Caller can surface a "target missed" toast.
 */
async function processWithTargetSize(
  file: File,
  format: ProcessOptions['format'],
  targetBytes: number,
): Promise<{ blob: Blob; width: number; height: number; achieved: boolean; quality: number }> {
  let lo = 0.1;
  let hi = 0.98;
  let best: { blob: Blob; width: number; height: number; quality: number } | null = null;
  let bestUnderTarget: typeof best = null;

  const MAX_ITERS = 7;
  for (let i = 0; i < MAX_ITERS; i++) {
    const q = (lo + hi) / 2;
    const r = await encodeOnce(file, format, q);
    const candidate = { ...r, quality: q };

    // Track best-under-target (prefer largest blob that still fits).
    if (r.blob.size <= targetBytes) {
      if (!bestUnderTarget || r.blob.size > bestUnderTarget.blob.size) {
        bestUnderTarget = candidate;
      }
    }
    // Track overall closest by absolute diff (fallback when target unattainable).
    if (!best || Math.abs(r.blob.size - targetBytes) < Math.abs(best.blob.size - targetBytes)) {
      best = candidate;
    }

    // Converged within 5% of target → stop early.
    if (Math.abs(r.blob.size - targetBytes) / targetBytes < 0.05) break;

    if (r.blob.size > targetBytes) hi = q;
    else lo = q;
  }

  const chosen = bestUnderTarget ?? best!;
  return { ...chosen, achieved: !!bestUnderTarget };
}

export async function processImage(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number; targetAchieved?: boolean }> {
  // Target-size mode is only meaningful for lossy formats.
  if (options.mode === 'target_size' && options.format !== 'image/png') {
    const result = await processWithTargetSize(
      file,
      options.format,
      options.targetSizeKB * 1024,
    );
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      targetAchieved: result.achieved,
    };
  }
  return encodeOnce(file, options.format, options.quality);
}
