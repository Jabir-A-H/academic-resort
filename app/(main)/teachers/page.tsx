'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Book, 
  Mail, 
  Linkedin, 
  Facebook, 
  ExternalLink,
  Search,
  GraduationCap,
  Users,
  AlertCircle,
  X,
  ChevronDown
} from 'lucide-react';
import { getTeacherProfiles, getBatches, getSiteConfig } from '@/lib/database';

// Semester ordering for consistent display
const SEMESTER_ORDER = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 'mba-1st', 'mba-2nd'];

function semesterSortKey(name: string): number {
  const idx = SEMESTER_ORDER.indexOf(name);
  return idx >= 0 ? idx : 999;
}

function semesterDisplayName(name: string): string {
  if (name.startsWith('mba-')) return `MBA ${name.replace('mba-', '').charAt(0).toUpperCase() + name.replace('mba-', '').slice(1)} Semester`;
  return `${name} Semester`;
}

export default function TeachersPage() {
  const [activeTab, setActiveTab] = useState<'batch' | 'course' | 'teacher'>('course');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, batchData, config] = await Promise.all([
          getTeacherProfiles(),
          getBatches(),
          getSiteConfig()
        ]);
        setProfiles(profileData);
        setBatches(batchData);
        setSiteConfig(config);
      } catch (err: any) {
        setError(err.message || 'Failed to load teachers');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ─── Data Extraction ────────────────────────────────────────────────────────
  const data = useMemo(() => {
    const teachersMap = new Map();
    const coursesMap = new Map();
    const batchesMap = new Map();

    profiles.forEach(p => {
      const batchName = p.semesters?.batches?.name;
      const semName = p.semesters?.name;
      const courseCode = p.courses?.code;
      const courseTitle = p.courses?.title;

      p.sections?.forEach((sec: any) => {
        const teacher = sec.teachers;
        if (!teacher) return;

        // Teacher focused
        if (!teachersMap.has(teacher.id)) {
          teachersMap.set(teacher.id, { 
            id: teacher.id,
            name: teacher.name, 
            email: teacher.email,
            du_profile: teacher.du_profile_url,
            linkedin: teacher.linkedin_url,
            facebook: teacher.facebook_url,
            courses: [] 
          });
        }
        teachersMap.get(teacher.id).courses.push({
          code: courseCode, title: courseTitle, batch: batchName, semester: semName, section: sec.name
        });

        // Course focused
        if (!coursesMap.has(courseCode)) {
          coursesMap.set(courseCode, { code: courseCode, title: courseTitle, occurrences: [] });
        }
        coursesMap.get(courseCode).occurrences.push({
          teacher: teacher.name, batch: batchName, semester: semName, section: sec.name
        });

        // Batch focused
        if (!batchesMap.has(batchName)) {
          batchesMap.set(batchName, { name: batchName, semesters: new Map() });
        }
        const b = batchesMap.get(batchName);
        if (!b.semesters.has(semName)) b.semesters.set(semName, { name: semName, courses: [] });
        b.semesters.get(semName).courses.push({
          code: courseCode, title: courseTitle, teacher: teacher.name, section: sec.name
        });
      });
    });

    return {
      teachers: Array.from(teachersMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)),
      courses: Array.from(coursesMap.values()).sort((a: any, b: any) => a.code.localeCompare(b.code)),
      batches: Array.from(batchesMap.values()).sort((a: any, b: any) => {
        const ai = parseInt(a.name); const bi = parseInt(b.name);
        return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
      }).map((b: any) => ({ 
        ...b, 
        semesters: Array.from(b.semesters.values()).sort((a: any, b: any) => semesterSortKey(a.name) - semesterSortKey(b.name)) 
      }))
    };
  }, [profiles]);

  // ─── Fuzzy filtering ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    
    const isMatched = (tName: string, cCode: string, cTitle: string, bName: string) => {
      const matchesBatch = selectedBatch === 'all' || bName === selectedBatch;
      if (!matchesBatch) return false;
      if (!search) return true;
      return tName.toLowerCase().includes(search) || 
             cCode.toLowerCase().includes(search) ||
             cTitle.toLowerCase().includes(search);
    };

    if (activeTab === 'teacher') {
      return data.teachers.map((t: any) => ({
        ...t,
        courses: t.courses.filter((c: any) => isMatched(t.name, c.code, c.title, c.batch))
      })).filter((t: any) => t.courses.length > 0);
    }

    if (activeTab === 'course') {
      return data.courses.map((c: any) => ({
        ...c,
        occurrences: c.occurrences.filter((o: any) => isMatched(o.teacher, c.code, c.title, o.batch))
      })).filter((c: any) => c.occurrences.length > 0);
    }

    return data.batches.map((b: any) => ({
      ...b,
      semesters: b.semesters.map((s: any) => ({
        ...s,
        courses: s.courses.filter((c: any) => isMatched(c.teacher, c.code, c.title, b.name))
      })).filter((s: any) => s.courses.length > 0)
    })).filter((b: any) => b.semesters.length > 0);

  }, [data, activeTab, searchTerm, selectedBatch]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBatch('all');
  };

  const isFiltered = searchTerm !== '' || selectedBatch !== 'all';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-16">
      {/* Page Header */}
      <section className="mb-8 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary font-bold uppercase tracking-widest transition-all mb-4">
          <ArrowLeft size={14} /> Back to Search
        </Link>
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight leading-tight font-display">Faculty Directory</h1>
            <p className="text-sm text-muted font-medium">Course teachers across all batches and semesters.</p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-sm pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-outline-variant/10 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search teacher, course code, or title..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-lowest border border-outline-variant/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-on-surface"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-on-surface transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Batch Filter */}
          <div className="relative">
            <select 
              className="pl-4 pr-8 py-2.5 bg-surface-lowest border border-outline-variant/30 rounded-xl text-sm outline-none appearance-none font-bold text-muted w-full sm:w-auto min-w-[160px]"
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="all">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.name}>{b.name} Batch</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          {/* View Tabs */}
          <div className="flex gap-1 bg-surface-container rounded-xl p-1">
            {(['course', 'teacher', 'batch'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab 
                    ? 'bg-surface-lowest text-primary shadow-ambient-subtle' 
                    : 'text-muted hover:text-on-surface'
                }`}
              >
                {tab === 'teacher' ? <User size={13} /> : tab === 'course' ? <Book size={13} /> : <GraduationCap size={13} />}
                <span className="capitalize hidden sm:inline">{tab}</span>
              </button>
            ))}
          </div>

          {isFiltered && (
            <button onClick={resetFilters} className="px-3 py-2 text-xs font-bold text-error hover:bg-error/5 rounded-lg transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-muted font-bold uppercase text-[10px] tracking-widest">Loading Directory...</p>
        </div>
      )}

      {error && (
        <div className="bg-error/5 border border-error/20 text-error rounded-2xl p-6 font-bold flex items-center gap-3">
          <AlertCircle size={20}/> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* ═══ COURSE VIEW (Default) ═══ */}
          {activeTab === 'course' && (
            <div className="space-y-4">
              {filtered.map((course: any) => (
                <div key={course.code} className="bg-surface-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-ambient-subtle hover:shadow-ambient transition-shadow">
                  {/* Course Header */}
                  <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/courses/${course.code}`} className="text-[10px] font-extrabold text-primary bg-primary/8 hover:bg-primary/15 px-2.5 py-1 rounded-md uppercase tracking-widest transition-colors">
                        {course.code}
                      </Link>
                      <Link href={`/courses/${course.code}`} className="text-sm sm:text-base font-bold text-on-surface tracking-tight hover:text-primary transition-colors">
                        {course.title}
                      </Link>
                    </div>
                    <span className="text-[10px] text-muted font-bold">{course.occurrences.length} assignment{course.occurrences.length !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Teacher List - clean table-like layout */}
                  <div className="divide-y divide-outline-variant/10">
                    {course.occurrences.map((occ: any, idx: number) => (
                      <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-surface-low/50 transition-colors text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 bg-surface-container text-muted rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                            {occ.section}
                          </span>
                          <span className="font-medium text-on-surface truncate">{occ.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{occ.batch}</span>
                          <span className="text-outline-variant">·</span>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{semesterDisplayName(occ.semester).replace(' Semester', '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ TEACHER VIEW ═══ */}
          {activeTab === 'teacher' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((teacher: any) => (
                <div key={teacher.id} className="bg-surface-lowest rounded-xl border border-outline-variant/20 shadow-ambient-subtle hover:shadow-ambient transition-shadow overflow-hidden">
                  {/* Teacher header */}
                  <div className="px-5 py-4 border-b border-outline-variant/10 flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-on-surface tracking-tight text-sm leading-tight">{teacher.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {teacher.du_profile && (
                          <a href={teacher.du_profile} target="_blank" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                            DU Profile <ExternalLink size={9} />
                          </a>
                        )}
                        {teacher.email && (
                          <a href={`mailto:${teacher.email}`} className="text-muted hover:text-primary transition-colors p-0.5"><Mail size={12} /></a>
                        )}
                        {teacher.linkedin && (
                          <a href={teacher.linkedin} target="_blank" className="text-muted hover:text-primary transition-colors p-0.5"><Linkedin size={12} /></a>
                        )}
                        {teacher.facebook && (
                          <a href={teacher.facebook} target="_blank" className="text-muted hover:text-secondary transition-colors p-0.5"><Facebook size={12} /></a>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Course list */}
                  <div className="divide-y divide-outline-variant/10 max-h-[240px] overflow-y-auto hide-scrollbar">
                    {teacher.courses.map((course: any, idx: number) => (
                      <Link key={idx} href={`/courses/${course.code}`} className="px-5 py-2.5 flex items-center justify-between hover:bg-surface-low/50 transition-colors text-sm group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-extrabold text-primary">{course.code}</span>
                          <span className="text-xs text-on-surface truncate group-hover:text-primary transition-colors">{course.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[9px] font-bold text-muted uppercase">{course.batch} · Sec {course.section}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ BATCH VIEW ═══ */}
          {activeTab === 'batch' && (
            <div className="space-y-6">
              {filtered.map((batch: any) => (
                <div key={batch.name} className="bg-surface-lowest rounded-xl border border-outline-variant/20 shadow-ambient-subtle overflow-hidden">
                  <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-low/30">
                    <h2 className="text-lg font-bold text-on-surface tracking-tight font-display">{batch.name} Batch</h2>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{batch.semesters.length} semesters</span>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {batch.semesters.map((sem: any) => (
                      <div key={sem.name}>
                        <Link href={`/semester/${sem.name}`} className="px-5 py-2.5 text-[10px] font-extrabold text-primary uppercase tracking-widest bg-primary/3 hover:bg-primary/8 block transition-colors">
                          {semesterDisplayName(sem.name)} →
                        </Link>
                        <div className="divide-y divide-outline-variant/5">
                          {sem.courses.map((c: any, idx: number) => (
                            <Link key={idx} href={`/courses/${c.code}`} className="px-5 py-2.5 flex items-center justify-between hover:bg-surface-low/50 transition-colors text-sm group">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-extrabold text-primary">{c.code}</span>
                                <span className="text-xs text-on-surface truncate group-hover:text-primary transition-colors">{c.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-xs font-medium text-on-surface">{c.teacher}</span>
                                <span className="w-5 h-5 bg-surface-container text-muted rounded text-[9px] font-bold flex items-center justify-center">{c.section}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="bg-surface-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-16 sm:p-24 text-center text-muted">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <Users size={32} />
              </div>
              <p className="text-base font-bold tracking-tight mb-1 text-on-surface">No Results Found</p>
              <p className="text-sm font-medium mb-6">Try a different search term or adjust filters.</p>
              <button onClick={resetFilters} className="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all shadow-ambient active:scale-95 text-sm">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between gap-6">
        <div className="max-w-sm">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Faculty Resources</p>
          <p className="text-xs text-muted leading-relaxed mb-2">
            For official profiles and research portfolios, visit the department portal.
          </p>
          <a 
            href={siteConfig.department_url || 'https://du.ac.bd/body/FacultyMembers/ACC'} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary font-bold hover:underline text-xs inline-flex items-center gap-1"
          >
            {siteConfig.department_name || 'A&IS Department'} <ExternalLink size={11} />
          </a>
        </div>
        <div className="flex flex-col justify-end text-right">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Directory</p>
          <p className="text-xs font-bold text-on-surface tracking-tight">{data.teachers.length} teachers · {data.courses.length} courses</p>
        </div>
      </footer>
    </div>
  );
}
