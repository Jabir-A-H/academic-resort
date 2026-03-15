'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Plus, 
  Settings, 
  Users, 
  Link as LinkIcon, 
  Trash2,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import LinkImportModal from '@/components/LinkImportModal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'batches' | 'teachers'>('batches');
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeBatchCourseId, setActiveBatchCourseId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        loadData();
      }
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (selectedSemester) {
      loadSemesterData(selectedSemester.id);
    }
  }, [selectedSemester]);

  async function loadData() {
    const [bRes, tRes] = await Promise.all([
      supabase.from('batches').select('*, semesters(*)').order('name'),
      supabase.from('teachers').select('*').order('name')
    ]);
    setBatches(bRes.data || []);
    setTeachers(tRes.data || []);
  }

  async function loadSemesterData(semesterId: string) {
    const { data } = await supabase
      .from('batch_courses')
      .select(`
        *,
        courses(*),
        sections(*, teachers(*)),
        resource_links(*)
      `)
      .eq('semester_id', semesterId);
    setCourses(data || []);
  }

  async function handleTeacherChange(bcId: string, secName: string, teacherId: string) {
    const { data: existing } = await supabase
      .from('sections')
      .select('id')
      .eq('batch_course_id', bcId)
      .eq('name', secName)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('sections')
        .update({ teacher_id: teacherId || null })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('sections')
        .insert({
          batch_course_id: bcId,
          name: secName,
          teacher_id: teacherId || null
        });
    }
    if (selectedSemester) loadSemesterData(selectedSemester.id);
  }

  async function handleSaveLinks(links: Array<{ category: string, title: string, url: string }>) {
    if (!activeBatchCourseId) return;

    const { error } = await supabase
      .from('resource_links')
      .insert(links.map(l => ({
        batch_course_id: activeBatchCourseId,
        category: l.category,
        title: l.title,
        url: l.url
      })));

    if (error) {
      console.error('Save Links Error:', error);
      throw new Error(`Failed to save links: ${error.message}`);
    }
    
    if (selectedSemester) loadSemesterData(selectedSemester.id);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const categories = [
    'Class Notes',
    'Slides and Materials',
    'Books and Manuals',
    'Question Bank'
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <h1 className="font-bold text-gray-900 tracking-tight">Admin Panel</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => { setActiveTab('batches'); setSelectedSemester(null); }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'batches' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} /> Batches & Semesters
          </button>
          <button 
            onClick={() => { setActiveTab('teachers'); setSelectedSemester(null); }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'teachers' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={18} /> Teacher Registry
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {selectedSemester && (
                <button 
                  onClick={() => setSelectedSemester(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all mr-2"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedSemester ? `${selectedSemester.name} Semester` : (activeTab === 'batches' ? 'Batches Overview' : 'Teacher Registry')}
              </h2>
            </div>
            <p className="text-gray-500 text-sm">
              {selectedSemester ? 'Manage course assignments and resources.' : (activeTab === 'batches' ? 'Manage your academic structure.' : 'Manage the global directory of faculty members.')}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm">
            <Plus size={18} /> {selectedSemester ? 'Add Course' : (activeTab === 'batches' ? 'New Batch' : 'Add Teacher')}
          </button>
        </header>

        {selectedSemester ? (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-400">No courses added to this semester yet.</p>
                <button className="mt-4 text-blue-600 font-bold hover:underline">Add First Course</button>
              </div>
            ) : (
              courses.map(bc => (
                <div key={bc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{bc.courses.code}</span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{bc.courses.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setActiveBatchCourseId(bc.id); setIsImportModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                        title="Manage Links"
                      >
                        <LinkIcon size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Course">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/30">
                    {['A', 'B', 'C'].map(secName => {
                      const section = bc.sections?.find((s: any) => s.name === secName);
                      return (
                        <div key={secName} className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section {secName}</label>
                          <select 
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm"
                            value={section?.teacher_id || ''}
                            onChange={(e) => handleTeacherChange(bc.id, secName, e.target.value)}
                          >
                            <option value="">Select Teacher...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          activeTab === 'batches' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {batches.map(batch => (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-lg">{batch.name}</h3>
                    <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {batch.semesters?.map((sem: any) => (
                        <div 
                          key={sem.id} 
                          onClick={() => setSelectedSemester(sem)}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold">
                              {sem.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{sem.name} Semester</h4>
                              <p className="text-xs text-gray-400 tracking-tight">Manage courses & teachers</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Profile URL</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{teacher.name}</td>
                      <td className="px-6 py-4 text-sm text-blue-600 truncate max-w-xs">{teacher.du_profile_url || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-red-600 p-2 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

      <LinkImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSave={handleSaveLinks}
        categories={categories}
      />
    </div>
  );
}
