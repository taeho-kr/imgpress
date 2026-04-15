/**
 * Folder-drop helpers — recursively walk a DataTransfer that contains
 * directory entries (using the webkit File and Directory Entries API) and
 * return a flat list of File objects.
 *
 * Browser support: Chromium, Firefox, Safari all expose webkitGetAsEntry()
 * on DataTransferItem when items are dropped from a file manager.
 */

interface DTItemWithEntry extends DataTransferItem {
  webkitGetAsEntry?: () => FileSystemEntry | null;
}

export function hasDirectoryEntry(items: DataTransferItemList | null): boolean {
  if (!items) return false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as DTItemWithEntry;
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry?.isDirectory) return true;
  }
  return false;
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const read = () => {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) resolve(all);
          else {
            all.push(...entries);
            read();
          }
        },
        reject,
      );
    };
    read();
  });
}

async function entryToFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([]),
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(reader);
    const nested = await Promise.all(entries.map(entryToFiles));
    return nested.flat();
  }
  return [];
}

/**
 * Walk a DataTransferItemList that may include directory entries, returning
 * every File found at any depth. Falls back to dataTransfer.files when the
 * Entries API is unavailable.
 */
export async function collectFilesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = dt.items;
  if (!items || !hasDirectoryEntry(items)) {
    return Array.from(dt.files);
  }
  const collected: File[] = [];
  const tasks: Promise<File[]>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as DTItemWithEntry;
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) tasks.push(entryToFiles(entry));
  }
  const results = await Promise.all(tasks);
  for (const arr of results) collected.push(...arr);
  return collected;
}
