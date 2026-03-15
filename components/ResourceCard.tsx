import React from 'react';
import { ExternalLink, User, Book, Share2 } from 'lucide-react';

interface ResourceCardProps {
  course: {
    code: string;
    title: string;
  };
  semester: string;
  batch: string;
  sections: Array<{ name: string, teachers: { name: string } | null }>;
  links: Array<{ category: string, title: string, url: string }>;
  classUpdatesUrl?: string;
}

export default function ResourceCard({ course, semester, batch, sections, links, classUpdatesUrl }: ResourceCardProps) {
  const groupedLinks = links?.reduce((acc: Record<string, any[]>, link) => {
    if (!acc[link.category]) acc[link.category] = [];
    acc[link.category].push(link);
    return acc;
  }, {}) || {};

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">
            {course.code}
          </span>
          <h3 className="text-xl font-semibold text-gray-900 mt-1">{course.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {batch} • {semester} Semester
          </p>
        </div>
        {classUpdatesUrl && (
          <a 
            href={classUpdatesUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
            title="Class Updates"
          >
            <Share2 size={18} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Sections & Teachers */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <User size={14} /> Sections & Teachers
          </h4>
          <div className="space-y-2">
            {sections?.slice().sort((a,b) => a.name.localeCompare(b.name)).map((sec, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded text-xs flex items-center justify-center font-bold">
                  {sec.name}
                </span>
                <span className="text-sm text-gray-700">{sec.teachers?.name || 'TBA'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Book size={14} /> Academic Resources
          </h4>
          <div className="space-y-4">
            {Object.keys(groupedLinks).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No resources available yet.</p>
            ) : (
              Object.entries(groupedLinks).map(([category, categoryLinks]) => (
                <div key={category} className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{category}</span>
                  <div className="flex flex-wrap gap-2">
                    {(categoryLinks as any[]).map((link, i) => (
                      <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[11px] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all font-medium group"
                      >
                        {link.title || 'Resource'}
                        <ExternalLink size={10} className="text-gray-400 group-hover:text-blue-500" />
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
