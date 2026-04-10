'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Plus, 
  Settings, 
  Users, 
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
  X,
  Menu,
  FolderOpen,
  CheckCircle2,
  BookOpen,
  Bell,
  Link as LinkIcon,
  Save,
} from 'lucide-react';
import UserManagement from '@/components/UserManagement';
import ConfirmModal from '@/components/ConfirmModal';
import TeacherModal from '@/components/TeacherModal';
import { getCurrentUserProfile, type UserProfile } from '@/lib/auth';
import { 
  upsertTeacher, 
  deleteTeacher, 
  addCourseWithDefaultSections, 
  addSectionToCourse, 
  deleteSectionFromCourse,
  createBatch
} from './actions';

// ─── Inline Section Adder ─────────────────────────────────────────────────────
function SectionAdder({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    setOpen(false);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary border border-dashed border-outline-variant/40 hover:border-primary/40 rounded-lg px-3 py-1.5 transition-all"
    >
      <Plus size={12} /> Add Section
    </button>
  );

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        maxLength={3}
        placeholder="e.g. C"
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase())}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        className="w-16 border border-outline-variant/40 rounded-lg px-2 py-1.5 text-xs font-bold text-center outline-none focus:border-primary/60 bg-surface text-on-surface transition-all"
      />
      <button onClick={submit} className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"><CheckCircle2 size={13} /></button>
      <button onClick={() => setOpen(false)} className="p-1.5 text-muted hover:text-on-surface rounded-lg transition-all"><X size={13} /></button>
    </div>
  );
}

// ─── Inline Batch Adder ─────────────────────────────────────────────────────
function BatchAdder({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSaving(true);
    await onAdd(trimmed);
    setSaving(false);
    setValue('');
    setOpen(false);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm active:scale-95"
    >
      <Plus size={16} /> Create Batch
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 bg-surface rounded-xl p-1 shadow-sm border border-outline-variant/30 h-10">
      <input
        ref={inputRef}
        type="text"
        placeholder="e.g. 21"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        className="w-24 border-none bg-transparent px-2 text-sm font-bold outline-none text-on-surface"
        disabled={saving}
      />
      <button onClick={submit} disabled={saving} className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"><CheckCircle2 size={13} /></button>
      <button onClick={() => setOpen(false)} disabled={saving} className="p-1.5 text-muted hover:text-on-surface transition-all"><X size={13} /></button>
    </div>
  );
}

// ─── Inline Drive Folder ID Editor ───────────────────────────────────────────
function DriveFolderEditor({ semesterId, initialValue, onSaved }: {
  semesterId: string;
  initialValue: string | null;
  onSaved: (newId: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    let finalValue = value.trim();
    
    // Extract ID if it's a full URL
    const folderMatch = finalValue.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      finalValue = folderMatch[1];
    } else {
      const idMatch = finalValue.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        finalValue = idMatch[1];
      }
    }

    setSaving(true);
    const { error } = await supabase
      .from('semesters')
      .update({ drive_folder_id: finalValue || null })
      .eq('id', semesterId);
    setSaving(false);
    if (!error) {
      onSaved(finalValue || null);
      setEditing(false);
    }
  };

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1 transition-all border ${
        initialValue
          ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100'
          : 'bg-surface border-outline-variant/20 text-muted hover:border-primary/30 hover:text-primary'
      }`}
      title={initialValue ? `Drive ID: ${initialValue}` : 'Set batch Drive folder'}
    >
      <FolderOpen size={11} />
      {initialValue ? 'Drive ✓' : 'Set Drive folder'}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <input
        ref={inputRef}
        type="text"
        placeholder="Paste Google Drive folder ID"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="flex-1 min-w-0 border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-primary/60 bg-surface text-on-surface transition-all"
      />
      <button onClick={save} disabled={saving} className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      </button>
      <button onClick={() => setEditing(false)} className="p-1.5 text-muted hover:text-on-surface rounded-lg transition-all"><X size={12} /></button>
    </div>
  );
}

// ─── Inline Class Updates URL Editor ─────────────────────────────────────────
function ClassUpdatesEditor({ bcId, initialValue, onSaved }: {
  bcId: string;
  initialValue: string | null;
  onSaved: (val: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('batch_courses')
      .update({ class_updates_url: value.trim() || null })
      .eq('id', bcId);
    setSaving(false);
    if (!error) { onSaved(value.trim() || null); setEditing(false); }
  };

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1 transition-all border ${
        initialValue
          ? 'bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100'
          : 'bg-surface border-outline-variant/20 text-muted hover:border-primary/30 hover:text-primary'
      }`}
      title={initialValue || 'Set class updates link'}
    >
      <Bell size={11} />
      {initialValue ? 'Updates ✓' : 'Set updates link'}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="url"
        placeholder="https://..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="flex-1 min-w-0 border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-primary/60 bg-surface text-on-surface transition-all"
      />
      <button onClick={save} disabled={saving} className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      </button>
      <button onClick={() => setEditing(false)} className="p-1.5 text-muted hover:text-on-surface rounded-lg transition-all"><X size={12} /></button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allGlobalCourses, setAllGlobalCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'batches' | 'teachers' | 'access'>('batches');
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);
  
  // Modals & Context States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    const sortedBatches = bRes.data || [];
    setBatches(sortedBatches);
    setTeachers(tRes.data || []);
    setAllGlobalCourses(cRes.data || []);
    
    if (activeTab === 'batches' && sortedBatches.length > 0 && expandedBatches.length === 0) {
      setExpandedBatches([sortedBatches[0].id]);
    }
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

    if (error) { console.error('Update teacher error:', error); return; }
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

  async function handleAddSection(bcId: string, name: string) {
    await addSectionToCourse(bcId, name);
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

  async function handleAddBatch(name: string) {
    try {
      await createBatch(name);
      if (userProfile) await loadData(userProfile);
    } catch (err) {
      console.error('Create batch error:', err);
    }
  }

  function toggleBatch(batchId: string) {
    setExpandedBatches(prev => 
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading && !userProfile) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-muted font-medium text-sm">Verifying credentials...</p>
      </div>
    </div>
  );

  const isMasterAdmin = userProfile?.role === 'MASTER_ADMIN';

  return (
    <div className="min-h-screen bg-surface-lowest font-sans text-on-surface flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-outline-variant/20 sticky top-0 z-40 shadow-ambient">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-on-surface tracking-tight">Admin Hub</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-muted hover:text-on-surface hover:bg-surface-low rounded-lg transition-colors">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 w-64 bg-surface border-r border-outline-variant/20 flex flex-col fixed inset-y-0 left-0 shadow-2xl md:shadow-ambient z-50 md:z-20 h-full`}>
        <div className="px-5 py-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="font-bold text-on-surface tracking-tight leading-tight">Admin Hub</h1>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight mt-0.5 inline-block ${isMasterAdmin ? 'bg-violet-50 text-violet-600' : 'bg-primary/10 text-primary'}`}>
                {userProfile?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('batches'); setSelectedSemester(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'batches' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-low hover:text-on-surface'}`}
          >
            <LayoutDashboard size={16} /> Batches &amp; Semesters
          </button>
          <button 
            onClick={() => { setActiveTab('teachers'); setSelectedSemester(null); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'teachers' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-low hover:text-on-surface'}`}
          >
            <Users size={16} /> Teacher Registry
          </button>
          
          {isMasterAdmin && (
            <button 
              onClick={() => { setActiveTab('access'); setSelectedSemester(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'access' ? 'bg-violet-50 text-violet-700' : 'text-muted hover:bg-surface-low hover:text-on-surface'}`}
            >
              <ShieldCheck size={16} /> User Access
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-outline-variant/10 space-y-3">
          <div className="px-3.5 py-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Logged in as</p>
            <p className="text-xs text-on-surface truncate font-medium">{userProfile?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-w-0 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {selectedSemester && (
                  <button 
                    onClick={() => setSelectedSemester(null)}
                    className="p-1 hover:bg-surface-low rounded-lg text-muted hover:text-on-surface transition-all mr-1"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-on-surface tracking-tight">
                  {activeTab === 'access' 
                    ? 'Access Management' 
                    : selectedSemester 
                      ? `${selectedSemester.name} Semester` 
                      : activeTab === 'batches' ? 'Batches Overview' : 'Teacher Registry'
                  }
                </h2>
              </div>
              <p className="text-muted text-sm">
                {activeTab === 'access' 
                  ? 'Manage roles and batch assignments for representatives.'
                  : selectedSemester 
                    ? 'Manage course assignments, sections, and resources.'
                    : activeTab === 'batches' ? 'Manage your academic structure.' : 'Manage the global directory of faculty members.'
                }
              </p>
            </div>
            
            <div className="flex gap-2 items-center">
              {activeTab === 'batches' && !selectedSemester && isMasterAdmin && (
                <BatchAdder onAdd={handleAddBatch} />
              )}

              {activeTab === 'teachers' && isMasterAdmin && (
                <button 
                  onClick={() => { setEditingTeacher(null); setIsTeacherModalOpen(true); }}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm active:scale-95"
                >
                  <Plus size={16} /> Add Teacher
                </button>
              )}

              {selectedSemester && (
                <button 
                  onClick={() => setIsAddingCourse(true)}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm active:scale-95"
                >
                  <Plus size={16} /> Add Course
                </button>
              )}
            </div>
          </header>

          {/* ── Access Management ────────────────────────────────────── */}
          {activeTab === 'access' && isMasterAdmin ? (
            <UserManagement batches={batches} />

          /* ── Semester Detail View ─────────────────────────────────── */
          ) : selectedSemester ? (
            <div className="space-y-5">
              {/* Add Course Panel */}
              {isAddingCourse && (
                <div className="bg-surface rounded-2xl border border-primary/20 p-5 shadow-ambient animate-in slide-in-from-top-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-on-surface flex items-center gap-2"><BookOpen size={16} className="text-primary" /> Select a Course to Add</h4>
                    <button onClick={() => setIsAddingCourse(false)} className="text-muted hover:text-on-surface p-1 rounded-lg"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {allGlobalCourses.filter(gc => !courses.some(c => c.course_id === gc.id)).map(gc => (
                      <button 
                        key={gc.id} 
                        onClick={() => handleAddCourse(gc.id)}
                        className="p-3 border border-outline-variant/20 rounded-xl hover:bg-primary/5 hover:border-primary/30 text-left transition-all group"
                      >
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{gc.code}</span>
                        <p className="text-sm font-semibold text-on-surface mt-0.5 truncate">{gc.title}</p>
                      </button>
                    ))}
                    {allGlobalCourses.filter(gc => !courses.some(c => c.course_id === gc.id)).length === 0 && (
                      <p className="col-span-3 text-center text-muted text-sm py-4">All courses have been added to this semester.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {courses.length === 0 ? (
                <div className="bg-surface border-2 border-dashed border-outline-variant/30 rounded-2xl p-16 text-center">
                  <AlertCircle size={28} className="text-outline-variant mx-auto mb-3" />
                  <p className="text-muted font-medium text-sm italic">No courses yet for this semester.</p>
                  <button onClick={() => setIsAddingCourse(true)} className="mt-4 text-primary font-bold hover:underline text-sm">Add First Course</button>
                </div>
              ) : (
                courses.map(bc => (
                  <div key={bc.id} className="bg-surface rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden transition-all hover:border-outline-variant/40">
                    {/* ── Course Header ── */}
                    <div className="px-5 py-4 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-widest shrink-0">{bc.courses.code}</span>
                        <h3 className="text-sm font-bold text-on-surface truncate">{bc.courses.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Inline class-updates editor */}
                        <ClassUpdatesEditor
                          bcId={bc.id}
                          initialValue={bc.class_updates_url}
                          onSaved={(val) => {
                            setCourses(prev => prev.map(c => c.id === bc.id ? { ...c, class_updates_url: val } : c));
                          }}
                        />
                        <button 
                          onClick={() => triggerDeleteCourse(bc.id, bc.courses.title)}
                          className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove Course"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* ── Sections Grid ── */}
                    <div className="p-4">
                      <div className="flex flex-wrap gap-3 items-start">
                        {bc.sections?.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((section: any) => (
                          <div key={section.id} className="group/sec relative bg-surface-lowest border border-outline-variant/20 rounded-xl p-3 min-w-[130px]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Section {section.name}</span>
                              <button 
                                onClick={() => triggerDeleteSection(section.id, section.name)}
                                className="text-outline-variant hover:text-red-500 opacity-0 group-hover/sec:opacity-100 transition-all p-0.5"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <select 
                              className="w-full px-2 py-1.5 bg-surface border border-outline-variant/20 rounded-lg text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 font-medium text-on-surface transition-all appearance-none"
                              value={section.teacher_id || ''}
                              onChange={(e) => handleTeacherChange(bc.id, section.id, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        ))}
                        
                        {/* Add section inline */}
                        <div className="flex items-center pt-2">
                          <SectionAdder onAdd={(name) => handleAddSection(bc.id, name)} />
                        </div>
                      </div>

                      {bc.sections?.length === 0 && (
                        <p className="text-xs text-muted italic mb-3">No sections yet.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          /* ── Batches Overview ─────────────────────────────────────── */
          ) : activeTab === 'batches' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 place-items-start">
              {batches.map(batch => {
                const isExpanded = expandedBatches.includes(batch.id);
                return (
                  <div key={batch.id} className="w-full bg-surface rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden hover:border-outline-variant/40 transition-all">
                    <div 
                      onClick={() => toggleBatch(batch.id)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-lowest transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-bold text-primary text-sm tracking-tight">{batch.name}</span>
                        </div>
                        <h3 className="font-bold text-on-surface tracking-tight">Batch {batch.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight size={18} className={`text-muted transition-transform duration-300 ${isExpanded ? 'rotate-90 text-primary' : ''}`} />
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-outline-variant/10 space-y-2 bg-surface-lowest">
                        {batch.semesters?.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, {numeric: true})).map((sem: any) => (
                          <div key={sem.id} className="group bg-surface border border-outline-variant/10 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all outline-none focus:border-primary">
                            <div
                              onClick={() => setSelectedSemester(sem)}
                              className="flex items-center justify-between p-3.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-on-surface text-sm">{sem.name} Semester</span>
                              </div>
                              <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
                            </div>

                            <div className="px-3.5 pb-3 -mt-1" onClick={e => e.stopPropagation()}>
                              <DriveFolderEditor
                                semesterId={sem.id}
                                initialValue={sem.drive_folder_id ?? null}
                                onSaved={(newId) => {
                                  setBatches(prev => prev.map(b =>
                                    b.id === batch.id
                                      ? { ...b, semesters: b.semesters.map((s: any) => s.id === sem.id ? { ...s, drive_folder_id: newId } : s) }
                                      : b
                                  ));
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          /* ── Teacher Registry ─────────────────────────────────────── */
          ) : (
            <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-ambient overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-surface-lowest border-b border-outline-variant/10">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-bold text-muted uppercase tracking-widest">Teacher</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-muted uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-muted uppercase tracking-widest">Socials</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-muted uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {teachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-surface-lowest transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-surface-lowest rounded-xl flex items-center justify-center text-muted font-bold text-sm shrink-0">
                              {teacher.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface text-sm">{teacher.name}</p>
                              {teacher.du_profile_url && (
                                <a href={teacher.du_profile_url} target="_blank" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                                  University Profile <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {teacher.email && (
                              <div className="flex items-center gap-2 text-xs text-muted"><Mail size={11} /> {teacher.email}</div>
                            )}
                            {teacher.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted"><Phone size={11} /> {teacher.phone}</div>
                            )}
                            {!teacher.email && !teacher.phone && <span className="text-muted text-[10px] italic">Not provided</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {teacher.linkedin_url ? (
                              <a href={teacher.linkedin_url} target="_blank" className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"><Linkedin size={13} /></a>
                            ) : (
                              <div className="p-1.5 bg-surface-lowest text-muted/30 rounded-lg"><Linkedin size={13} /></div>
                            )}
                            {teacher.facebook_url ? (
                              <a href={teacher.facebook_url} target="_blank" className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"><Facebook size={13} /></a>
                            ) : (
                              <div className="p-1.5 bg-surface-lowest text-muted/30 rounded-lg"><Facebook size={13} /></div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {isMasterAdmin && (
                              <>
                                <button 
                                  onClick={() => { setEditingTeacher(teacher); setIsTeacherModalOpen(true); }}
                                  className="text-muted hover:text-primary p-2 transition-all rounded-lg hover:bg-primary/10"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => triggerDeleteTeacher(teacher.id, teacher.name)}
                                  className="text-muted hover:text-red-600 p-2 transition-all rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
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
    </div>
  );
}
