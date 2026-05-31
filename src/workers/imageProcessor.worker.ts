/// <reference lib="webworker" />
import { encodeImageData, type OutputFormat } from '../utils/codecEncode';

self.onmessage = async (e: MessageEvent<{ file: File; format: string; quality: number }>) => {
  const { file, format, quality } = e.data;
  try {
    // Decode with the browser (universal input support), then re-encode with a
    // WASM codec for far better quality-per-byte than Canvas.convertToBlob.
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, width, height);
    const buffer = await encodeImageData(imageData, format as OutputFormat, quality);
    const blob = new Blob([buffer], { type: format });
    self.postMessage({ blob, width, height });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
