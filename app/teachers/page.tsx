'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Loader2, 
  ArrowLeft, 
  User, 
  Book, 
  Phone, 
  Mail, 
  Linkedin, 
  Facebook, 
  ExternalLink,
  Search,
  Filter,
  GraduationCap,
  Users,
  AlertCircle
} from 'lucide-react';
import { getTeacherProfiles, getBatches } from '@/lib/database';

export default function TeachersPage() {
  const [activeTab, setActiveTab] = useState<'batch' | 'course' | 'teacher'>('teacher');
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
        semesters: Array.from(b.semesters.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)) 
      }))
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
      return data.teachers.map((t: any) => ({
        ...t,
        courses: t.courses.filter((c: any) => isMatched(t.name, c.code, c.batch, c.semester))
      })).filter((t: any) => t.courses.length > 0);
    }

    if (activeTab === 'course') {
      return data.courses.map((c: any) => ({
        ...c,
        occurrences: c.occurrences.filter((o: any) => isMatched(o.teacher, c.code, o.batch, o.semester))
      })).filter((c: any) => c.occurrences.length > 0);
    }

    return data.batches.map((b: any) => ({
      ...b,
      semesters: b.semesters.map((s: any) => ({
        ...s,
        courses: s.courses.filter((c: any) => isMatched(c.teacher, c.code, b.name, s.name))
      })).filter((s: any) => s.courses.length > 0)
    })).filter((b: any) => b.semesters.length > 0);

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
    <div className="min-h-screen bg-gray-50/50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all">
        <div className="max-w-screen-xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg transform hover:rotate-6 transition-transform">🎓</div>
            <span className="font-bold text-gray-900 tracking-tight">Academic Resort</span>
          </Link>
          <div className="flex gap-4">
             <Link href="/" className="text-sm font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-2">
               <Home size={16} /> Home
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-28 pb-16">
        <section className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 font-bold uppercase tracking-widest transition-all mb-4">
            <ArrowLeft size={16} /> Back to Search
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-blue-100">📋</div>
                 <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">Faculty Directory</h1>
              </div>
              <p className="text-lg text-gray-500 font-medium">Explore academic profiles across all batches and semesters.</p>
            </div>
            
            <div className="flex gap-2">
               {(['teacher', 'course', 'batch'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200 hover:bg-blue-50'}`}
                 >
                   {tab === 'teacher' ? <User size={16} /> : tab === 'course' ? <Book size={16} /> : <GraduationCap size={16} />}
                   <span className="capitalize">{tab} View</span>
                 </button>
               ))}
            </div>
          </div>
        </section>

        {/* Global Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-8 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="Search by teacher name or course code..."
               className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-medium text-gray-700"
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="lg:col-span-4 flex items-center gap-3">
             <div className="flex-1 relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-within:text-blue-500" size={18} />
                <select 
                  className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none appearance-none font-bold text-xs uppercase tracking-widest text-gray-500"
                  value={selectedBatch} 
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                   <option value="all">Every Batch</option>
                   {batches.map(b => <option key={b.id} value={b.name}>{b.name} Batch</option>)}
                </select>
             </div>
             {isFiltered && (
               <button onClick={resetFilters} className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95" title="Reset Filters">
                 <Loader2 size={20} className={loading ? 'animate-spin' : ''} />
               </button>
             )}
          </div>
        </div>

        {loading && <div className="flex flex-col items-center justify-center py-32 gap-4"><Loader2 size={40} className="animate-spin text-blue-500" /><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Compiling Directory...</p></div>}
        {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-8 font-bold flex items-center gap-3 shadow-lg"><AlertCircle size={24}/> {error}</div>}

        {!loading && !error && (
          <div className="space-y-8">
            {activeTab === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((teacher: any) => (
                  <div key={teacher.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col hover:shadow-xl hover:border-blue-100 transition-all group animate-in zoom-in-95">
                    <div className="flex flex-col items-center mb-8 text-center pt-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 font-bold text-3xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-inner">
                        {teacher.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight mb-2">{teacher.name}</h3>
                      {teacher.du_profile && (
                        <a href={teacher.du_profile} target="_blank" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all">
                          University Profile <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {teacher.email && (
                        <a href={`mailto:${teacher.email}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-all group/link border border-transparent hover:border-blue-100">
                          <Mail size={16} className="text-gray-400 group-hover/link:text-blue-500" />
                          <span className="text-xs font-bold text-gray-600 group-hover/link:text-blue-700 truncate">Email</span>
                        </a>
                      )}
                      {teacher.linkedin && (
                        <a href={teacher.linkedin} target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-all group/link border border-transparent hover:border-blue-100">
                          <Linkedin size={16} className="text-blue-500" />
                          <span className="text-xs font-bold text-gray-600 group-hover/link:text-blue-700">LinkedIn</span>
                        </a>
                      )}
                      {teacher.facebook && (
                        <a href={teacher.facebook} target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-all group/link border border-transparent hover:border-blue-100">
                          <Facebook size={16} className="text-indigo-600" />
                          <span className="text-xs font-bold text-gray-600 group-hover/link:text-indigo-700">Facebook</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-auto space-y-3">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Course Assignments</p>
                       <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {teacher.courses.map((course: any, idx: number) => (
                          <Link key={idx} href={`/courses/${course.code}`} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-blue-50 hover:border-blue-100 transition-all group/course">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-extrabold text-blue-600 mb-0.5">{course.code}</span>
                              <span className="text-xs font-bold text-gray-700 leading-tight group-hover/course:text-blue-700 transition-colors">{course.title}</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section {course.section}</span>
                               <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm text-gray-500 uppercase">{course.batch} Batch</span>
                            </div>
                          </Link>
                         ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'course' && (
               <div className="space-y-6">
                 {filtered.map((course: any) => (
                   <div key={course.code} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                     <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Book size={120} />
                       </div>
                       <div className="relative z-10">
                         <Link href={`/courses/${course.code}`} className="text-[10px] font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm transition-colors">{course.code} ↗</Link>
                         <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{course.title}</h3>
                       </div>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/20">
                       {course.occurrences.map((occ: any, idx: number) => (
                         <div key={idx} className="flex flex-col p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group/item">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover/item:bg-blue-600 group-hover/item:text-white transition-all transform group-hover/item:rotate-6">
                                {occ.teacher.charAt(0)}
                              </div>
                              <span className="text-[9px] font-bold bg-gray-50 px-2 py-1 rounded-lg text-gray-400 uppercase tracking-widest">{occ.batch} Batch</span>
                           </div>
                           <h4 className="font-bold text-gray-900 mb-1 group-hover/item:text-blue-600 transition-colors">{occ.teacher}</h4>
                           <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-auto underline decoration-blue-500/20 underline-offset-4 decoration-2">Section {occ.section} • {occ.semester} </p>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {activeTab === 'batch' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filtered.map((batch: any) => (
                  <div key={batch.name} className="space-y-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                       <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{batch.name} Batch Archive</h2>
                       <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-gray-200">{batch.name.charAt(0)}</div>
                    </div>
                    {batch.semesters.map((sem: any) => (
                      <div key={sem.name} className="hover:bg-gray-50/50 rounded-2xl p-2 transition-all">
                        <Link href={`/semester/${sem.name.toLowerCase()}`} className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50/50 hover:bg-blue-100/80 rounded-xl inline-block mb-4 transition-colors">{sem.name} Semester ↗</Link>
                        <div className="space-y-3">
                          {sem.courses.map((c: any, idx: number) => (
                            <Link key={idx} href={`/courses/${c.code}`} className="flex justify-between items-center text-sm p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 hover:bg-blue-50/30 group transition-all">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{c.title}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">({c.code})</span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-700 text-xs">{c.teacher}</p>
                                <p className="text-[9px] font-extrabold text-gray-300 uppercase tracking-tighter">Sec: {c.section}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-32 text-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                   <Users size={40} />
                </div>
                <p className="text-lg font-bold tracking-tight mb-2">No Match Found</p>
                <p className="text-sm font-medium">Try searching for a different teacher or check your filters.</p>
                <button onClick={resetFilters} className="mt-8 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95">Clear All Filters</button>
              </div>
            )}
          </div>
        )}

        <footer className="mt-24 pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between gap-8 group">
          <div className="max-w-md">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-xs">🎓</div>
                <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Faculty Directory Access</span>
             </div>
             <p className="text-sm text-gray-500 font-medium leading-relaxed">
               For official updates and detailed research portfolios, please visit our department's faculty portal:
             </p>
             <a href="https://du.ac.bd/body/FacultyMembers/ACC" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline block mt-2 text-sm">
               AIS Department Portal <ExternalLink size={14} className="inline ml-1 opacity-50" />
             </a>
          </div>
          <div className="flex flex-col justify-end text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</p>
              <p className="text-sm font-bold text-gray-900 tracking-tight">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
