'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Home, Loader2, ArrowLeft, User, Book } from 'lucide-react';
import { getTeacherProfiles, getBatches } from '@/lib/database';

export default function TeachersPage() {
  const [activeTab, setActiveTab] = useState<'batch' | 'course' | 'teacher'>('course');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, batchData] = await Promise.all([
          getTeacherProfiles(),
          getBatches()
        ]);
        setProfiles(profileData);
        setBatches(batchData);
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
        if (!teachersMap.has(teacher.name)) {
          teachersMap.set(teacher.name, { name: teacher.name, id: teacher.id, courses: [] });
        }
        teachersMap.get(teacher.name).courses.push({
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
      teachers: Array.from(teachersMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      courses: Array.from(coursesMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
      batches: Array.from(batchesMap.values()).sort((a, b) => {
        const ai = parseInt(a.name); const bi = parseInt(b.name);
        return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
      }).map(b => ({ ...b, semesters: Array.from(b.semesters.values()).sort((a, b) => a.name.localeCompare(b.name)) }))
    };
  }, [profiles]);

  // ─── Filtering Logic ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const isMatched = (tName: string, cCode: string, bName: string, sName: string) => {
      const matchesSearch = tName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           cCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBatch = selectedBatch === 'all' || bName === selectedBatch;
      const matchesSem = selectedSemester === 'all' || sName === selectedSemester;
      const matchesTeacher = selectedTeacher === 'all' || tName === selectedTeacher;
      const matchesCourse = selectedCourse === 'all' || cCode === selectedCourse;
      return matchesSearch && matchesBatch && matchesSem && matchesTeacher && matchesCourse;
    };

    if (activeTab === 'teacher') {
      return data.teachers.map(t => ({
        ...t,
        courses: t.courses.filter((c: any) => isMatched(t.name, c.code, c.batch, c.semester))
      })).filter(t => t.courses.length > 0);
    }

    if (activeTab === 'course') {
      return data.courses.map(c => ({
        ...c,
        occurrences: c.occurrences.filter((o: any) => isMatched(o.teacher, c.code, o.batch, o.semester))
      })).filter(c => c.occurrences.length > 0);
    }

    return data.batches.map(b => ({
      ...b,
      semesters: b.semesters.map((s: any) => ({
        ...s,
        courses: s.courses.filter((c: any) => isMatched(c.teacher, c.code, b.name, s.name))
      })).filter((s: any) => s.courses.length > 0)
    })).filter(b => b.semesters.length > 0);

  }, [data, activeTab, searchTerm, selectedBatch, selectedSemester, selectedTeacher, selectedCourse]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBatch('all');
    setSelectedSemester('all');
    setSelectedTeacher('all');
    setSelectedCourse('all');
  };

  const isFiltered = searchTerm !== '' || selectedBatch !== 'all' || selectedSemester !== 'all' || selectedTeacher !== 'all' || selectedCourse !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link flex items-center gap-1">
            <Home size={18} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft size={16} /> Back to Search
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center text-lg shadow">📋</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teachers' Profiles</h1>
                <p className="text-sm text-gray-500">Find teachers by course, batch, or semester</p>
              </div>
            </div>
            {isFiltered && (
              <button onClick={resetFilters} className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <span>↻</span> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="view-tabs flex gap-2 mb-6">
          {(['batch', 'course', 'teacher'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`view-tab px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              <span>{tab === 'batch' ? '📊' : tab === 'course' ? '📚' : '📋'}</span>
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Teacher or Course</label>
              <input 
                type="text" placeholder="Ex: Dr. Mamtaz..."
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Filter by Batch</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <option value="all">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Semester</label>
              <select className="w-full p-2 border-0 bg-transparent text-sm outline-none" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                <option value="all">All Semesters</option>
                {Array.from(new Set(profiles.map(p => p.semesters?.name))).sort().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Course</label>
              <select className="w-full p-2 border-0 bg-transparent text-sm outline-none" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="all">All Courses</option>
                {data.courses.map(c => <option key={c.code} value={c.code}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Teacher</label>
              <select className="w-full p-2 border-0 bg-transparent text-sm outline-none" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                <option value="all">All Teachers</option>
                {data.teachers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6">
            {activeTab === 'teacher' && filtered.map((teacher: any) => (
              <div key={teacher.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
                </div>
                <div className="space-y-3">
                  {teacher.courses.map((course: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{course.code}</span>
                        <span className="text-sm font-semibold text-gray-700">{course.title}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Sec {course.section}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">{course.batch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {activeTab === 'course' && filtered.map((course: any) => (
              <div key={course.code} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">{course.code}</div>
                  <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                </div>
                <div className="space-y-3">
                  {course.occurrences.map((occ: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium">
                      <span className="text-sm border-l-4 border-blue-500 pl-3">{occ.teacher}</span>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Sec {occ.section}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">{occ.batch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {activeTab === 'batch' && filtered.map((batch: any) => (
              <div key={batch.name} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 bg-gray-200 px-4 py-2 rounded-lg">{batch.name} Archive</h2>
                {batch.semesters.map((sem: any) => (
                  <div key={sem.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 font-bold text-blue-600 text-sm">{sem.name}</div>
                    <div className="p-4 space-y-2">
                      {sem.courses.map((c: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded transition-colors border-b border-gray-50 last:border-0">
                          <span className="font-semibold text-gray-700">{c.title} <span className="text-gray-400 font-normal ml-2">({c.code})</span></span>
                          <span className="text-gray-500">{c.teacher} <span className="text-xs bg-gray-100 px-1 rounded ml-1">S:{c.section}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
                No results found matching your criteria.
              </div>
            )}
          </div>
        )}

        <footer className="site-footer mt-16 pt-8 border-t border-gray-200">
          <p className="small text-gray-500 text-sm">
            Visit our department of Accounting &amp; Information Systems official website to get to know more about your course teachers:
            <a href="https://du.ac.bd/body/FacultyMembers/ACC" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mt-1">
              https://du.ac.bd/body/FacultyMembers/ACC
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
