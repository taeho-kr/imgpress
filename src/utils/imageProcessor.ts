export interface ProcessOptions {
  quality: number; // 0.0 ~ 1.0
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
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
};

export function getOutputFilename(originalName: string, format: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}_compressed${FORMAT_EXT[format] || '.jpg'}`;
}

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

export async function processImage(
  file: File,
  options: ProcessOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);

  try {
    const img = await loadImage(url);
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, options.format, options.quality);
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
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
