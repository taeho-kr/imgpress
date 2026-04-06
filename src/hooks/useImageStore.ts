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
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

    // Capture items to process: selected non-done, or all non-done if nothing selected
    let toProcess: ProcessedImage[] = [];
    setImages((prev) => {
      const selectedIds = selected;
      const hasSelection = selectedIds.size > 0;
      toProcess = prev.filter((img) =>
        img.status !== 'done' && (!hasSelection || selectedIds.has(img.id)),
      );
      const toProcessIds = new Set(toProcess.map((img) => img.id));
      return prev.map((img) =>
        toProcessIds.has(img.id) ? { ...img, status: 'processing' as const } : img,
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
    setSelected(new Set());
  }, [selected]);

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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
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
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setImages((prev) => {
      setSelected(new Set(prev.map((img) => img.id)));
      return prev;
    });
  }, []);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  return {
    images, isProcessing, selected,
    addFiles, processAll, retryImage, removeImage, clearAll,
    toggleSelect, selectAll, deselectAll,
  };
}
