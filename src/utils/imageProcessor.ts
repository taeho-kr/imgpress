import { encodeImageData, type OutputFormat } from './codecEncode';
import type { ImageMeta } from './metadata';

// Perceptual-intent presets replace the meaningless raw % slider as the primary
// control. Values are calibrated against SSIMULACRA2 (see scripts/poc): for
// MozJPEG, q0.90≈score 88 (visually lossless), q0.80≈71 (high), q0.62≈medium.
// 'custom' = the user dragged the raw quality slider in Advanced.
export type QualityMode = 'lossless' | 'high' | 'small' | 'custom';

export const MODE_QUALITY: Record<Exclude<QualityMode, 'custom'>, number> = {
  lossless: 0.92,
  high: 0.8,
  small: 0.62,
};

export interface ProcessOptions {
  quality: number; // 0.0 ~ 1.0 — derived from `mode` unless mode === 'custom'
  format: OutputFormat;
  mode: QualityMode;
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
  originalMeta?: ImageMeta | null; // privacy metadata read from the original
  outputTags?: number | null;      // metadata tags surviving in the output (proof: 0)
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

// ─── Thumbnail Generation (uses createImageBitmap resize) ────────────────────

const THUMB_MAX = 320;

export async function generateThumbnail(file: File): Promise<{ url: string; width: number; height: number }> {
  try {
    // Decode to get dimensions
    const bitmap = await createImageBitmap(file);
    const { width: w, height: h } = bitmap;
    bitmap.close();

    // Small enough — use original file directly
    if (w <= THUMB_MAX && h <= THUMB_MAX) {
      return { url: URL.createObjectURL(file), width: w, height: h };
    }

    // Use createImageBitmap with resize (offloads work to browser's decoder)
    const scale = Math.min(THUMB_MAX / w, THUMB_MAX / h);
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    const resized = await createImageBitmap(file, {
      resizeWidth: tw,
      resizeHeight: th,
      resizeQuality: 'medium',
    });

    // Convert to blob via OffscreenCanvas (if available) or regular canvas
    let blob: Blob;
    if (typeof OffscreenCanvas !== 'undefined') {
      const oc = new OffscreenCanvas(tw, th);
      const ctx = oc.getContext('2d')!;
      ctx.drawImage(resized, 0, 0);
      resized.close();
      blob = await oc.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(resized, 0, 0);
      resized.close();
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.6);
    }

    return { url: URL.createObjectURL(blob), width: w, height: h };
  } catch {
    // Fallback: return original file URL without thumbnail
    return { url: URL.createObjectURL(file), width: 0, height: 0 };
  }
}

// ─── Persistent Worker Pool ──────────────────────────────────────────────────

const supportsWorker =
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

const POOL_SIZE = Math.min(
  typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 2) : 2,
  6,
);

interface WorkerTask {
  file: File;
  format: string;
  quality: number;
  resolve: (result: { blob: Blob; width: number; height: number }) => void;
  reject: (err: Error) => void;
}

let workerPool: Worker[] = [];
let idleWorkers: Worker[] = [];
const taskQueue: WorkerTask[] = [];
let poolInitialized = false;

function createWorker(): Worker {
  return new Worker(
    new URL('../workers/imageProcessor.worker.ts', import.meta.url),
    { type: 'module' },
  );
}

function initPool(): void {
  if (poolInitialized) return;
  poolInitialized = true;
  for (let i = 0; i < POOL_SIZE; i++) {
    const w = createWorker();
    workerPool.push(w);
    idleWorkers.push(w);
  }
}

function dispatch(worker: Worker, task: WorkerTask): void {
  worker.onmessage = (e: MessageEvent) => {
    if (e.data.error) {
      task.reject(new Error(e.data.error));
    } else {
      task.resolve({ blob: e.data.blob, width: e.data.width, height: e.data.height });
    }
    // Return worker to idle pool and pick next task
    const next = taskQueue.shift();
    if (next) {
      dispatch(worker, next);
    } else {
      idleWorkers.push(worker);
    }
  };
  worker.onerror = (e: ErrorEvent) => {
    task.reject(new Error(e.message || 'Worker error'));
    // Replace broken worker
    const idx = workerPool.indexOf(worker);
    if (idx !== -1) {
      worker.terminate();
      const replacement = createWorker();
      workerPool[idx] = replacement;
      const next = taskQueue.shift();
      if (next) {
        dispatch(replacement, next);
      } else {
        idleWorkers.push(replacement);
      }
    }
  };
  worker.postMessage({ file: task.file, format: task.format, quality: task.quality });
}

function processWithWorker(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  initPool();
  return new Promise((resolve, reject) => {
    const task: WorkerTask = { file, format: options.format, quality: options.quality, resolve, reject };
    const worker = idleWorkers.pop();
    if (worker) {
      dispatch(worker, task);
    } else {
      taskQueue.push(task);
    }
  });
}

// ─── Main Thread Fallback ─────────────────────────────────────────────────────

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
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, width, height);
  const buffer = await encodeImageData(imageData, options.format as OutputFormat, options.quality);
  const blob = new Blob([buffer], { type: options.format });
  return { blob, width, height };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function processImage(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (supportsWorker) {
    try {
      return await processWithWorker(file, options);
    } catch {
      // fall through to main thread
    }
  }
  return processOnMainThread(file, options);
}
