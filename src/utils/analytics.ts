/**
 * Analytics — thin wrapper around gtag with PII-safe bucketing helpers.
 *
 * Privacy posture: imgpress promises "0% photo leakage". Events here NEVER
 * include filenames, paths, or image contents — only extensions (lowercased)
 * and bucketed numerics. This file is the single place all events flow
 * through so the privacy invariant can be audited at one point.
 */

type GtagFn = (command: string, eventName: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

function gtag(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// ─── PII-safe helpers ──────────────────────────────────────────────────────────

/** Bucket byte size to avoid leaking exact file sizes. */
export function sizeBucket(bytes: number): string {
  if (bytes < 50 * 1024) return '<50KB';
  if (bytes < 200 * 1024) return '50-200KB';
  if (bytes < 500 * 1024) return '200-500KB';
  if (bytes < 1024 * 1024) return '500KB-1MB';
  if (bytes < 5 * 1024 * 1024) return '1-5MB';
  if (bytes < 10 * 1024 * 1024) return '5-10MB';
  if (bytes < 25 * 1024 * 1024) return '10-25MB';
  return '>25MB';
}

/** Bucket file count for batch-size analysis. */
export function countBucket(n: number): string {
  if (n === 1) return '1';
  if (n <= 3) return '2-3';
  if (n <= 10) return '4-10';
  if (n <= 30) return '11-30';
  if (n <= 100) return '31-100';
  return '>100';
}

/** Bucket compression ratio (percent). */
export function ratioBucket(pct: number): string {
  if (pct < 0) return 'negative';
  if (pct < 20) return '0-20';
  if (pct < 40) return '20-40';
  if (pct < 60) return '40-60';
  if (pct < 80) return '60-80';
  return '80-100';
}

/**
 * Extract the file extension only (lowercased, no dot, no filename).
 * Falls back to 'unknown' if no extension or filename missing.
 */
export function extOnly(filename: string | undefined): string {
  if (!filename) return 'unknown';
  const m = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (!m) return 'none';
  return m[1].toLowerCase();
}

/** Normalize a mime type like "image/jpeg" to "jpeg". */
export function mimeShort(mime: string): string {
  return mime.replace(/^image\//, '').toLowerCase();
}

// ─── Event API ────────────────────────────────────────────────────────────────

export function trackFileUpload(params: { extension: string; count_bucket: string; source: 'drop' | 'paste' | 'click' | 'folder' }): void {
  gtag('file_upload', params);
}

export function trackCompressComplete(params: {
  format: string;
  mode: 'quality' | 'target_size';
  size_before_bucket: string;
  size_after_bucket: string;
  ratio_bucket: string;
}): void {
  gtag('compress_complete', params);
}

export function trackCompressError(params: { stage: 'decode' | 'encode' | 'worker'; reason: string }): void {
  gtag('compress_error', params);
}

export function trackFormatSelected(params: { format: string; source: 'user' | 'default' }): void {
  gtag('format_selected', params);
}

export function trackFolderDrop(params: { count_bucket: string }): void {
  gtag('folder_drop', params);
}

export function trackPwaInstall(params: { source: 'banner' | 'footer' | 'browser' }): void {
  gtag('pwa_install', params);
}

export function trackPwaLaunch(params: { source: 'standalone' | 'browser' }): void {
  gtag('pwa_launch', params);
}

export function trackHeicDetected(params: { count_bucket: string }): void {
  gtag('heic_detected', params);
}

export function trackTargetSizeResult(params: { achieved: boolean; diff_bucket: string }): void {
  gtag('target_size_result', params);
}
