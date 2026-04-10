'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, 
  Home, 
  Users, 
  BookOpen,
  Menu,
  X
} from 'lucide-react';

export default function TopBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/', icon: <Home size={18} /> },
    { name: 'Teachers', href: '/teachers', icon: <Users size={18} /> },
  ];

  const semesters = [
    { name: '1st Semester', href: '/semester/1st' },
    { name: '2nd Semester', href: '/semester/2nd' },
    { name: '3rd Semester', href: '/semester/3rd' },
    { name: '4th Semester', href: '/semester/4th' },
    { name: '5th Semester', href: '/semester/5th' },
    { name: '6th Semester', href: '/semester/6th' },
    { name: '7th Semester', href: '/semester/7th' },
    { name: '8th Semester', href: '/semester/8th' },
    { name: 'MBA 1st', href: '/semester/mba-1st' },
    { name: 'MBA 2nd', href: '/semester/mba-2nd' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-lowest/80 backdrop-blur-md border-b border-outline-variant/30 z-[100] transition-all">
        <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center font-bold text-lg transform group-hover:rotate-6 transition-transform shadow-ambient">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold text-on-surface tracking-tight hidden sm:block">Academic Resort</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {links.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    pathname === link.href ? 'text-primary' : 'text-muted hover:text-on-surface'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {/* Desktop Semester Dropdown */}
              <div className="relative group">
                <button className={`flex items-center gap-2 text-sm font-semibold transition-colors ${pathname.includes('/semester') ? 'text-primary' : 'text-muted hover:text-on-surface'}`}>
                  <BookOpen size={18} />
                  Semesters
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-lowest border border-outline-variant/30 rounded-2xl shadow-ambient opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top scale-95 group-hover:scale-100">
                  <div className="py-2">
                    {semesters.map((sem) => (
                      <Link 
                        key={sem.name}
                        href={sem.href}
                        className="block px-4 py-2 text-sm font-medium text-muted hover:bg-surface-low hover:text-primary transition-colors"
                      >
                        {sem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-outline-variant/50 hidden md:block"></div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-muted hover:bg-surface-low rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      <div className={`fixed inset-0 top-16 bg-surface-lowest z-[90] transition-transform duration-300 md:hidden overflow-y-auto ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="p-6 flex flex-col gap-6">
           <div className="flex flex-col gap-4">
             <p className="text-xs font-bold text-muted uppercase tracking-widest px-2">Navigation</p>
             {links.map((link) => (
               <Link 
                 key={link.name} 
                 href={link.href}
                 onClick={() => setMobileMenuOpen(false)}
                 className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                   pathname === link.href ? 'bg-surface-container text-primary' : 'bg-surface-low text-on-surface'
                 }`}
               >
                 {link.icon}
                 {link.name}
               </Link>
             ))}
           </div>

           <div className="flex flex-col gap-4 mt-4">
             <p className="text-xs font-bold text-muted uppercase tracking-widest px-2">Semesters</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {semesters.map((sem) => (
                 <Link 
                   key={sem.name}
                   href={sem.href}
                   onClick={() => setMobileMenuOpen(false)}
                   className="flex items-center gap-3 p-4 bg-surface-low rounded-xl font-bold text-on-surface hover:bg-surface-container transition-colors"
                 >
                   <BookOpen size={18} className="text-muted" />
                   {sem.name}
                 </Link>
               ))}
             </div>
           </div>
        </div>
      </div>
    </>
  );
}
