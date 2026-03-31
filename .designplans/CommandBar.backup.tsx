'use client';

import React from 'react';
import { 
  KBarProvider, 
  KBarPortal, 
  KBarPositioner, 
  KBarSearch, 
  KBarResults, 
  KBarAnimator,
  useMatches
} from 'kbar';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Search,
  Hash
} from 'lucide-react';

const CommandBar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const actions = [
    {
      id: "home",
      name: "Home",
      shortcut: ["h"],
      keywords: "go-home",
      perform: () => router.push("/"),
      icon: <Home size={20} />,
    },
    {
      id: "teachers",
      name: "Teachers",
      shortcut: ["t"],
      keywords: "teachers faculty directory",
      perform: () => router.push("/teachers"),
      icon: <Users size={20} />,
    },
    {
      id: "search",
      name: "Search Resources",
      shortcut: ["s"],
      keywords: "find notes slides books",
      perform: () => router.push("/"),
      icon: <Search size={20} />,
    },
    // Semesters
    {
      id: "semesters",
      name: "Semesters",
      keywords: "bba mba courses",
      section: "Navigation",
    },
    {
      id: "1st",
      name: "1st Semester",
      parent: "semesters",
      perform: () => router.push("/semester/1st"),
      icon: <BookOpen size={18} />,
    },
    {
      id: "2nd",
      name: "2nd Semester",
      parent: "semesters",
      perform: () => router.push("/semester/2nd"),
      icon: <BookOpen size={18} />,
    },
    {
      id: "mba-1st",
      name: "MBA 1st",
      parent: "semesters",
      perform: () => router.push("/semester/mba-1st"),
      icon: <GraduationCap size={18} />,
    },
  ];

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="bg-gray-900/40 backdrop-blur-sm z-[2000] p-4">
          <KBarAnimator className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search size={18} className="text-gray-400" />
              <KBarSearch className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400" />
            </div>
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};

function RenderResults() {
  const { results } = useMatches();

  return (
    <div className="max-h-[400px] overflow-y-auto p-2">
      <KBarResults
        items={results}
        onRender={({ item, active }) =>
          typeof item === "string" ? (
            <div className="px-4 py-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {item}
            </div>
          ) : (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                active ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {item.shortcut?.length ? (
                <div className="flex gap-1">
                  {item.shortcut.map((s) => (
                    <kbd key={s} className="px-2 py-1 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded-md">
                      {s}
                    </kbd>
                  ))}
                </div>
              ) : null}
            </div>
          )
        }
      />
    </div>
  );
}

export default CommandBar;
