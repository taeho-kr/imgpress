import { useState, useCallback, useRef } from 'react';
import {
  type ProcessedImage,
  type ProcessOptions,
  processImage,
  generateThumbnail,
} from '../utils/imageProcessor';

let nextId = 0;

export function useImageStore() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Batch update accumulator — collects results and flushes once
  const pendingUpdates = useRef<Map<string, Partial<ProcessedImage>>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushUpdates = useCallback(() => {
    flushTimer.current = null;
    const updates = pendingUpdates.current;
    if (updates.size === 0) return;
    const snapshot = new Map(updates);
    updates.clear();
    setImages((prev) =>
      prev.map((img) => {
        const patch = snapshot.get(img.id);
        return patch ? { ...img, ...patch } : img;
      }),
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(flushUpdates, 16); // ~1 frame
  }, [flushUpdates]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newImages: ProcessedImage[] = accepted.map((file) => ({
      id: `img-${nextId++}`,
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      thumbnailUrl: null,
      originalWidth: 0,
      originalHeight: 0,
      processedBlob: null,
      processedUrl: null,
      processedWidth: 0,
      processedHeight: 0,
      status: 'pending' as const,
    }));

    // Generate thumbnails asynchronously
    newImages.forEach((item) => {
      generateThumbnail(item.originalFile).then(({ url, width, height }) => {
        pendingUpdates.current.set(item.id, {
          thumbnailUrl: url,
          originalWidth: width,
          originalHeight: height,
        });
        scheduleFlush();
      });
    });

    setImages((prev) => [...prev, ...newImages]);
  }, [scheduleFlush]);

  const processAll = useCallback(async (options: ProcessOptions) => {
    setIsProcessing(true);

    // Selected → process those; No selection → process all
    let toProcess: ProcessedImage[] = [];
    setImages((prev) => {
      const selectedIds = selected;
      const hasSelection = selectedIds.size > 0;
      toProcess = prev.filter((img) =>
        hasSelection ? selectedIds.has(img.id) : true,
      );
      const toProcessIds = new Set(toProcess.map((img) => img.id));
      return prev.map((img) => {
        if (!toProcessIds.has(img.id)) return img;
        // Revoke old processedUrl if re-compressing
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
        return { ...img, processedBlob: null, processedUrl: null, status: 'processing' as const };
      });
    });

    // Yield to React so "processing" state renders before heavy work starts
    await new Promise<void>((r) => setTimeout(r, 0));

    // Process all in parallel (worker pool limits concurrency internally)
    await Promise.all(
      toProcess.map(async (item) => {
        try {
          const result = await processImage(item.originalFile, options);
          const processedUrl = URL.createObjectURL(result.blob);
          pendingUpdates.current.set(item.id, {
            processedBlob: result.blob,
            processedUrl,
            processedWidth: result.width,
            processedHeight: result.height,
            status: 'done' as const,
          });
        } catch (err) {
          pendingUpdates.current.set(item.id, {
            status: 'error' as const,
            error: String(err),
          });
        }
        scheduleFlush();
      }),
    );

    // Final flush to ensure all updates are applied
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    flushUpdates();

    setIsProcessing(false);
    setSelected(new Set());
  }, [selected, scheduleFlush, flushUpdates]);

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
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
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
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
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
