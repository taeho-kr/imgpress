/// <reference lib="webworker" />

self.onmessage = async (e: MessageEvent<{ file: File; format: string; quality: number }>) => {
  const { file, format, quality } = e.data;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: format, quality });
    self.postMessage({ blob, width: canvas.width, height: canvas.height });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
