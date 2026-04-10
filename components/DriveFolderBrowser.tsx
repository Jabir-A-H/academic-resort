'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, ExternalLink, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { fetchFolderContents, fileLink, mimeIcon, type DriveFile } from '@/lib/drive';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DriveFolderBrowserProps {
  folderId: string;
  label?: string;
  depth?: number;
  defaultOpen?: boolean;
}

// ─── Single File Row ──────────────────────────────────────────────────────────
function DriveFileRow({ file }: { file: DriveFile }) {
  return (
    <a
      href={fileLink(file)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-on-surface hover:bg-surface-low hover:text-primary transition-colors"
      title={file.name}
    >
      <span className="flex-shrink-0 text-base leading-none">{mimeIcon(file.mimeType)}</span>
      <span className="flex-1 truncate group-hover:underline">{file.name}</span>
      <ExternalLink size={11} className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
    </a>
  );
}

// ─── Recursive Folder Node ────────────────────────────────────────────────────
function DriveFolderNode({
  folderId,
  label,
  depth = 0,
  defaultOpen = false,
}: DriveFolderBrowserProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const toggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (files !== null) return; // already loaded
    setLoading(true);
    setError(false);
    try {
      const result = await fetchFolderContents(folderId);
      result.sort((a: DriveFile, b: DriveFile) => {
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [open, files, folderId]);

  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  const isRoot = depth === 0;

  return (
    <div className={isRoot ? '' : 'my-0.5'}>
      {/* Row */}
      <div className="flex items-center gap-1 group/row">
        {/* Expand toggle */}
        <button
          onClick={toggle}
          aria-expanded={open}
          className={`flex items-center justify-center w-6 h-6 flex-shrink-0 rounded transition-colors ${
            open
              ? 'text-primary'
              : 'text-muted hover:text-primary'
          }`}
        >
          {loading
            ? <Loader2 size={13} className="animate-spin" />
            : open
              ? <ChevronDown size={13} />
              : <ChevronRight size={13} />
          }
        </button>

        {/* Folder name (links to Drive) */}
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-surface-low hover:text-primary truncate ${
            isRoot
              ? 'font-semibold text-on-surface'
              : 'font-medium text-on-surface'
          }`}
          title={`Open "${label}" in Google Drive`}
        >
          <span className="text-base leading-none">{open ? '📂' : '📁'}</span>
          <span className="truncate">{label}</span>
        </a>

        {/* External link icon — always visible on hover */}
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1 opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-muted hover:text-primary transition-all rounded"
          title="Open in Drive"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Children */}
      {open && (
        <div className="ml-6 pl-3 border-l border-dashed border-outline-variant/40 mt-0.5 pb-1">
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 py-1.5 px-2">
              <AlertCircle size={13} /> Could not load folder contents
            </div>
          )}
          {!error && files !== null && files.length === 0 && (
            <p className="text-xs text-muted italic py-1.5 px-2">Empty folder</p>
          )}
          {!error && files !== null && files.length > 0 && (
            <div className="flex flex-col">
              {files.map(f =>
                f.isFolder ? (
                  <DriveFolderNode
                    key={f.id}
                    folderId={f.id}
                    label={f.name}
                    depth={depth + 1}
                  />
                ) : (
                  <DriveFileRow key={f.id} file={f} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Public Export: Root Browser ──────────────────────────────────────────────
/**
 * DriveFolderBrowser
 * Drop-in live Google Drive folder explorer.
 * Lazily fetches each folder's contents when expanded.
 */
export default function DriveFolderBrowser({
  folderId,
  label = 'Drive Folder',
  depth = 0,
  defaultOpen = false,
}: DriveFolderBrowserProps) {
  return (
    <DriveFolderNode
      folderId={folderId}
      label={label}
      depth={depth}
      defaultOpen={defaultOpen}
    />
  );
}
