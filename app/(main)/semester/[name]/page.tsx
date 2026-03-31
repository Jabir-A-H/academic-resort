'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { getCoursesBySemesterName } from '@/lib/database';
import ResourceCard from '@/components/ResourceCard';

const ORDINAL: Record<string, string> = {
  '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th',
  '5th': '5th', '6th': '6th', '7th': '7th', '8th': '8th',
  'mba-1st': 'MBA 1st', 'mba-2nd': 'MBA 2nd',
};

const PAGE_DESC: Record<string, string> = {
  '1st': 'Explore comprehensive resources for all 1st Semester courses. Your journey begins here.',
  '2nd': 'Resources and materials for 2nd Semester courses across all batches.',
  '3rd': 'Find organized resources for 3rd Semester — midpoint of BBA Year 2.',
  '4th': 'Resources for 4th Semester — wrapping up Year 2 of the BBA program.',
  '5th': 'All resources for 5th Semester — beginning of the final stretch.',
  '6th': 'Course materials and resources for 6th Semester.',
  '7th': 'Resources for 7th Semester — penultimate semester of BBA.',
  '8th': 'Final BBA semester resources. Finish strong!',
  'mba-1st': 'Resources for MBA 1st Semester courses across all batches.',
  'mba-2nd': 'Resources for MBA 2nd Semester — completing your MBA.',
};

// ─── TOC Accordion ────────────────────────────────────────────────────────────
function TocAccordion({ batchNames }: { batchNames: string[] }) {
  const [open, setOpen] = useState(false);
  if (batchNames.length === 0) return null;
  return (
    <div className="toc-accordion">
      <div className="toc-header" onClick={() => setOpen(s => !s)} role="button" tabIndex={0}>
        <h4>Batch Archives ({batchNames.length})</h4>
        <span className="toc-toggle" style={{ transform: open ? 'rotate(180deg)' : undefined }}>▾</span>
      </div>
      <ul className={`toc-content${open ? '' : ' hidden'}`}>
        {batchNames.map(name => (
          <li key={name}>
            <a href={`#batch-${name.replace(/\s+/g, '-')}`}>{name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Batch Drive Card ─────────────────────────────────────────────────────────
function BatchCard({
  batchId, batchName, items, driveFolderId,
}: {
  batchId: string; batchName: string; items: any[]; driveFolderId?: string;
}) {
  const safeId = batchName.replace(/\s+/g, '-');
  return (
    <div className="drive-batch-container" id={`batch-${safeId}`}>
      <div className="drive-embed-card">
        <div className="batch-header">
          <h2>{batchName}</h2>
          {driveFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${driveFolderId}`}
              target="_blank" rel="noopener noreferrer"
              className="root-folder-btn"
            >
              <ExternalLink size={12} /> Open Drive Folder
            </a>
          )}
        </div>
        <div className="batch-result-body">
          {items.map((item: any) => (
            <ResourceCard
              key={item.id}
              course={item.courses}
              semester={item.semesters?.name}
              batch={batchName}
              sections={item.sections}
              links={item.resource_links}
              classUpdatesUrl={item.class_updates_url}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SemesterPage() {
  const params = useParams();
  const name   = Array.isArray(params.name) ? params.name[0] : params.name;
  const label  = name ? (ORDINAL[name] ?? name) : '';
  const title  = `${label} Semester`;
  const desc   = name ? (PAGE_DESC[name] ?? `Resources for ${title} across all batches.`) : '';

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    getCoursesBySemesterName(name)
      .then(setCourses)
      .catch((err: any) => setError(err.message ?? 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, [name]);

  // ── Derive unique courses for subject cards ───────────────────────────────
  const uniqueCourses = React.useMemo(() => {
    const seen = new Set<string>();
    return courses
      .filter(c => {
        const code = c.courses?.code;
        if (!code || seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map(c => c.courses)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [courses]);

  // ── Group by batch ────────────────────────────────────────────────────────
  const batchGroups = React.useMemo(() => {
    const map = new Map<string, { batchId: string; batchName: string; driveFolderId?: string; items: any[] }>();
    for (const item of courses) {
      const batchId   = item.semesters?.batches?.id   ?? 'unknown';
      const batchName = item.semesters?.batches?.name ?? 'Unknown Batch';
      const driveId   = item.semesters?.drive_folder_id;
      if (!map.has(batchId)) map.set(batchId, { batchId, batchName, driveFolderId: driveId, items: [] });
      map.get(batchId)!.items.push(item);
    }
    // Sort newest batch first (by numeric part)
    return Array.from(map.values()).sort((a, b) => {
      const ai = parseInt(a.batchName);
      const bi = parseInt(b.batchName);
      return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
    });
  }, [courses]);

  const batchNames = batchGroups.map(g => g.batchName);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link">
            <Home size={16} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-24 pb-20">

        {/* ── Back + Page intro ────────────────────────────────────────── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'var(--muted)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-blue)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <ArrowLeft size={15} /> Back to Search
        </Link>

        <div className="page-intro">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44,
              background: name?.startsWith('mba') ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              flexShrink: 0,
            }}>
              {label.includes('MBA') ? 'M' : label.replace(/\D/g, '')}
            </div>
            <h1 className="page-title">{title}</h1>
          </div>
          <p>{desc}</p>

          {/* Subject cards */}
          {uniqueCourses.length > 0 && (
            <div className="subjects-grid">
              {uniqueCourses.map(course => (
                <Link key={course.code} href={`/courses/${course.code}`} className="subject-card">
                  <span className="subject-code">{course.code}</span>
                  <h3>{course.title}</h3>
                </Link>
              ))}
            </div>
          )}

          {/* Batch archives TOC */}
          <TocAccordion batchNames={batchNames} />
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary-blue)' }} />
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            borderRadius: 12, padding: '16px 20px', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && !error && courses.length === 0 && (
          <div style={{
            background: '#fff', border: '2px dashed var(--border)', borderRadius: 16,
            padding: '60px 32px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 12px' }}>
              No courses found for {title}.
            </p>
            <Link href="/" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
              Return to search
            </Link>
          </div>
        )}

        {/* ── Batch sections ────────────────────────────────────────────── */}
        {!loading && !error && batchGroups.map(group => (
          <BatchCard
            key={group.batchId}
            batchId={group.batchId}
            batchName={group.batchName}
            items={group.items}
            driveFolderId={group.driveFolderId}
          />
        ))}

      </main>

    </div>
  );
}
