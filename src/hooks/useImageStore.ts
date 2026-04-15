import { useState, useCallback } from 'react';
import {
  type ProcessedImage,
  type ProcessOptions,
  processImage,
  generateThumbnail,
} from '../utils/imageProcessor';
import {
  countBucket,
  extOnly,
  mimeShort,
  ratioBucket,
  sizeBucket,
  trackCompressComplete,
  trackCompressError,
  trackFileUpload,
  trackHeicDetected,
} from '../utils/analytics';
import { decodeHeic, isHeicFile } from '../utils/heicDecoder';
import { showToast } from '../components/Toast';
import { getI18nMessages } from '../i18n/useI18n';

let nextId = 0;

export function useImageStore() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const addFiles = useCallback((files: FileList | File[], source: 'drop' | 'paste' | 'click' | 'folder' = 'drop') => {
    // HEIC files may arrive with empty mime type on some platforms, so accept
    // them by extension in addition to the usual image/* mime filter.
    const accepted = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || isHeicFile(f),
    );

    // Track uploads (one event per file, carries extension) + HEIC detection.
    if (accepted.length > 0) {
      const batchBucket = countBucket(accepted.length);
      accepted.forEach((f) => {
        trackFileUpload({
          extension: extOnly(f.name),
          count_bucket: batchBucket,
          source,
        });
      });
      const heicCount = accepted.filter(isHeicFile).length;
      if (heicCount > 0) {
        trackHeicDetected({ count_bucket: countBucket(heicCount) });
        const t = getI18nMessages();
        showToast({ message: t.heicConverting, kind: 'info', duration: 3200 });
      }
    }

    const newImages: ProcessedImage[] = accepted.map((file) => ({
      id: `img-${nextId++}`,
      originalFile: file,
      originalUrl: isHeicFile(file) ? '' : URL.createObjectURL(file),
      thumbnailUrl: null,
      originalWidth: 0,
      originalHeight: 0,
      processedBlob: null,
      processedUrl: null,
      processedWidth: 0,
      processedHeight: 0,
      status: 'pending' as const,
    }));

    // Decode HEIC in background, then replace the File with a JPEG-encoded
    // File so the rest of the pipeline is HEIC-agnostic.
    newImages.forEach((item) => {
      if (isHeicFile(item.originalFile)) {
        decodeHeic(item.originalFile)
          .then((jpegFile) => {
            const newUrl = URL.createObjectURL(jpegFile);
            setImages((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, originalFile: jpegFile, originalUrl: newUrl }
                  : p,
              ),
            );
            generateThumbnail(jpegFile).then(({ url, width, height }) => {
              setImages((prev) =>
                prev.map((p) =>
                  p.id === item.id
                    ? { ...p, thumbnailUrl: url, originalWidth: width, originalHeight: height }
                    : p,
                ),
              );
            });
          })
          .catch((err) => {
            trackCompressError({ stage: 'decode', reason: String(err).slice(0, 80) });
            const t = getI18nMessages();
            showToast({ message: t.heicFailed, kind: 'error' });
            setImages((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, status: 'error' as const, error: String(err) }
                  : p,
              ),
            );
          });
      } else {
        generateThumbnail(item.originalFile).then(({ url, width, height }) => {
          setImages((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, thumbnailUrl: url, originalWidth: width, originalHeight: height }
                : p,
            ),
          );
        });
      }
    });

    setImages((prev) => [...prev, ...newImages]);
  }, []);

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
          const sizeBefore = item.originalFile.size;
          const sizeAfter = result.blob.size;
          const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);
          trackCompressComplete({
            format: mimeShort(options.format),
            mode: 'quality',
            size_before_bucket: sizeBucket(sizeBefore),
            size_after_bucket: sizeBucket(sizeAfter),
            ratio_bucket: ratioBucket(pct),
          });
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
          trackCompressError({ stage: 'encode', reason: String(err).slice(0, 80) });
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
      const sizeBefore = targetItem.originalFile.size;
      const sizeAfter = result.blob.size;
      const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);
      trackCompressComplete({
        format: mimeShort(options.format),
        mode: 'quality',
        size_before_bucket: sizeBucket(sizeBefore),
        size_after_bucket: sizeBucket(sizeAfter),
        ratio_bucket: ratioBucket(pct),
      });
      setImages((curr) =>
        curr.map((p) =>
          p.id === id
            ? { ...p, processedBlob: result.blob, processedUrl, processedWidth: result.width, processedHeight: result.height, status: 'done' as const }
            : p,
        ),
      );
    } catch (err) {
      trackCompressError({ stage: 'encode', reason: String(err).slice(0, 80) });
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
