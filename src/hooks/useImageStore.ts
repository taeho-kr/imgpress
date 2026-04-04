import { useState, useCallback } from 'react';
import {
  type ProcessedImage,
  type ProcessOptions,
  processImage,
} from '../utils/imageProcessor';

let nextId = 0;

export function useImageStore() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newImages: ProcessedImage[] = accepted.map((file) => ({
      id: `img-${nextId++}`,
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      originalWidth: 0,
      originalHeight: 0,
      processedBlob: null,
      processedUrl: null,
      processedWidth: 0,
      processedHeight: 0,
      status: 'pending' as const,
    }));

    // Load original dimensions asynchronously
    newImages.forEach((item) => {
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight }
              : p,
          ),
        );
      };
      img.src = item.originalUrl;
    });

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const processAll = useCallback(async (options: ProcessOptions) => {
    setIsProcessing(true);

    // Capture pending items and mark them as processing in one setState
    let toProcess: ProcessedImage[] = [];
    setImages((prev) => {
      toProcess = prev.filter((img) => img.status !== 'done');
      return prev.map((img) =>
        img.status !== 'done' ? { ...img, status: 'processing' as const } : img,
      );
    });

    // Yield to React so "processing" state renders before heavy work starts
    await new Promise<void>((r) => setTimeout(r, 0));

    // Process all in parallel (worker pool limits concurrency internally)
    await Promise.all(
      toProcess.map(async (item) => {
        try {
          const result = await processImage(item.originalFile, options);
          const processedUrl = URL.createObjectURL(result.blob);
          setImages((curr) =>
            curr.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    processedBlob: result.blob,
                    processedUrl,
                    processedWidth: result.width,
                    processedHeight: result.height,
                    status: 'done' as const,
                  }
                : p,
            ),
          );
        } catch (err) {
          setImages((curr) =>
            curr.map((p) =>
              p.id === item.id
                ? { ...p, status: 'error' as const, error: String(err) }
                : p,
            ),
          );
        }
      }),
    );

    setIsProcessing(false);
  }, []);

  const retryImage = useCallback(async (id: string, options: ProcessOptions) => {
    let targetItem: ProcessedImage | undefined;
    setImages((prev) => {
      targetItem = prev.find((img) => img.id === id);
      return prev.map((img) =>
        img.id === id ? { ...img, status: 'processing' as const, error: undefined } : img,
      );
    });

    await new Promise<void>((r) => setTimeout(r, 0));
    if (!targetItem) return;

    try {
      const result = await processImage(targetItem.originalFile, options);
      const processedUrl = URL.createObjectURL(result.blob);
      setImages((curr) =>
        curr.map((p) =>
          p.id === id
            ? { ...p, processedBlob: result.blob, processedUrl, processedWidth: result.width, processedHeight: result.height, status: 'done' as const }
            : p,
        ),
      );
    } catch (err) {
      setImages((curr) =>
        curr.map((p) =>
          p.id === id ? { ...p, status: 'error' as const, error: String(err) } : p,
        ),
      );
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((item) => {
        URL.revokeObjectURL(item.originalUrl);
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
      });
      return [];
    });
  }, []);

  return { images, isProcessing, addFiles, processAll, retryImage, removeImage, clearAll };
}
