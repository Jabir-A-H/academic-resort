// ─── Types ─────────────────────────────────────────────────────────────────────
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  isFolder: boolean;
}

export interface DriveSearchResult {
  name: string;
  link: string;
  path: string;
  mimeType: string;
  semester: string;
  batch: string;
  folderId: string;
}

export interface FolderConfig {
  folderId: string;
  semester: string;
  batch: string;
  label?: string;
}

// ─── Extract folder ID from Drive URL or bare ID ───────────────────────────────
export function extractFolderId(driveUrl: string | null | undefined): string | null {
  if (!driveUrl || typeof driveUrl !== 'string') return null;
  const trimmed = driveUrl.trim();
  // Already a bare folder ID (33+ chars, alphanumeric + _-)
  if (/^[a-zA-Z0-9_-]{33,}$/.test(trimmed)) return trimmed;
  // Extract from full Drive URL
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── Normalise file webView link ───────────────────────────────────────────────
export function fileLink(file: { id: string; webViewLink?: string; mimeType: string }): string {
  if (file.webViewLink) return file.webViewLink;
  if (file.mimeType === 'application/vnd.google-apps.folder')
    return `https://drive.google.com/drive/folders/${file.id}`;
  return `https://drive.google.com/file/d/${file.id}/view`;
}

// ─── In-memory session cache (cleared on page refresh, perfect for a session) ──
const sessionCache = new Map<string, DriveFile[]>();

// ─── Fetch immediate children of a folder (via server proxy) ──────────────────
export async function fetchFolderContents(
  folderId: string,
  signal?: AbortSignal
): Promise<DriveFile[]> {
  if (sessionCache.has(folderId)) return sessionCache.get(folderId)!;

  try {
    const res = await fetch(`/api/drive?folderId=${encodeURIComponent(folderId)}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const files: DriveFile[] = (data.files ?? []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
    }));
    sessionCache.set(folderId, files);
    return files;
  } catch (err: any) {
    if (err?.name === 'AbortError') return [];
    console.warn('[Drive] fetch error for', folderId, err);
    return [];
  }
}

// ─── Recursively collect all files (not folders) from a Drive folder tree ─────
 export async function fetchAllFilesRecursively(
  folderId: string,
  path = '',
  maxDepth = 5,
  signal?: AbortSignal,
  currentDepth = 0,
  folderRegistry?: Map<string, string> // path → Drive folder ID
): Promise<{ name: string; link: string; path: string; mimeType: string; folderId: string }[]> {
  if (currentDepth >= maxDepth) return [];
  if (signal?.aborted) return [];

  const files = await fetchFolderContents(folderId, signal);
  const results: { name: string; link: string; path: string; mimeType: string; folderId: string }[] = [];
  const subfolderPromises: Promise<typeof results>[] = [];

  for (const file of files) {
    if (signal?.aborted) break;
    if (file.isFolder) {
      const newPath = path ? `${path} / ${file.name}` : file.name;
      // Record this folder's Drive ID keyed by its full path
      folderRegistry?.set(newPath, file.id);
      subfolderPromises.push(
        fetchAllFilesRecursively(file.id, newPath, maxDepth, signal, currentDepth + 1, folderRegistry)
      );
    } else {
      results.push({
        name: file.name,
        link: fileLink(file),
        path: path || 'Root',
        mimeType: file.mimeType,
        folderId,
      });
    }
  }

  if (subfolderPromises.length > 0) {
    const nested = await Promise.all(subfolderPromises);
    results.push(...nested.flat());
  }

  return results;
}

// ─── Smart string match (mirrors legacy smartMatch) ───────────────────────────
function smartMatch(searchTerm: string, fileName: string, filePath: string): boolean {
  const search = searchTerm.toLowerCase().trim();
  const name = fileName.toLowerCase();
  const path = filePath.toLowerCase();
  if (!search) return false;
  if (name.includes(search) || path.includes(search)) return true;

  // All words must be present
  const words = search.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    const allPresent = words.every(w => name.includes(w) || path.includes(w));
    if (allPresent) return true;
  }

  // Flexible no-space match
  const searchNoSpaces = search.replace(/\s+/g, '');
  return name.replace(/\s+/g, '').includes(searchNoSpaces) ||
         path.replace(/\s+/g, '').includes(searchNoSpaces);
}

// ─── Remove duplicates by path+name ───────────────────────────────────────────
function dedupe(results: DriveSearchResult[]): DriveSearchResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.batch}__${r.semester}__${r.path}__${r.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Search files across multiple Drive folders in parallel ───────────────────
export async function searchFilesInFolders(
  folderConfigs: FolderConfig[],
  searchTerm: string,
  maxDepth = 4,
  signal?: AbortSignal,
  onProgress?: (results: DriveSearchResult[], searched: number, total: number) => void,
  folderRegistry?: Map<string, string> // receives captured folder path→ID mappings
): Promise<DriveSearchResult[]> {
  if (!searchTerm || folderConfigs.length === 0) return [];

  const total = folderConfigs.length;
  let searched = 0;
  const allResults: DriveSearchResult[] = [];

  const BATCH_SIZE = 8;
  for (let i = 0; i < folderConfigs.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = folderConfigs.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async config => {
        if (signal?.aborted) return [];
        try {
          const files = await fetchAllFilesRecursively(
            config.folderId, '', maxDepth, signal, 0, folderRegistry
          );
          return files
            .filter(f => smartMatch(searchTerm, f.name, f.path))
            .map(f => ({
              name: f.name,
              link: f.link,
              path: f.path,
              mimeType: f.mimeType,
              semester: config.semester,
              batch: config.batch,
              folderId: f.folderId,
            }));
        } catch {
          return [];
        }
      })
    );

    for (const r of batchResults.flat()) allResults.push(r);
    searched += batch.length;
    onProgress?.(dedupe(allResults), searched, total);

    if (allResults.length > 500) break;
  }

  return dedupe(allResults);
}

// ─── MIME type → emoji icon ────────────────────────────────────────────────────
export function mimeIcon(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.folder') return '📁';
  if (mimeType === 'application/vnd.google-apps.document') return '📄';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return '📊';
  if (mimeType === 'application/vnd.google-apps.presentation') return '📋';
  if (mimeType === 'application/vnd.google-apps.form') return '📝';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
  return '📄';
}
