'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, Home, ChevronDown, Settings2, Loader2 } from 'lucide-react';
import { searchResources, getBatches, getSemesters } from '@/lib/database';
import ResourceCard from '@/components/ResourceCard';

// ─── Types ───────────────────────────────────────────────────────────────────
type Batch    = { id: string; name: string };
type Semester = { id: string; name: string };

interface GroupedResult {
  batchName: string;
  semesterName: string;
  items: any[];
}

// ─── Semester ordering ───────────────────────────────────────────────────────
const SEMESTER_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','mba-1st','mba-2nd'];
const ordinalLabel = (s: string) =>
  s.startsWith('mba-') ? `MBA ${s.replace('mba-','')} Semester` : `${s.charAt(0).toUpperCase()}${s.slice(1)} Semester`;

// ─── App grid data ───────────────────────────────────────────────────────────
const BBA_SEMS = [
  { num: 1, ord: '1st' }, { num: 2, ord: '2nd' }, { num: 3, ord: '3rd' },
  { num: 4, ord: '4th' }, { num: 5, ord: '5th' }, { num: 6, ord: '6th' },
  { num: 7, ord: '7th' }, { num: 8, ord: '8th' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function AcademicResort() {
  // UI visibility
  const [showApps,     setShowApps]     = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [results,    setResults]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [statusMsg,  setStatusMsg]  = useState('');

  // Filter data
  const [batches,   setBatches]   = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Filter selections (multi)
  const [selBatches,   setSelBatches]   = useState<string[]>([]);
  const [selSemesters, setSelSemesters] = useState<string[]>([]);

  // Filter dropdowns open state
  const [batchOpen,   setBatchOpen]   = useState(false);
  const [semOpen,     setSemOpen]     = useState(false);

  // Result controls
  const [ctrlOpen,          setCtrlOpen]          = useState(false);
  const [expandAll,         setExpandAll]          = useState(true);
  const [semAscending,      setSemAscending]       = useState(true);
  const [batchDescending,   setBatchDescending]    = useState(true);

  // Collapsed sections
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Refs for outside-click
  const appsRef  = useRef<HTMLDivElement>(null);
  const ctrlRef  = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // ── Load batches once ─────────────────────────────────────────────────────
  useEffect(() => {
    getBatches().then(setBatches).catch(console.error);
  }, []);

  // ── Load semesters when batch selection changes ───────────────────────────
  useEffect(() => {
    if (selBatches.length === 1) {
      getSemesters(selBatches[0]).then(setSemesters).catch(console.error);
    } else {
      setSemesters([]);
      setSelSemesters([]);
    }
  }, [selBatches]);

  // ── Outside-click handlers ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(e.target as Node))
        setShowApps(false);
      if (ctrlRef.current && !ctrlRef.current.contains(e.target as Node))
        setCtrlOpen(false);
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setBatchOpen(false);
        setSemOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced auto-search ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setStatusMsg('');
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchResources(searchTerm, {});
        setResults(data);
        setStatusMsg(`${data.length} resource${data.length !== 1 ? 's' : ''} found`);
        setCollapsed(new Set());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Apply filters (with or without search term) ───────────────────────────
  const handleApplyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const batchId    = selBatches.length === 1   ? selBatches[0]   : undefined;
      const semesterId = selSemesters.length === 1 ? selSemesters[0] : undefined;
      const data = await searchResources(searchTerm.trim() || '', { batchId, semesterId });
      setResults(data);
      const parts: string[] = [];
      if (selBatches.length)   parts.push(`${selBatches.length} batch${selBatches.length > 1 ? 'es' : ''}`);
      if (selSemesters.length) parts.push(`${selSemesters.length} semester${selSemesters.length > 1 ? 's' : ''}`);
      setStatusMsg(
        parts.length
          ? `Showing resources for: ${parts.join(', ')}`
          : `${data.length} resource${data.length !== 1 ? 's' : ''} found`
      );
      setCollapsed(new Set());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [searchTerm, selBatches, selSemesters]);

  // ── Group results batch → semester ────────────────────────────────────────
  const grouped = React.useMemo<GroupedResult[]>(() => {
    const map = new Map<string, GroupedResult>();
    for (const item of results) {
      const batchName   = item.semesters?.batches?.name   ?? 'Unknown Batch';
      const semesterName = item.semesters?.name           ?? 'Unknown Semester';
      const key = `${batchName}__${semesterName}`;
      if (!map.has(key)) map.set(key, { batchName, semesterName, items: [] });
      map.get(key)!.items.push(item);
    }
    let arr = Array.from(map.values());

    // Sort semester
    arr.sort((a, b) => {
      const si = SEMESTER_ORDER.indexOf(a.semesterName);
      const sj = SEMESTER_ORDER.indexOf(b.semesterName);
      const semCmp = semAscending ? si - sj : sj - si;
      if (semCmp !== 0) return semCmp;
      // Sort batch (by numeric part of name)
      const bi = parseInt(a.batchName);
      const bj = parseInt(b.batchName);
      return batchDescending ? bj - bi : bi - bj;
    });
    return arr;
  }, [results, semAscending, batchDescending]);

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleCollapsed = (key: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleBatch = (id: string) =>
    setSelBatches(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleSemester = (id: string) =>
    setSelSemesters(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const batchCountLabel =
    selBatches.length === 0 ? 'All batches' : `${selBatches.length} selected`;
  const semCountLabel =
    selSemesters.length === 0 ? 'All semesters' : `${selSemesters.length} selected`;

  const hasResults = grouped.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative flex flex-col">

      {/* ── Google-style Header ──────────────────────────────────────────── */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link">
            <Home size={16} /> Home
          </Link>

          {/* Apps dropdown */}
          <div className="apps-dropdown" ref={appsRef}>
            <button className="apps-btn" onClick={() => setShowApps(s => !s)} title="Quick Access" aria-label="Open semester navigation">
              <LayoutGrid size={22} />
            </button>
            <div className={`apps-dropdown-content${showApps ? ' show' : ''}`}>
              <div className="apps-grid">
                {BBA_SEMS.map(({ num, ord }) => (
                  <Link key={num} href={`/semester/${ord}`} className="app-item" onClick={() => setShowApps(false)}>
                    <div className="app-icon bba-icon">{num}</div>
                    <span className="app-label">{ord} Sem</span>
                  </Link>
                ))}
                <Link href="/semester/mba-1st" className="app-item" onClick={() => setShowApps(false)}>
                  <div className="app-icon mba-icon">M1</div>
                  <span className="app-label">MBA 1st</span>
                </Link>
                <Link href="/semester/mba-2nd" className="app-item" onClick={() => setShowApps(false)}>
                  <div className="app-icon mba-icon">M2</div>
                  <span className="app-label">MBA 2nd</span>
                </Link>
                <Link href="/teachers" className="app-item" onClick={() => setShowApps(false)}>
                  <div className="app-icon" style={{ fontSize: 24 }}>📋</div>
                  <span className="app-label">Teachers</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main search section ──────────────────────────────────────────── */}
      <main className={`transition-all duration-500 ${hasResults ? 'pt-16' : 'pt-40'}`}>
        <div className="max-w-screen-sm mx-auto px-4">

          {/* Logo + title */}
          <div className={`text-center transition-all duration-500 ${hasResults ? 'scale-75 origin-top mb-2' : 'mb-10'}`}>
            <div className="search-engine-logo">🎓</div>
            <h1 className="search-engine-title">Academic Resort</h1>
          </div>

          {/* Search box */}
          <div className="main-search-box">
            <input
              type="text"
              id="globalSearch"
              className="main-search-input"
              placeholder="Search academic resources…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              {loading
                ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary-blue)' }} />
                : <Search size={18} />}
            </div>
          </div>

          {/* Advanced toggle — only when no results */}
          {!hasResults && (
            <div className="options-toggle">
              <button
                className={`options-toggle-btn${showAdvanced ? ' active' : ''}`}
                onClick={() => setShowAdvanced(s => !s)}
              >
                {showAdvanced ? 'Search Specifically' : 'Search Globally'}
                <span className="accordion-icon">{showAdvanced ? '▲' : '▼'}</span>
              </button>
            </div>
          )}

          {/* Advanced filters panel */}
          <div className={`advanced-options${showAdvanced && !hasResults ? ' show' : ''}`}>
            <div ref={filtersRef} className="search-filters">
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px', fontWeight: 500 }}>
                Narrow your search by batch or semester
              </p>

              {/* Batch filter */}
              <div className="filter-item">
                <div
                  className={`filter-button${batchOpen ? ' active' : ''}`}
                  onClick={() => { setBatchOpen(s => !s); setSemOpen(false); }}
                  role="button" tabIndex={0}
                >
                  <div className="filter-button-text">
                    <span className="filter-label">Batches</span>
                    <span className="filter-count">{batchCountLabel}</span>
                  </div>
                  <span className="filter-arrow">▼</span>
                </div>
                <div className={`filter-dropdown-content${batchOpen ? ' show' : ''}`}>
                  {batches.map(b => (
                    <div key={b.id} className="filter-option" onClick={() => toggleBatch(b.id)}>
                      <input type="checkbox" readOnly checked={selBatches.includes(b.id)} id={`b_${b.id}`} />
                      <label htmlFor={`b_${b.id}`}>{b.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semester filter */}
              <div className="filter-item">
                <div
                  className={`filter-button${semOpen ? ' active' : ''}`}
                  onClick={() => {
                    if (semesters.length === 0 && selBatches.length !== 1) return;
                    setSemOpen(s => !s); setBatchOpen(false);
                  }}
                  role="button" tabIndex={0}
                  style={{ opacity: selBatches.length !== 1 ? 0.55 : 1, cursor: selBatches.length !== 1 ? 'not-allowed' : 'pointer' }}
                >
                  <div className="filter-button-text">
                    <span className="filter-label">Semesters</span>
                    <span className="filter-count">{selBatches.length !== 1 ? 'Select 1 batch first' : semCountLabel}</span>
                  </div>
                  <span className="filter-arrow">▼</span>
                </div>
                {selBatches.length === 1 && (
                  <div className={`filter-dropdown-content${semOpen ? ' show' : ''}`}>
                    {semesters.map(s => (
                      <div key={s.id} className="filter-option" onClick={() => toggleSemester(s.id)}>
                        <input type="checkbox" readOnly checked={selSemesters.includes(s.id)} id={`s_${s.id}`} />
                        <label htmlFor={`s_${s.id}`}>{ordinalLabel(s.name)}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="apply-filters-btn" onClick={handleApplyFilters}>
                Apply Filters &amp; Search
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── Results section ──────────────────────────────────────────────── */}
      <div className="max-w-screen-md mx-auto px-4 w-full" style={{ marginTop: hasResults ? 12 : 0 }}>

        {/* Loading bar */}
        <div className={`retro-loading-container${loading ? ' active' : ''}`}>
          <div className="simple-loading-bar"><div className="loading-bar-fill" /></div>
        </div>

        {hasResults && (
          <>
            {/* Results header */}
            <div className="results-header">
              <span className="results-status">{statusMsg}</span>

              {/* Display options dropdown */}
              <div className="result-controls" ref={ctrlRef}>
                <button
                  className={`controls-dropdown-btn${ctrlOpen ? ' open' : ''}`}
                  onClick={() => setCtrlOpen(s => !s)}
                >
                  <Settings2 size={14} />
                  Display Options
                  <ChevronDown size={12} />
                </button>
                <div className={`controls-dropdown-menu${ctrlOpen ? ' show' : ''}`}>
                  <button className="controls-dropdown-item" onClick={() => { setCollapsed(new Set()); setExpandAll(true); setCtrlOpen(false); }}>
                    📂 Expand All
                  </button>
                  <button className="controls-dropdown-item" onClick={() => {
                    setCollapsed(new Set(grouped.map(g => `${g.batchName}__${g.semesterName}`)));
                    setExpandAll(false); setCtrlOpen(false);
                  }}>
                    📁 Collapse All
                  </button>
                  <button className="controls-dropdown-item" onClick={() => { setSemAscending(s => !s); setCtrlOpen(false); }}>
                    📊 Semester: {semAscending ? 'Ascending' : 'Descending'}
                  </button>
                  <button className="controls-dropdown-item" onClick={() => { setBatchDescending(s => !s); setCtrlOpen(false); }}>
                    🎓 Batch: {batchDescending ? 'Newest first' : 'Oldest first'}
                  </button>
                </div>
              </div>
            </div>

            {/* Grouped result sections */}
            {grouped.map(group => {
              const key = `${group.batchName}__${group.semesterName}`;
              const isCollapsed = collapsed.has(key);
              return (
                <div key={key} className={`batch-result-section${isCollapsed ? ' collapsed' : ''}`}>
                  <div className="batch-result-header" onClick={() => toggleCollapsed(key)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="batch-result-title">{group.batchName}</span>
                      <span className="batch-result-meta">· {ordinalLabel(group.semesterName)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{group.items.length} course{group.items.length !== 1 ? 's' : ''}</span>
                      <span className="batch-result-toggle">▾</span>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="batch-result-body">
                      {group.items.map((res: any) => (
                        <ResourceCard
                          key={res.id}
                          course={res.courses}
                          semester={res.semesters?.name}
                          batch={res.semesters?.batches?.name}
                          sections={res.sections}
                          links={res.resource_links}
                          classUpdatesUrl={res.class_updates_url}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Empty state hint */}
        {!loading && !hasResults && !searchTerm && (
          <p className="search-stats-subtle">Ready! Enter search terms or apply filters to find resources.</p>
        )}
      </div>

    </div>
  );
}
