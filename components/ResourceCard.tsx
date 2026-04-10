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
    <div className="bg-surface-lowest border border-outline-variant/30 rounded-2xl shadow-ambient hover:shadow-ambient-md transition-shadow p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-widest">
            {course.code}
          </span>
          <h3 className="text-lg md:text-xl font-semibold text-on-surface mt-2">{course.title}</h3>
          <p className="text-sm text-muted mt-1 font-medium">
            {batch} • {semester} Semester
          </p>
        </div>
        {classUpdatesUrl && (
          <a 
            href={classUpdatesUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary p-2 hover:bg-surface-low rounded-full transition-colors flex-shrink-0"
            title="Class Updates"
          >
            <Share2 size={18} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Sections & Teachers */}
        <div>
          <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <User size={14} className="opacity-70" /> Sections & Teachers
          </h4>
          <div className="space-y-3">
            {sections?.slice().sort((a,b) => a.name.localeCompare(b.name)).map((sec, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 bg-surface-container text-on-surface rounded flex items-center justify-center font-bold text-xs shadow-ambient-subtle border border-outline-variant/20">
                  {sec.name}
                </span>
                <span className="text-sm text-on-surface font-medium">{sec.teachers?.name || 'TBA'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
            <Book size={14} className="opacity-70" /> Academic Resources
          </h4>
          <div className="space-y-4">
            {Object.keys(groupedLinks).length === 0 ? (
              <p className="text-sm text-muted italic">No resources available yet.</p>
            ) : (
              Object.entries(groupedLinks).map(([category, categoryLinks]) => (
                <div key={category} className="space-y-2">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{category}</span>
                  <div className="flex flex-wrap gap-2">
                    {(categoryLinks as any[]).map((link, i) => (
                      <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-lowest border border-outline-variant/30 text-on-surface rounded-lg text-xs hover:bg-surface-low hover:border-primary/30 hover:text-primary transition-all font-medium group shadow-ambient-subtle"
                      >
                        {link.title || 'Resource'}
                        <ExternalLink size={12} className="text-muted group-hover:text-primary transition-colors" />
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
