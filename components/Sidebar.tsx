'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ChevronLeft, 
  Menu, 
  FileText,
  Archive,
  Search
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync collapsed state with body class
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Handle mobile responsive classes
  useEffect(() => {
    if (isMobileOpen) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
    
    // Add has-sidebar class always on desktop
    document.body.classList.add('has-sidebar');
    
    return () => {
      document.body.classList.remove('has-sidebar', 'sidebar-expanded', 'sidebar-collapsed');
    };
  }, [isMobileOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.remove('resize', handleResize);
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
        <button 
          className="mobile-sidebar-toggle md:hidden fixed top-4 left-4 z-[1100] p-2 bg-white rounded-md shadow-md"
          onClick={toggleMobile}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'block' : 'hidden'}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          <span className="sidebar-logo">Academic Resort</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">BBA Semesters</div>
            {bbaSemesters.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="nav-icon"><BookOpen size={18} /></span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-group">
            <div className="nav-group-title">MBA Semesters</div>
            {mbaSemesters.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="nav-icon"><GraduationCap size={18} /></span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item">
            <span className="nav-icon"><Archive size={18} /></span>
            <span className="nav-label">Archives v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
