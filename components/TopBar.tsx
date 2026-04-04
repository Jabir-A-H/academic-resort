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
    { name: 'MBA 1st', href: '/semester/mba-1st' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-[100] transition-all">
        <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg transform group-hover:rotate-6 transition-transform shadow-md">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold text-gray-900 tracking-tight hidden sm:block">Academic Resort</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {links.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    pathname === link.href ? 'text-blue-600' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {/* Desktop Semester Dropdown */}
              <div className="relative group">
                <button className={`flex items-center gap-2 text-sm font-semibold transition-colors ${pathname.includes('/semester') ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}>
                  <BookOpen size={18} />
                  Semesters
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top scale-95 group-hover:scale-100">
                  <div className="py-2">
                    {semesters.map((sem) => (
                      <Link 
                        key={sem.name}
                        href={sem.href}
                        className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        {sem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Menu */}
      <div className={`fixed inset-0 top-16 bg-white z-[90] transition-transform duration-300 md:hidden overflow-y-auto ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="p-6 flex flex-col gap-6">
           <div className="flex flex-col gap-4">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Navigation</p>
             {links.map((link) => (
               <Link 
                 key={link.name} 
                 href={link.href}
                 onClick={() => setMobileMenuOpen(false)}
                 className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                   pathname === link.href ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-700'
                 }`}
               >
                 {link.icon}
                 {link.name}
               </Link>
             ))}
           </div>

           <div className="flex flex-col gap-4 mt-4">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Semesters</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {semesters.map((sem) => (
                 <Link 
                   key={sem.name}
                   href={sem.href}
                   onClick={() => setMobileMenuOpen(false)}
                   className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                 >
                   <BookOpen size={18} className="text-gray-400" />
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
