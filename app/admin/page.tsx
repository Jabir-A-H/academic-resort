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
  ShieldCheck,
  AlertCircle,
  Loader2,
  Edit2,
  Phone,
  Mail,
  Linkedin,
  Facebook,
  ExternalLink,
  MoreVertical,
  MinusCircle,
  X,
  Menu,
} from 'lucide-react';
import LinkImportModal from '@/components/LinkImportModal';
import UserManagement from '@/components/UserManagement';
import ConfirmModal from '@/components/ConfirmModal';
import TeacherModal from '@/components/TeacherModal';
import { getCurrentUserProfile, type UserProfile } from '@/lib/auth';
import { 
  upsertTeacher, 
  deleteTeacher, 
  addCourseWithDefaultSections, 
  addSectionToCourse, 
  deleteSectionFromCourse 
} from './actions';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allGlobalCourses, setAllGlobalCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'batches' | 'teachers' | 'access'>('batches');
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  
  // Modals & Context States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeBatchCourseId, setActiveBatchCourseId] = useState<string | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const router = useRouter();

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const profile = await getCurrentUserProfile();
      if (!profile) {
        await supabase.auth.signOut();
        router.push('/login?error=pending');
        return;
      }

      setUserProfile(profile);
      await loadData(profile);
      setLoading(false);
    }

    initAuth();
  }, [router]);

  useEffect(() => {
    if (selectedSemester) {
      loadSemesterData(selectedSemester.id);
    }
  }, [selectedSemester]);

  async function loadData(profile: UserProfile) {
    let batchQuery = supabase.from('batches').select('*, semesters(*)').order('name');
    
    if (profile.role === 'REPRESENTATIVE' && profile.batch_id) {
      batchQuery = batchQuery.eq('id', profile.batch_id);
    }

    const [bRes, tRes, cRes] = await Promise.all([
      batchQuery,
      supabase.from('teachers').select('*').order('name'),
      supabase.from('courses').select('*').order('code')
    ]);

    setBatches(bRes.data || []);
    setTeachers(tRes.data || []);
    setAllGlobalCourses(cRes.data || []);
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

  async function handleTeacherChange(bcId: string, secId: string, teacherId: string) {
    const { error } = await supabase
      .from('sections')
      .update({ teacher_id: teacherId || null })
      .eq('id', secId);

    if (error) {
      console.error('Update teacher error:', error);
      return;
    }
    if (selectedSemester) loadSemesterData(selectedSemester.id);
  }

  // Teacher CRUD
  async function handleSaveTeacher(data: any) {
    const payload = editingTeacher ? { ...data, id: editingTeacher.id } : data;
    await upsertTeacher(payload);
    if (userProfile) await loadData(userProfile);
  }

  async function triggerDeleteTeacher(id: string, name: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Teacher?',
      message: `Are you sure you want to remove ${name} from the registry? This will unassign them from all courses globally.`,
      onConfirm: async () => {
        await deleteTeacher(id);
        if (userProfile) await loadData(userProfile);
      }
    });
  }

  // Course & Section Management
  async function handleAddCourse(courseId: string) {
    if (!selectedSemester) return;
    setLoading(true);
    try {
      await addCourseWithDefaultSections(selectedSemester.id, courseId);
      await loadSemesterData(selectedSemester.id);
      setIsAddingCourse(false);
    } catch (err) {
      console.error('Add course error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function triggerDeleteCourse(bcId: string, courseTitle: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Course?',
      message: `Are you sure you want to remove ${courseTitle} from this semester? All associated sections and resource links will be deleted.`,
      onConfirm: async () => {
        const { error } = await supabase.from('batch_courses').delete().eq('id', bcId);
        if (!error && selectedSemester) loadSemesterData(selectedSemester.id);
      }
    });
  }

  async function handleAddSection(bcId: string) {
    const name = prompt('Enter section name (e.g. D):');
    if (!name) return;
    await addSectionToCourse(bcId, name.toUpperCase());
    if (selectedSemester) loadSemesterData(selectedSemester.id);
  }

  async function triggerDeleteSection(secId: string, secName: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Section?',
      message: `Remove Section ${secName}? This will also remove the teacher assignment for this section.`,
      onConfirm: async () => {
        await deleteSectionFromCourse(secId);
        if (selectedSemester) loadSemesterData(selectedSemester.id);
      }
    });
  }

  async function handleSaveLinks(links: Array<{ category: string, title: string, url: string }>) {
    if (!activeBatchCourseId) return;
    const { error } = await supabase.from('resource_links').insert(links.map(l => ({
      batch_course_id: activeBatchCourseId,
      category: l.category,
      title: l.title,
      url: l.url
    })));
    if (error) throw new Error(error.message);
    if (selectedSemester) loadSemesterData(selectedSemester.id);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading && !userProfile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-400 font-medium tracking-tight">Verifying credentials...</p>
      </div>
    </div>
  );

  const isMasterAdmin = userProfile?.role === 'MASTER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header Overlay */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-gray-900 tracking-tight">Admin Hub</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 shadow-2xl md:shadow-sm z-50 md:z-20 h-full`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="font-bold text-gray-900 tracking-tight leading-tight">Admin Hub</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${isMasterAdmin ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {userProfile?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('batches'); setSelectedSemester(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'batches' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} /> Batches & Semesters
          </button>
          <button 
            onClick={() => { setActiveTab('teachers'); setSelectedSemester(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'teachers' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={18} /> Teacher Registry
          </button>
          
          {isMasterAdmin && (
            <button 
              onClick={() => { setActiveTab('access'); setSelectedSemester(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'access' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ShieldCheck size={18} /> User Access
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="px-4 py-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
            <p className="text-xs text-gray-600 truncate font-medium">{userProfile?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 xl:p-12 min-w-0 w-full overflow-x-hidden">
        <div className="w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
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
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {activeTab === 'access' ? 'Access Management' : (selectedSemester ? `${selectedSemester.name} Semester` : (activeTab === 'batches' ? 'Batches Overview' : 'Teacher Registry'))}
              </h2>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {activeTab === 'access' ? 'Manage roles and batch assignments for representatives.' : (selectedSemester ? 'Manage course assignments and resources.' : (activeTab === 'batches' ? 'Manage your academic structure.' : 'Manage the global directory of faculty members.'))}
            </p>
          </div>
          
          <div className="flex gap-3">
            {activeTab === 'teachers' && isMasterAdmin && (
              <button 
                onClick={() => { setEditingTeacher(null); setIsTeacherModalOpen(true); }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 text-sm"
              >
                <Plus size={18} /> Add Teacher
              </button>
            )}

            {selectedSemester && (
              <button 
                onClick={() => setIsAddingCourse(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 text-sm"
              >
                <Plus size={18} /> Add Course
              </button>
            )}
          </div>
        </header>

        {activeTab === 'access' && isMasterAdmin ? (
          <UserManagement batches={batches} />
        ) : selectedSemester ? (
          <div className="space-y-6">
            {isAddingCourse && (
              <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-blue-900">Select Global Course to Add</h4>
                  <button onClick={() => setIsAddingCourse(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allGlobalCourses.filter(gc => !courses.some(c => c.course_id === gc.id)).map(gc => (
                    <button 
                      key={gc.id} 
                      onClick={() => handleAddCourse(gc.id)}
                      className="p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 text-left transition-all group"
                    >
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{gc.code}</span>
                      <p className="text-sm font-bold text-gray-800 mt-1 truncate">{gc.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {courses.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <AlertCircle size={32} />
                </div>
                <p className="text-gray-500 font-medium tracking-tight italic">No courses have been configured for this semester yet.</p>
                <button onClick={() => setIsAddingCourse(true)} className="mt-6 text-blue-600 font-bold hover:underline transition-all">Add First Course</button>
              </div>
            ) : (
              courses.map(bc => (
                <div key={bc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-blue-100">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner font-bold text-sm">
                        {bc.courses.code.replace(/[^0-9]/g, '').slice(0,1)}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">{bc.courses.code}</span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1 tracking-tight">{bc.courses.title}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setActiveBatchCourseId(bc.id); setIsImportModalOpen(true); }}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                        title="Manage Links"
                      >
                        <LinkIcon size={18} />
                      </button>
                      
                      <button 
                        onClick={() => handleAddSection(bc.id)}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Add Section"
                      >
                        <Plus size={18} />
                      </button>

                      <button 
                        onClick={() => triggerDeleteCourse(bc.id, bc.courses.title)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold" 
                        title="Delete Course Entry"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-gray-50/20">
                    {bc.sections?.sort((a:any, b:any) => a.name.localeCompare(b.name)).map((section: any) => (
                      <div key={section.id} className="space-y-2 group/sec relative">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section {section.name}</label>
                          <button 
                            onClick={() => triggerDeleteSection(section.id, section.name)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover/sec:opacity-100 transition-all"
                          >
                            <MinusCircle size={12} />
                          </button>
                        </div>
                        <select 
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm transition-all font-medium text-gray-700"
                          value={section.teacher_id || ''}
                          onChange={(e) => handleTeacherChange(bc.id, section.id, e.target.value)}
                        >
                          <option value="">Select Teacher...</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    ))}
                    {bc.sections?.length === 0 && (
                       <p className="text-xs text-gray-400 italic py-3">No sections added. Click + to start.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          activeTab === 'batches' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {batches.map(batch => (
                <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md border-b-4 border-b-blue-500/10">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-bold text-gray-900 text-lg tracking-tight">{batch.name} Batch</h3>
                    {isMasterAdmin && (
                      <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {batch.semesters?.sort((a:any, b:any) => a.name.localeCompare(b.name)).map((sem: any) => (
                        <div 
                          key={sem.id} 
                          onClick={() => setSelectedSemester(sem)}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-gray-100 text-blue-600 rounded-xl shadow-sm flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                              {sem.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 tracking-tight text-sm">{sem.name} Semester</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Manage records</p>
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Teacher</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Social Presence</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold">
                              {teacher.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm tracking-tight">{teacher.name}</p>
                              {teacher.du_profile_url && (
                                <a href={teacher.du_profile_url} target="_blank" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                                  University Profile <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {teacher.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Mail size={12} className="text-gray-300" /> {teacher.email}
                              </div>
                            )}
                            {teacher.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone size={12} className="text-gray-300" /> {teacher.phone}
                              </div>
                            )}
                            {!teacher.email && !teacher.phone && <span className="text-gray-300 text-[10px] italic">Not provided</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {teacher.linkedin_url ? (
                              <a href={teacher.linkedin_url} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                                <Linkedin size={14} />
                              </a>
                            ) : (
                              <div className="p-2 bg-gray-50 text-gray-300 rounded-lg"><Linkedin size={14} /></div>
                            )}
                            {teacher.facebook_url ? (
                              <a href={teacher.facebook_url} target="_blank" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                                <Facebook size={14} />
                              </a>
                            ) : (
                              <div className="p-2 bg-gray-50 text-gray-300 rounded-lg"><Facebook size={14} /></div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {isMasterAdmin && (
                              <>
                                <button 
                                  onClick={() => { setEditingTeacher(teacher); setIsTeacherModalOpen(true); }}
                                  className="text-gray-400 hover:text-blue-600 p-2.5 transition-all rounded-lg hover:bg-blue-50"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => triggerDeleteTeacher(teacher.id, teacher.name)}
                                  className="text-gray-300 hover:text-red-600 p-2.5 transition-all rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
        </div>
      </main>

      {/* Persistent Components */}
      <TeacherModal 
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        teacher={editingTeacher}
        onSave={handleSaveTeacher}
      />

      <ConfirmModal 
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      <LinkImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSave={handleSaveLinks}
        categories={['Class Notes', 'Slides and Materials', 'Books and Manuals', 'Question Bank']}
      />
    </div>
  );
}
