/// <reference lib="webworker" />

self.onmessage = async (e: MessageEvent<{ file: File; format: string; quality: number }>) => {
  const { file, format, quality } = e.data;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: format, quality });
    self.postMessage({ blob, width, height });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
