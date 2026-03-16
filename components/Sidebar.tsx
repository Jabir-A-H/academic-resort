'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ChevronLeft, 
  Menu, 
  FileText,
  Archive,
  Search,
  Command
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ... (keeping previous effects)
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
    document.body.classList.add('has-sidebar');
    return () => {
      document.body.classList.remove('has-sidebar', 'sidebar-expanded', 'sidebar-collapsed');
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const navItems = [
    { label: 'Home', href: '/', icon: <Home size={20} /> },
    { label: 'Teachers', href: '/teachers', icon: <Users size={20} /> },
  ];

  const bbaSemesters = [
    { label: '1st Semester', href: '/semester/1st' },
    { label: '2nd Semester', href: '/semester/2nd' },
    { label: '3rd Semester', href: '/semester/3rd' },
    { label: '4th Semester', href: '/semester/4th' },
    { label: '5th Semester', href: '/semester/5th' },
    { label: '6th Semester', href: '/semester/6th' },
    { label: '7th Semester', href: '/semester/7th' },
    { label: '8th Semester', href: '/semester/8th' },
  ];

  const mbaSemesters = [
    { label: 'MBA 1st', href: '/semester/mba-1st' },
    { label: 'MBA 2nd', href: '/semester/mba-2nd' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isMobileOpen && (
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mobile-sidebar-toggle md:hidden fixed top-4 left-4 z-[1100] p-2 bg-white/80 backdrop-blur-glass rounded-xl shadow-lg border border-white/40"
          onClick={toggleMobile}
        >
          <Menu size={24} />
        </motion.button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay fixed inset-0 bg-black/20 backdrop-blur-sm z-[1050]" 
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          <span className="sidebar-logo text-transparent bg-clip-text bg-gradient-brand">Academic Resort</span>
        </div>

        <nav className="sidebar-nav custom-scrollbar overflow-y-auto overflow-x-hidden p-4">
          <div className="nav-group mb-6">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`nav-item relative group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${active ? 'text-primary font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {active && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-brand/10 border border-brand/20 rounded-xl z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="nav-icon relative z-10">{item.icon}</span>
                  <span className="nav-label relative z-10">{item.label}</span>
                  {!isCollapsed && active && (
                    <motion.div 
                      layoutId="active-dot" 
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" 
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="nav-group mb-6">
            <div className="nav-group-title text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 px-3">BBA Semesters</div>
            <div className="flex flex-col gap-1">
              {bbaSemesters.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`nav-item relative group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${active ? 'text-primary font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {active && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-brand/10 border border-brand/20 rounded-xl z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="nav-icon relative z-10"><BookOpen size={18} /></span>
                    <span className="nav-label relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="nav-group mb-6">
            <div className="nav-group-title text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 px-3">MBA Semesters</div>
            <div className="flex flex-col gap-1">
              {mbaSemesters.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`nav-item relative group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${active ? 'text-primary font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {active && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-brand/10 border border-brand/20 rounded-xl z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="nav-icon relative z-10"><GraduationCap size={18} /></span>
                    <span className="nav-label relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer p-4 border-t border-border mt-auto">
          <div className="nav-item group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-all">
            <span className="nav-icon text-gray-500 group-hover:text-brand"><Command size={18} /></span>
            <div className="flex flex-col gap-0.5">
              <span className="nav-label text-xs font-medium text-gray-700">Cmd + K</span>
              <span className="nav-label text-[10px] text-gray-400">Search Center</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
