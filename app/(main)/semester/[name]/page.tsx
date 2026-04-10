'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, Search, List as ListIcon, Rows3, GraduationCap, ChevronRight } from 'lucide-react';
import { getCoursesBySemesterName } from '@/lib/database';
import DriveFolderBrowser from '@/components/DriveFolderBrowser';

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Course Row (lighter than ResourceCard) ───────────────────────────────────
function CourseRow({ item }: { item: any }) {
  const course = item.courses;
  const sections: any[] = item.sections || [];
  const sorted = [...sections].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-surface-low transition-colors group border-b border-outline-variant/10 last:border-0">
      {/* Course info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-md tracking-widest shrink-0">
          {course?.code}
        </span>
        <Link
          href={`/courses/${course?.code}`}
          className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate group-hover:underline"
          title={course?.title}
        >
          {course?.title}
        </Link>
      </div>
      {/* Teacher pills */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-1 shrink-0">
          {sorted.map((sec: any) => (
            <span
              key={sec.name}
              className="inline-flex items-center gap-1 bg-surface-container border border-outline-variant/20 rounded-full pl-1.5 pr-2.5 py-0.5 text-[10px]"
            >
              <span className="font-bold text-muted">{sec.name}</span>
              <span className="text-on-surface font-medium">{sec.teachers?.name || 'TBA'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
function BatchCard({
  batchName, items, driveFolderId, semesterName,
}: {
  batchName: string;
  items: any[];
  driveFolderId?: string;
  semesterName: string;
}) {
  return (
    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden mb-5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface border-b border-outline-variant/20">
        <h2 className="text-base font-bold text-on-surface">Batch {batchName}</h2>
      </div>

      {/* Course list */}
      <div className="px-2 py-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No courses match your search.</p>
        ) : (
          items.map((item: any) => (
            <CourseRow key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Live Drive folder browser */}
      {driveFolderId && (
        <div className="px-4 pb-4 pt-2 border-t border-outline-variant/10 mt-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
            📂 Batch Drive Resources
          </p>
          <div className="bg-surface rounded-xl border border-outline-variant/20 px-3 py-2">
            <DriveFolderBrowser
              folderId={driveFolderId}
              label={`Batch ${batchName} — ${semesterName} Semester`}
              defaultOpen={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SemesterPage() {
  const params = useParams();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const label = name ? (ORDINAL[name] ?? name) : '';
  const title = `${label} Semester`;
  const desc = name ? (PAGE_DESC[name] ?? `Resources for ${title} across all batches.`) : '';
  const isMBA = name?.startsWith('mba');

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tabbed'>('tabbed');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('semesterViewMode');
    if (saved === 'list' || saved === 'tabbed') setViewMode(saved);
  }, []);

  const handleViewModeChange = (mode: 'list' | 'tabbed') => {
    setViewMode(mode);
    localStorage.setItem('semesterViewMode', mode);
  };

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    getCoursesBySemesterName(name)
      .then(setCourses)
      .catch((err: any) => setError(err.message ?? 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, [name]);

  // Filter by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const lower = searchQuery.toLowerCase();
    return courses.filter(c => {
      const code  = c.courses?.code?.toLowerCase() || '';
      const ctitle = c.courses?.title?.toLowerCase() || '';
      const teacher = c.sections?.some((s: any) =>
        s.teachers?.name?.toLowerCase().includes(lower)
      );
      return code.includes(lower) || ctitle.includes(lower) || teacher;
    });
  }, [courses, searchQuery]);

  // Unique subjects for top pills
  const uniqueSubjects = useMemo(() => {
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

  // Group by batch
  const batchGroups = useMemo(() => {
    const map = new Map<string, { batchId: string; batchName: string; driveFolderId?: string; items: any[] }>();
    for (const item of filteredCourses) {
      const batchId   = item.semesters?.batches?.id   ?? 'unknown';
      const batchName = item.semesters?.batches?.name ?? 'Unknown Batch';
      const driveId   = item.semesters?.drive_folder_id;
      if (!map.has(batchId)) map.set(batchId, { batchId, batchName, driveFolderId: driveId, items: [] });
      map.get(batchId)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ai = parseInt(a.batchName), bi = parseInt(b.batchName);
      return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
    });
  }, [filteredCourses]);

  // Select initial batch
  useEffect(() => {
    if (batchGroups.length > 0 &&
      (!activeBatchId || !batchGroups.find(g => g.batchId === activeBatchId))) {
      setActiveBatchId(batchGroups[0].batchId);
    }
  }, [batchGroups, activeBatchId]);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <main className="max-w-screen-md mx-auto px-4 pt-4 pb-24">

        {/* ── Breadcrumbs ──────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} className="text-muted/50" />
          <span className="text-on-surface font-semibold">{title}</span>
        </nav>

        {/* ── Page Intro ───────────────────────────────────────────────── */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 flex items-center flex-shrink-0 justify-center rounded-2xl text-white font-bold text-lg shadow-lg ${
              isMBA
                ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-600/25'
                : 'bg-gradient-to-br from-primary to-blue-800 shadow-primary/25'
            }`}>
              {label.includes('MBA') ? 'M' : label.replace(/\D/g, '')}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">{title}</h1>
              <p className="text-sm text-muted mt-0.5">{desc}</p>
            </div>
          </div>

          {/* Subject quick-link pills */}
          {uniqueSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {uniqueSubjects.map(course => (
                <Link
                  key={course.code}
                  href={`/courses/${course.code}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-lowest border border-outline-variant/30 text-xs font-medium text-on-surface rounded-full hover:border-primary/40 hover:text-primary transition-colors shadow-ambient-subtle"
                  title={course.title}
                >
                  <span className="font-bold text-muted">{course.code}</span>
                  <span className="truncate max-w-[150px]">{course.title}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Toolbar: Search + View toggle + Faculty link */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-surface-lowest p-3 rounded-2xl shadow-ambient border border-outline-variant/20">
            {/* Search */}
            <div className="relative flex-1 focus-within:ring-2 ring-primary/20 rounded-xl transition-all">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
              <input
                type="text"
                placeholder="Find a course or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface text-sm border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2 outline-none text-on-surface placeholder:text-muted transition-colors focus:border-primary/40"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-outline-variant/20">
                <button
                  onClick={() => handleViewModeChange('tabbed')}
                  className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'tabbed' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-on-surface'
                  }`}
                  title="Tabbed view"
                >
                  <Rows3 size={13} /> Tabs
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-on-surface'
                  }`}
                  title="Full list view"
                >
                  <ListIcon size={13} /> All
                </button>
              </div>

              {/* Faculty link */}
              <Link
                href="/teachers"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted border border-outline-variant/20 rounded-lg hover:text-primary hover:border-primary/30 transition-colors bg-surface"
                title="Faculty Directory"
              >
                <GraduationCap size={14} />
                <span className="hidden sm:inline">Faculty</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Loading & Errors ─────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-sm mb-6">
            <p className="font-semibold mb-1">Could not load resources</p>
            {error}
          </div>
        )}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="bg-surface-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl py-16 px-8 text-center">
            <p className="text-muted font-medium mb-3">No courses found matching your search.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary font-semibold hover:underline text-sm"
            >
              Clear search
            </button>
          </div>
        )}

        {/* ── Main Content ─────────────────────────────────────────────── */}
        {!loading && !error && batchGroups.length > 0 && (
          <div className="animate-in fade-in duration-500 delay-100 fill-mode-both">

            {/* Tabbed view */}
            {viewMode === 'tabbed' && activeBatchId && (
              <>
                {/* Batch tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-5 pb-1">
                  {batchGroups.map(group => (
                    <button
                      key={group.batchId}
                      onClick={() => setActiveBatchId(group.batchId)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all shrink-0 ${
                        activeBatchId === group.batchId
                          ? 'bg-on-surface text-surface shadow-md'
                          : 'bg-surface-lowest text-muted border border-outline-variant/30 hover:border-outline-variant hover:text-on-surface'
                      }`}
                    >
                      {group.batchName}
                    </button>
                  ))}
                </div>

                {(() => {
                  const activeGroup = batchGroups.find(g => g.batchId === activeBatchId);
                  if (!activeGroup) return null;
                  return (
                    <div className="animate-in slide-in-from-right-2 fade-in duration-200">
                      <BatchCard
                        batchName={activeGroup.batchName}
                        items={activeGroup.items}
                        driveFolderId={activeGroup.driveFolderId}
                        semesterName={label}
                      />
                    </div>
                  );
                })()}
              </>
            )}

            {/* List view */}
            {viewMode === 'list' && (
              <div className="space-y-5">
                {batchGroups.map(group => (
                  <BatchCard
                    key={group.batchId}
                    batchName={group.batchName}
                    items={group.items}
                    driveFolderId={group.driveFolderId}
                    semesterName={label}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
