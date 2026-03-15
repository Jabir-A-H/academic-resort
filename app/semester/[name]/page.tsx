'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, Loader2, ArrowLeft } from 'lucide-react';
import { getCoursesBySemesterName } from '@/lib/database';
import ResourceCard from '@/components/ResourceCard';

const ORDINAL: Record<string, string> = {
  '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th',
  '5th': '5th', '6th': '6th', '7th': '7th', '8th': '8th',
  'mba-1st': 'MBA 1st', 'mba-2nd': 'MBA 2nd',
};

export default function SemesterPage() {
  const params = useParams();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    getCoursesBySemesterName(name)
      .then(setCourses)
      .catch(err => setError(err.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, [name]);

  // Group courses by batch
  const byBatch: Record<string, { batchName: string; items: any[] }> = {};
  for (const item of courses) {
    const batchId = item.semesters?.batches?.id || 'unknown';
    const batchName = item.semesters?.batches?.name || 'Unknown Batch';
    if (!byBatch[batchId]) byBatch[batchId] = { batchName, items: [] };
    byBatch[batchId].items.push(item);
  }

  const label = name ? (ORDINAL[name] ?? name) : '';
  const title = label === 'MBA' ? 'MBA Semester' : `${label} Semester`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link flex items-center gap-1">
            <Home size={18} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-24 pb-16">
        {/* Back + Title */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft size={16} /> Back to Search
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg font-bold shadow">
              {label.includes('MBA') ? 'M' : label.replace(/\D/g, '')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''} found across all batches</p>
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

        {!loading && !error && courses.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
            <p className="text-gray-400 text-lg">No courses found for {title}.</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 font-semibold hover:underline">
              Return to search
            </Link>
          </div>
        )}

        {!loading && !error && Object.entries(byBatch).map(([batchId, batch]) => (
          <section key={batchId} className="mb-10">
            <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {batch.batchName}
            </h2>
            <div className="space-y-4">
              {batch.items.map((item: any) => (
                <ResourceCard
                  key={item.id}
                  course={item.courses}
                  semester={item.semesters.name}
                  batch={item.semesters.batches.name}
                  sections={item.sections}
                  links={item.resource_links}
                  classUpdatesUrl={item.class_updates_url}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
