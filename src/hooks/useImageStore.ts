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
    const newImages: ProcessedImage[] = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;

      return {
        id: `img-${nextId++}`,
        originalFile: file,
        originalUrl: url,
        originalWidth: 0,
        originalHeight: 0,
        processedBlob: null,
        processedUrl: null,
        processedWidth: 0,
        processedHeight: 0,
        status: 'pending' as const,
      };
    });

    // Load original dimensions
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

    setImages((prev) =>
      prev.map((img) =>
        img.status !== 'done' ? { ...img, status: 'processing' as const } : img,
      ),
    );

    setImages((prev) => {
      const toProcess = prev.filter((img) => img.status === 'processing');

      toProcess.forEach(async (item) => {
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
      });

      return prev;
    });

    setIsProcessing(false);
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

  return { images, isProcessing, addFiles, processAll, removeImage, clearAll };
}
