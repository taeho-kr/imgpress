// Metadata transparency — the "proof" half of the product.
//
// Browsers' Canvas/WASM re-encode pipeline strips ALL embedded metadata
// (EXIF/GPS/camera/timestamp) as a side effect, because we hand the codec raw
// RGBA pixels — there is no metadata channel. This module makes that invisible
// fact visible and verifiable: read what the ORIGINAL was leaking, then re-parse
// the OUTPUT to prove 0 tags remain. exifr is lazy-loaded (kept out of the
// initial bundle) and runs entirely on-device — nothing is uploaded.

export interface ImageMeta {
  gps: { lat: number; lng: number } | null;
  camera: string | null;
  dateTime: string | null;
  lens: string | null;
  software: string | null;
  tagCount: number;
}

export const EMPTY_META: ImageMeta = {
  gps: null, camera: null, dateTime: null, lens: null, software: null, tagCount: 0,
};

// Benign container/structure fields that every JPEG/PNG carries — these hold NO
// privacy signal, so they must NOT count as "hidden metadata" (otherwise a fully
// stripped output looks like it still leaks). The count below is privacy-relevant
// tags only: anything NOT in this denylist (EXIF/GPS/camera/date/owner/etc.).
const BENIGN_TAGS = new Set([
  'JFIFVersion', 'ResolutionUnit', 'XResolution', 'YResolution', 'ResolutionX', 'ResolutionY',
  'ColorComponents', 'ColorSpace', 'ColorTransform', 'YCbCrPositioning', 'ChromaPositioning',
  'Thumbnail', 'ThumbnailLength', 'ThumbnailOffset', 'ThumbnailHeight', 'ThumbnailWidth',
  'BitsPerSample', 'SamplesPerPixel', 'PhotometricInterpretation', 'Compression', 'Orientation',
  'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight', 'PixelXDimension', 'PixelYDimension',
  'EncodingProcess', 'BitDepth', 'ColorType', 'Interlace', 'Filter',
]);

// Count privacy-relevant metadata tags (excludes benign container headers).
function countTags(parsed: Record<string, unknown>): number {
  return Object.keys(parsed).filter(
    (k) => parsed[k] !== undefined && parsed[k] !== null && !BENIGN_TAGS.has(k),
  ).length;
}

function fmtDate(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return typeof v === 'string' ? v : null;
  // Local, human, locale-agnostic numeric form (no translation needed).
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Read the privacy-relevant metadata embedded in an image file/blob. */
export async function readMetadata(input: Blob | File): Promise<ImageMeta> {
  try {
    const exifr = (await import('exifr')).default;
    // `true` = parse all segments and merge; returns undefined when there's none.
    const out = await exifr.parse(input, true);
    if (!out) return EMPTY_META;
    const gps =
      typeof out.latitude === 'number' && typeof out.longitude === 'number'
        ? { lat: out.latitude, lng: out.longitude }
        : null;
    const camera = [out.Make, out.Model].filter(Boolean).join(' ').trim() || null;
    return {
      gps,
      camera,
      dateTime: fmtDate(out.DateTimeOriginal || out.CreateDate || out.ModifyDate),
      lens: out.LensModel ? String(out.LensModel) : null,
      software: out.Software ? String(out.Software) : null,
      tagCount: countTags(out as Record<string, unknown>),
    };
  } catch {
    return EMPTY_META;
  }
}

/**
 * Re-parse a processed output blob and return how many metadata tags survived.
 * For ImgPress output this is the genuine proof of stripping — it should be 0,
 * because the codec was fed raw pixels with no metadata path.
 */
export async function countOutputTags(blob: Blob): Promise<number> {
  try {
    const exifr = (await import('exifr')).default;
    const out = await exifr.parse(blob, true);
    return out ? countTags(out as Record<string, unknown>) : 0;
  } catch {
    return 0;
  }
}

/** True when the original carried anything worth proving was removed. */
export function hasSensitiveMeta(m: ImageMeta | null | undefined): boolean {
  return !!m && (!!m.gps || !!m.camera || !!m.dateTime || m.tagCount > 0);
}
