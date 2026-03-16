'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, Loader2, ArrowLeft, ExternalLink, ChevronDown, ChevronUp, FileText, Folder } from 'lucide-react';
import { getCourseDetails } from '@/lib/database';

// ─── Drive Folder Toggle ──────────────────────────────────────────────────────
function FolderItem({ title, url, folderId }: { title: string; url: string; folderId?: string }) {
  const [expanded, setExpanded] = useState(false);
  // Note: In a real implementation, we would fetch folder contents here using Drive API
  // For now, we'll match the static site's toggle UI
  
  return (
    <div className="link-section">
      <div className="folder-item">
        <a href={url} target="_blank" rel="noopener noreferrer" className="folder-link text-blue-600 hover:underline">
          <Folder size={16} className="inline mr-2" /> {title}
        </a>
        {folderId && (
          <div className="folder-actions">
            <button 
              className="expand-btn"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </div>
      {expanded && folderId && (
        <ul className="subfolder-list ml-8 mt-2 border-l-2 border-gray-100 pl-4 py-1">
          <li className="text-gray-400 italic text-sm">Inline expansion requires Google Drive API integration...</li>
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoursePage() {
  const params = useParams();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    getCourseDetails(code)
      .then(setCourse)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  // Group occurrences by batch
  const batchGroups = useMemo(() => {
    if (!course?.occurrences) return [];
    const groups = new Map();
    course.occurrences.forEach((occ: any) => {
      const batchName = occ.semesters?.batches?.name || 'Unknown Batch';
      if (!groups.has(batchName)) {
        groups.set(batchName, {
          name: batchName,
          driveId: occ.semesters?.drive_folder_id,
          semester: occ.semesters?.name,
          classUpdates: occ.class_updates_url,
          sections: occ.sections || [],
          materials: occ.resource_links || []
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const ai = parseInt(a.name);
      const bi = parseInt(b.name);
      return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
    });
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-screen-md mx-auto bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          {error || 'Course not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link">
            <Home size={16} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>&gt;</span>
          {batchGroups[0]?.semester && (
            <>
              <Link href={`/semester/${batchGroups[0].semester.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600">
                {batchGroups[0].semester} Semester
              </Link>
              <span>&gt;</span>
            </>
          )}
          <span className="font-semibold text-gray-700">{course.title} ({course.code})</span>
        </nav>

        <div className="page-intro mb-10">
          <h1 className="page-title text-3xl font-bold text-gray-900 mb-2">
            <span className="course-code mr-3 bg-blue-600 text-white px-3 py-1 rounded text-xl">{course.code}</span>
            {course.title}
          </h1>
          {course.description && <p className="text-gray-600 mt-4 leading-relaxed">{course.description}</p>}
        </div>

        <div className="subject-content">
          <div id="batches-container" className="space-y-12">
            {batchGroups.length === 0 ? (
              <div className="no-data-message bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400 italic">
                No batch data available for this course yet.
              </div>
            ) : (
              batchGroups.map(group => (
                <section key={group.name} className="drive-batch-container" id={`batch-${group.name}`}>
                  <div className="drive-embed-card bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="batch-header bg-gray-50 px-6 py-4 border-bottom border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">{group.name}</h2>
                      {group.driveId && (
                        <a 
                          href={`https://drive.google.com/drive/folders/${group.driveId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="root-folder-btn flex items-center gap-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                        >
                          <ExternalLink size={14} /> Open Drive Folder
                        </a>
                      )}
                    </div>
                    
                    <div className="drive-list-wrapper p-6">
                      <div className="course-links-list space-y-6">
                        {/* Class Updates */}
                        {group.classUpdates && (
                          <div className="link-section">
                            <h4 className="section-title text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Class Updates</h4>
                            <div className="links-list pl-4">
                              <a href={group.classUpdates} target="_blank" rel="noopener noreferrer" className="file-link text-blue-600 hover:underline flex items-center">
                                <FileText size={16} className="mr-2" /> Course Updates Folder
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Materials by Category */}
                        {['Notes', 'Slides & Lectures', 'Books & Manuals', 'Question Papers', 'Assignments', 'Previous Materials'].map(cat => {
                          const catMaterials = group.materials.filter((m: any) => m.category === cat);
                          if (catMaterials.length === 0) return null;
                          return (
                            <div key={cat} className="link-section">
                              <h4 className="section-title text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{cat}</h4>
                              <div className="links-list pl-4 space-y-3">
                                {catMaterials.map((m: any) => (
                                  <FolderItem key={m.id} title={m.title} url={m.url} folderId={m.url.includes('folders/') ? m.url.split('folders/')[1]?.split('?')[0] : undefined} />
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {group.materials.length === 0 && !group.classUpdates && (
                          <div className="no-links text-gray-400 italic text-sm py-4">
                            No course materials available for this batch.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
