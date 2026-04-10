'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2, ExternalLink, ChevronRight, AlertCircle,
  FileText, Users, GraduationCap
} from 'lucide-react';
import { getCourseDetails } from '@/lib/database';
import { extractFolderId, fileLink, mimeIcon } from '@/lib/drive';
import DriveFolderBrowser from '@/components/DriveFolderBrowser';

// ─── Semester key → URL slug helper ──────────────────────────────────────────
function semesterSlug(semName: string): string {
  // semName might be "1st", "2nd", "mba-1st" etc.
  return semName.toLowerCase().replace(/\s+/g, '-');
}

// ─── Compact Teacher/Section Pills ────────────────────────────────────────────
function TeacherPills({ sections }: { sections: any[] }) {
  if (!sections || sections.length === 0) return null;
  const sorted = [...sections].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((sec: any) => (
        <span
          key={sec.name}
          className="inline-flex items-center gap-1.5 bg-surface-container border border-outline-variant/30 rounded-full pl-2 pr-3 py-1 text-xs"
        >
          <span className="font-bold text-muted text-[10px] shrink-0">{sec.name}</span>
          <span className="text-on-surface font-medium">{sec.teachers?.name || 'TBA'}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Manual Resource Link (not Drive folder) ──────────────────────────────────
function ResourceLinkItem({ m }: { m: any }) {
  const fid = extractFolderId(m.url);
  if (fid) {
    return (
      <div className="py-1">
        <DriveFolderBrowser folderId={fid} label={m.title || 'Drive Folder'} />
      </div>
    );
  }
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface-low rounded-lg transition-colors"
    >
      <FileText size={14} className="flex-shrink-0" />
      <span className="truncate">{m.title || 'Resource'}</span>
      <ExternalLink size={11} className="flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" />
    </a>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
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
    <div className="mb-3">
      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
        <span>{CATEGORY_ICONS[title] ?? '📄'}</span> {title}
      </p>
      <div className="flex flex-col">
        {materials.map((m: any) => (
          <ResourceLinkItem key={m.id} m={m} />
        ))}
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
      } else {
        // Merge sections from multiple occurrences of same batch (edge case)
        const existing = groups.get(batchName)!;
        existing.sections = [...existing.sections, ...occ.sections || []];
        existing.materials = [...existing.materials, ...occ.resource_links || []];
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

  // Primary semester for breadcrumb
  const primarySemester = batchGroups[0]?.semester;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  if (error || !course) return (
    <div className="min-h-[60vh] p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
        <AlertCircle className="w-7 h-7 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold">Failed to load</h3>
        <p className="text-sm mt-1">{error || 'Course not found'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <main className="max-w-screen-md mx-auto px-4 pt-4 pb-24">

        {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 flex-wrap text-xs text-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} className="text-muted/50" />
          {primarySemester && (
            <>
              <Link
                href={`/semester/${semesterSlug(primarySemester)}`}
                className="hover:text-primary transition-colors"
              >
                {primarySemester} Semester
              </Link>
              <ChevronRight size={12} className="text-muted/50" />
            </>
          )}
          <span className="text-on-surface font-semibold">{course.code}</span>
        </nav>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-3 mb-3">
            <span className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider shadow-sm shadow-primary/20 shrink-0 mt-0.5">
              {course.code}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface leading-tight">
              {course.title}
            </h1>
          </div>
          {course.description && (
            <p className="text-muted leading-relaxed max-w-lg text-sm mt-2">
              {course.description}
            </p>
          )}

          {/* Cross-link to teachers page */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-lowest border border-outline-variant/30 rounded-full text-xs font-semibold text-muted hover:text-primary hover:border-primary/30 transition-colors"
            >
              <GraduationCap size={13} /> Faculty Directory
            </Link>
          </div>
        </div>

        {/* ── Batch sections ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {batchGroups.length === 0 ? (
            <div className="bg-surface-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl py-12 px-8 text-center text-muted font-medium">
              No batch data available for this course yet.
            </div>
          ) : batchGroups.map((group, index) => {

            const hasManualMaterials = CATEGORIES.some(cat =>
              group.materials.filter((m: any) => m.category === cat).length > 0
            );

            return (
              <section
                key={group.name}
                className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both bg-surface-lowest rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* ── Batch Header ────────────────────────────────────── */}
                <div className="px-5 py-4 bg-surface border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-base font-bold text-on-surface">Batch {group.name}</h2>
                      {group.semester && (
                        <Link
                          href={`/semester/${semesterSlug(group.semester)}`}
                          className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
                        >
                          {group.semester} Semester ↗
                        </Link>
                      )}
                    </div>
                    {/* Teacher pills — compact inline */}
                    {group.sections.length > 0 && (
                      <TeacherPills sections={group.sections} />
                    )}
                  </div>

                  {/* Class updates */}
                  {group.classUpdates && (
                    <a
                      href={group.classUpdates}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-3 py-1.5 rounded-full transition-colors shrink-0 w-fit"
                    >
                      📢 Class Updates
                    </a>
                  )}
                </div>

                {/* ── Body ────────────────────────────────────────────── */}
                <div className="p-4">

                  {/* Live Drive folder browser — primary resource */}
                  {group.driveId && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2 px-1">
                        📂 Drive Resources
                      </p>
                      <div className="bg-surface rounded-xl border border-outline-variant/20 px-3 py-2">
                        <DriveFolderBrowser
                          folderId={group.driveId}
                          label={`Batch ${group.name} — ${group.semester ?? ''} Semester`}
                          defaultOpen={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Manual resource_links (supplementary, non-Drive or Drive URLs from DB) */}
                  {hasManualMaterials && (
                    <div className="bg-surface rounded-xl border border-outline-variant/20 px-3 py-3">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2 px-1">
                        🔗 Curated Links
                      </p>
                      {CATEGORIES.map(cat => (
                        <CategorySection
                          key={cat}
                          title={cat}
                          materials={group.materials.filter((m: any) => m.category === cat)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Fallback */}
                  {!group.driveId && !hasManualMaterials && !group.classUpdates && (
                    <div className="py-8 text-center text-muted text-sm bg-surface rounded-xl border border-dashed border-outline-variant/30">
                      No materials attached to this batch yet.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

      </main>
    </div>
  );
}
