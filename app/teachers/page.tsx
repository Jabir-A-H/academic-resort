'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Loader2, ArrowLeft, User, Book, Filter } from 'lucide-react';
import { getTeacherProfiles, getBatches } from '@/lib/database';

export default function TeachersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Process data to group by teacher
  const teachersMap = new Map();
  profiles.forEach(p => {
    p.sections.forEach((sec: any) => {
      const teacher = sec.teachers;
      if (!teacher) return;
      
      if (!teachersMap.has(teacher.id)) {
        teachersMap.set(teacher.id, {
          name: teacher.name,
          courses: []
        });
      }
      
      const teacherData = teachersMap.get(teacher.id);
      const courseInfo = {
        code: p.courses.code,
        title: p.courses.title,
        semester: p.semesters.name,
        batch: p.semesters.batches.name,
        section: sec.name
      };
      
      // Avoid duplicates
      if (!teacherData.courses.some((c: any) => 
        c.code === courseInfo.code && 
        c.batch === courseInfo.batch && 
        c.section === courseInfo.section
      )) {
        teacherData.courses.push(courseInfo);
      }
    });
  });

  const allTeachers = Array.from(teachersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const filteredTeachers = allTeachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.courses.some((c: any) => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBatch = selectedBatch === 'all' || 
      t.courses.some((c: any) => c.batch === selectedBatch);
      
    return matchesSearch && matchesBatch;
  });

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center text-lg shadow">
              📋
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teachers' Profiles</h1>
              <p className="text-sm text-gray-500">Find courses and sections assigned to teachers</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Search Teacher or Course</label>
              <input 
                type="text" 
                placeholder="Ex: Dr. Mamtaz..."
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Filter by Batch</label>
              <select 
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 transition-all cursor-pointer"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="all">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filteredTeachers.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
            No teachers found matching your criteria.
          </div>
        )}

        {!loading && !error && filteredTeachers.map((teacher, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{teacher.name}</h3>
            </div>
            <div className="space-y-3">
              {teacher.courses
                .filter((c: any) => selectedBatch === 'all' || c.batch === selectedBatch)
                .map((course: any, cIdx: number) => (
                <div key={cIdx} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{course.code}</span>
                    <span className="text-sm font-semibold text-gray-700">{course.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Book size={12}/> Section {course.section}</span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{course.batch}</span>
                    <span className="italic">{course.semester} Sem</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
