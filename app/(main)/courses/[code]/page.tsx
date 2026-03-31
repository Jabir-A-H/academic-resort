'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Home, Loader2, ExternalLink, ChevronDown, ChevronUp,
  FileText, Folder, FolderOpen, AlertCircle,
} from 'lucide-react';
import { getCourseDetails } from '@/lib/database';
import { fetchFolderContents, fileLink, mimeIcon, extractFolderId, type DriveFile } from '@/lib/drive';

// ─── Drive File Item ───────────────────────────────────────────────────────────
function DriveFileItem({ file }: { file: DriveFile }) {
  return (
    <li className="drive-file-item">
      <a
        href={fileLink(file)}
        target="_blank"
        rel="noopener noreferrer"
        className="drive-file-link"
      >
        <span className="drive-file-icon">{mimeIcon(file.mimeType)}</span>
        <span className="drive-file-name">{file.name}</span>
        <ExternalLink size={10} className="drive-file-ext" />
      </a>
    </li>
  );
}

// ─── Drive Folder (recursive, accordion) ──────────────────────────────────────
function DriveFolder({ folderId, label, depth = 0 }: { folderId: string; label: string; depth?: number }) {
  const [open, setOpen]       = useState(false);
  const [files, setFiles]     = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const toggle = useCallback(async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (files !== null) return; // already loaded
    setLoading(true);
    setError(false);
    try {
      const result = await fetchFolderContents(folderId);
      // Sort: folders first, then files, both alphabetically
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
  const indent    = depth * 16;

  return (
    <div className="drive-folder-item" style={{ marginLeft: depth > 0 ? indent : 0 }}>
      <div className="drive-folder-row">
        {/* Open in Drive */}
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="drive-folder-link"
        >
          {open ? <FolderOpen size={15} /> : <Folder size={15} />}
          <span>{label}</span>
        </a>

        {/* Expand toggle */}
        <button
          className={`drive-expand-btn${open ? ' open' : ''}`}
          onClick={toggle}
          title={open ? 'Collapse' : 'Expand folder contents'}
          aria-expanded={open}
        >
          {loading
            ? <Loader2 size={13} className="animate-spin" />
            : open
              ? <ChevronUp size={13} />
              : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Contents */}
      {open && (
        <div className="drive-folder-contents">
          {error && (
            <div className="drive-folder-error">
              <AlertCircle size={13} /> Could not load folder
            </div>
          )}
          {!error && files !== null && files.length === 0 && (
            <p className="drive-folder-empty">Empty folder</p>
          )}
          {!error && files !== null && files.length > 0 && (
            <ul className="drive-file-list">
              {files.map(f =>
                f.isFolder
                  ? <li key={f.id}>
                      <DriveFolder
                        folderId={f.id}
                        label={f.name}
                        depth={depth + 1}
                      />
                    </li>
                  : <DriveFileItem key={f.id} file={f} />
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'Notes':              '📝',
  'Slides & Lectures':  '📊',
  'Books & Manuals':    '📚',
  'Question Papers':    '📋',
  'Assignments':        '✏️',
  'Previous Materials': '📁',
};

function CategorySection({ title, materials }: { title: string; materials: any[] }) {
  if (materials.length === 0) return null;
  return (
    <div className="link-section">
      <h4 className="section-title">
        <span>{CATEGORY_ICONS[title] ?? '📄'}</span> {title}
      </h4>
      <div className="links-list">
        {materials.map((m: any) => {
          const fid = extractFolderId(m.url);
          return fid
            ? <DriveFolder key={m.id} folderId={fid} label={m.title || title} />
            : (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="drive-folder-link plain-link"
              >
                <FileText size={14} />
                <span>{m.title || title}</span>
                <ExternalLink size={10} />
              </a>
            );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoursePage() {
  const params = useParams();
  const code   = Array.isArray(params.code) ? params.code[0] : params.code;

  const [course,  setCourse]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    getCourseDetails(code)
      .then(setCourse)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  // Group occurrences by batch (newest first)
  const batchGroups = useMemo(() => {
    if (!course?.occurrences) return [];
    const groups = new Map<string, any>();
    course.occurrences.forEach((occ: any) => {
      const batchName = occ.semesters?.batches?.name || 'Unknown Batch';
      if (!groups.has(batchName)) {
        groups.set(batchName, {
          name:         batchName,
          driveId:      occ.semesters?.drive_folder_id,
          semester:     occ.semesters?.name,
          classUpdates: occ.class_updates_url,
          sections:     occ.sections   || [],
          materials:    occ.resource_links || [],
        });
      }
    });
    return Array.from(groups.values()).sort((a, b) => {
      const ai = parseInt(a.name), bi = parseInt(b.name);
      return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
    });
  }, [course]);

  const CATEGORIES = [
    'Notes', 'Slides & Lectures', 'Books & Manuals',
    'Question Papers', 'Assignments', 'Previous Materials',
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-blue)' }} />
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div style={{
        maxWidth: 640, margin: '0 auto',
        background: '#fef2f2', border: '1px solid #fecaca',
        color: '#b91c1c', padding: '24px', borderRadius: 12,
      }}>
        {error || 'Course not found'}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link">
            <Home size={16} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumbs */}
        <nav style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          {batchGroups[0]?.semester && (
            <>
              <Link
                href={`/semester/${batchGroups[0].semester.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ color: 'var(--muted)', textDecoration: 'none' }}
              >
                {batchGroups[0].semester} Semester
              </Link>
              <span>›</span>
            </>
          )}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {course.title} ({course.code})
          </span>
        </nav>

        {/* Page Header */}
        <div className="page-intro mb-10">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{
              background: 'var(--primary-blue)', color: '#fff',
              padding: '4px 12px', borderRadius: 8, fontSize: '0.75em',
              fontWeight: 800, letterSpacing: '0.05em',
            }}>
              {course.code}
            </span>
            {course.title}
          </h1>
          {course.description && (
            <p style={{ color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
              {course.description}
            </p>
          )}
        </div>

        {/* Batch sections */}
        <div id="batches-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {batchGroups.length === 0 ? (
            <div className="no-data-message">No batch data available for this course yet.</div>
          ) : batchGroups.map(group => (
            <section key={group.name} className="drive-batch-container" id={`batch-${group.name}`}>
              <div className="drive-embed-card">

                {/* Batch header */}
                <div className="batch-header">
                  <h2>{group.name}</h2>
                  {group.driveId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${group.driveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="root-folder-btn"
                    >
                      <ExternalLink size={12} /> Open Drive Folder
                    </a>
                  )}
                </div>

                <div className="drive-list-wrapper">
                  <div className="course-links-list">

                    {/* Sections & Teachers */}
                    {group.sections.length > 0 && (
                      <div className="link-section">
                        <h4 className="section-title">👥 Sections & Teachers</h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          {group.sections
                            .slice()
                            .sort((a: any, b: any) => a.name.localeCompare(b.name))
                            .map((sec: any) => (
                              <div
                                key={sec.name}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 8, padding: '6px 12px', fontSize: 13,
                                }}
                              >
                                <span style={{
                                  background: 'var(--primary-blue)', color: '#fff',
                                  borderRadius: 4, padding: '2px 6px',
                                  fontSize: 11, fontWeight: 700,
                                }}>
                                  Section {sec.name}
                                </span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {sec.teachers?.name || 'TBA'}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Class Updates */}
                    {group.classUpdates && (
                      <div className="link-section">
                        <h4 className="section-title">📢 Class Updates</h4>
                        <div className="links-list">
                          <a
                            href={group.classUpdates}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="drive-folder-link plain-link"
                          >
                            <FileText size={14} />
                            <span>Class Updates</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Resource categories */}
                    {CATEGORIES.map(cat => (
                      <CategorySection
                        key={cat}
                        title={cat}
                        materials={group.materials.filter((m: any) => m.category === cat)}
                      />
                    ))}

                    {/* Fallback if nothing at all */}
                    {group.materials.length === 0 && !group.classUpdates && group.sections.length === 0 && (
                      <div className="no-links">No course materials available for this batch yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Drive UI styles */}
      <style jsx>{`
        .drive-folder-item {
          margin: 4px 0;
        }
        .drive-folder-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .drive-folder-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--primary-blue);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          padding: 5px 8px;
          border-radius: 6px;
          transition: background 0.15s;
          flex: 1;
          min-width: 0;
        }
        .drive-folder-link:hover {
          background: rgba(37, 99, 235, 0.07);
        }
        .drive-folder-link.plain-link {
          color: var(--primary-blue);
        }
        .drive-expand-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: 1px solid var(--border);
          border-radius: 5px;
          background: var(--surface);
          cursor: pointer;
          color: var(--muted);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .drive-expand-btn:hover,
        .drive-expand-btn.open {
          background: var(--primary-blue);
          border-color: var(--primary-blue);
          color: #fff;
        }
        .drive-folder-contents {
          margin: 4px 0 4px 24px;
          padding-left: 12px;
          border-left: 2px solid var(--border);
        }
        .drive-folder-error {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #b91c1c;
          padding: 4px 0;
        }
        .drive-folder-empty {
          font-size: 12px;
          color: var(--muted);
          font-style: italic;
          padding: 4px 0;
          margin: 0;
        }
        .drive-file-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .drive-file-item {}
        .drive-file-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          color: var(--text-primary);
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 5px;
          transition: background 0.12s;
          max-width: 100%;
        }
        .drive-file-link:hover {
          background: var(--surface);
        }
        .drive-file-icon { flex-shrink: 0; }
        .drive-file-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .drive-file-ext {
          color: var(--muted);
          flex-shrink: 0;
        }
        .links-list {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
