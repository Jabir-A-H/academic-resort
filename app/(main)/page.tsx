'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, LayoutGrid, Home, ChevronDown, Settings2, Loader2,
  FolderOpen, ExternalLink, X, Wifi,
} from 'lucide-react';
import { searchResources, getBatches, getSemesters } from '@/lib/database';
import { searchFilesInFolders, mimeIcon, extractFolderId, type DriveSearchResult, type FolderConfig } from '@/lib/drive';
import ResourceCard from '@/components/ResourceCard';

// ─── Types ────────────────────────────────────────────────────────────────────
type Batch    = { id: string; name: string };
type Semester = { id: string; name: string };
interface GroupedResult { batchName: string; semesterName: string; items: any[] }

// ─── Constants ────────────────────────────────────────────────────────────────
const SEMESTER_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','mba-1st','mba-2nd'];
const ordinalLabel   = (s: string) =>
  s.startsWith('mba-') ? `MBA ${s.replace('mba-','')} Semester` : `${s.charAt(0).toUpperCase()}${s.slice(1)} Semester`;
const BBA_SEMS = [1,2,3,4,5,6,7,8].map(n => ({ num: n, ord: `${n}th`.replace('1th','1st').replace('2th','2nd').replace('3th','3rd') }));

// Ordinal fix helper
function toOrdinal(n: number) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}
const BBA_SEMS_FIXED = [1,2,3,4,5,6,7,8].map(n => ({ num: n, ord: toOrdinal(n) }));

// ─── Drive Results Panel ──────────────────────────────────────────────────────
interface DriveResultsPanelProps {
  results: DriveSearchResult[];
  searching: boolean;
  searched: number;
  total: number;
  visible: boolean;
  onToggle: () => void;
}
function DriveResultsPanel({ results, searching, searched, total, visible, onToggle }: DriveResultsPanelProps) {
  // Group by batch → semester
  const grouped = useMemo(() => {
    const map = new Map<string, { batch: string; semester: string; files: DriveSearchResult[] }>();
    for (const r of results) {
      const key = `${r.batch}__${r.semester}`;
      if (!map.has(key)) map.set(key, { batch: r.batch, semester: r.semester, files: [] });
      map.get(key)!.files.push(r);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ai = parseInt(a.batch), bi = parseInt(b.batch);
      return isNaN(ai) || isNaN(bi) ? 0 : bi - ai;
    });
  }, [results]);

  const progressPct = total > 0 ? Math.round((searched / total) * 100) : 0;

  return (
    <div className="drive-results-panel">
      {/* Header bar */}
      <div className="drive-results-header" onClick={onToggle} role="button" tabIndex={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOpen size={15} style={{ color: 'var(--primary-blue)' }} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            Drive File Search
          </span>
          {searching && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
              <Loader2 size={12} className="animate-spin" />
              {searched}/{total} folders
              {progressPct > 0 && ` (${progressPct}%)`}
            </span>
          )}
          {!searching && results.length > 0 && (
            <span className="drive-result-count">{results.length} file{results.length !== 1 ? 's' : ''}</span>
          )}
          {!searching && results.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>No matching files</span>
          )}
        </div>
        <ChevronDown size={14} style={{ transform: visible ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)' }} />
      </div>

      {/* Progress bar */}
      {searching && (
        <div style={{ height: 2, background: 'var(--border)', borderRadius: 0 }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--primary-blue), #60a5fa)',
            transition: 'width 0.3s ease',
            borderRadius: 0,
          }} />
        </div>
      )}

      {/* Results */}
      {visible && (
        <div className="drive-results-body">
          {grouped.length === 0 && !searching && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0', margin: 0 }}>
              No matching files found in Drive folders.
            </p>
          )}
          {grouped.map(group => (
            <div key={`${group.batch}__${group.semester}`} className="drive-result-group">
              <div className="drive-result-group-header">
                <span className="batch-result-title">{group.batch}</span>
                <span className="batch-result-meta">· {ordinalLabel(group.semester)}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
                  {group.files.length} file{group.files.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="drive-result-file-list">
                {group.files.map((f, i) => (
                  <li key={i} className="drive-result-file-item">
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drive-result-file-link"
                    >
                      <span className="drive-result-file-icon">{mimeIcon(f.mimeType)}</span>
                      <div className="drive-result-file-info">
                        <span className="drive-result-file-name">{f.name}</span>
                        {f.path && f.path !== 'Root' && (
                          <span className="drive-result-file-path">{f.path}</span>
                        )}
                      </div>
                      <ExternalLink size={10} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AcademicResort() {
  // UI
  const [showApps,     setShowApps]     = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [results,    setResults]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [statusMsg,  setStatusMsg]  = useState('');

  // Filter data
  const [batches,   setBatches]   = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Filter selections
  const [selBatches,   setSelBatches]   = useState<string[]>([]);
  const [selSemesters, setSelSemesters] = useState<string[]>([]);

  // Filter dropdown open state
  const [batchOpen, setBatchOpen] = useState(false);
  const [semOpen,   setSemOpen]   = useState(false);

  // Result controls
  const [ctrlOpen,        setCtrlOpen]        = useState(false);
  const [expandAll,       setExpandAll]        = useState(true);
  const [semAscending,    setSemAscending]     = useState(true);
  const [batchDescending, setBatchDescending]  = useState(true);
  const [collapsed,       setCollapsed]        = useState<Set<string>>(new Set());

  // ── Drive search state ──────────────────────────────────────────────────────
  const [driveResults,    setDriveResults]    = useState<DriveSearchResult[]>([]);
  const [driveSearching,  setDriveSearching]  = useState(false);
  const [driveSearched,   setDriveSearched]   = useState(0);
  const [driveTotal,      setDriveTotal]      = useState(0);
  const [drivePanelOpen,  setDrivePanelOpen]  = useState(true);
  const [driveEnabled,    setDriveEnabled]    = useState(true);
  const driveAbortRef = useRef<AbortController | null>(null);

  // Refs
  const appsRef    = useRef<HTMLDivElement>(null);
  const ctrlRef    = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // ── Load batches ─────────────────────────────────────────────────────────────
  useEffect(() => {
    getBatches().then(setBatches).catch(console.error);
  }, []);

  // ── Load semesters on batch select ───────────────────────────────────────────
  useEffect(() => {
    if (selBatches.length === 1) {
      getSemesters(selBatches[0]).then(setSemesters).catch(console.error);
    } else {
      setSemesters([]);
      setSelSemesters([]);
    }
  }, [selBatches]);

  // ── Outside-click handlers ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setShowApps(false);
      if (ctrlRef.current && !ctrlRef.current.contains(e.target as Node)) setCtrlOpen(false);
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setBatchOpen(false); setSemOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Build Drive folder configs from Supabase results ────────────────────────
  const buildDriveFolderConfigs = useCallback((dbResults: any[]): FolderConfig[] => {
    const configs: FolderConfig[] = [];
    const seen = new Set<string>();

    for (const item of dbResults) {
      const batch    = item.semesters?.batches?.name   ?? 'Unknown';
      const semester = item.semesters?.name            ?? 'Unknown';

      // Semester-level Drive folder
      const semDriveId = item.semesters?.drive_folder_id;
      if (semDriveId) {
        const key = `sem__${semDriveId}`;
        if (!seen.has(key)) { seen.add(key); configs.push({ folderId: semDriveId, semester, batch }); }
      }

      // Resource link folders
      for (const link of (item.resource_links ?? [])) {
        const fid = extractFolderId(link.url);
        if (fid) {
          const key = `rl__${fid}`;
          if (!seen.has(key)) { seen.add(key); configs.push({ folderId: fid, semester, batch }); }
        }
      }
    }
    return configs;
  }, []);

  // ── Kick off Drive search after Supabase returns ─────────────────────────────
  const runDriveSearch = useCallback(async (term: string, dbResults: any[]) => {
    if (!driveEnabled || term.trim().length < 3) return;

    // Cancel any previous Drive search
    driveAbortRef.current?.abort();
    const ctrl = new AbortController();
    driveAbortRef.current = ctrl;

    const configs = buildDriveFolderConfigs(dbResults);
    if (configs.length === 0) return;

    setDriveResults([]);
    setDriveSearching(true);
    setDriveSearched(0);
    setDriveTotal(configs.length);
    setDrivePanelOpen(true);

    try {
      await searchFilesInFolders(
        configs,
        term.trim(),
        4,
        ctrl.signal,
        (found, searched, total) => {
          if (ctrl.signal.aborted) return;
          setDriveResults(prev => {
            // Results stream in; we replace with latest full list from the callback
            // searchFilesInFolders updates via progress so we append incrementally
            return prev; // actual accumulation happens inside the lib
          });
          setDriveSearched(searched);
          setDriveTotal(total);
        }
      ).then(finalResults => {
        if (!ctrl.signal.aborted) {
          setDriveResults(finalResults);
          setDriveSearching(false);
        }
      });
    } catch {
      if (!ctrl.signal.aborted) setDriveSearching(false);
    }
  }, [driveEnabled, buildDriveFolderConfigs]);

  // ── Debounced auto-search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setStatusMsg('');
      setDriveResults([]);
      setDriveSearching(false);
      driveAbortRef.current?.abort();
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchResources(searchTerm, {});
        setResults(data);
        setStatusMsg(`${data.length} course${data.length !== 1 ? 's' : ''} found`);
        setCollapsed(new Set());
        // Phase 2: Drive search in background
        runDriveSearch(searchTerm, data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, runDriveSearch]);

  // ── Apply filters ─────────────────────────────────────────────────────────────
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
      setStatusMsg(parts.length
        ? `Showing resources for: ${parts.join(', ')}`
        : `${data.length} resource${data.length !== 1 ? 's' : ''} found`);
      setCollapsed(new Set());
      if (searchTerm.trim()) runDriveSearch(searchTerm.trim(), data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [searchTerm, selBatches, selSemesters, runDriveSearch]);

  // ── Group + sort results ──────────────────────────────────────────────────────
  const grouped = useMemo<GroupedResult[]>(() => {
    const map = new Map<string, GroupedResult>();
    for (const item of results) {
      const batchName    = item.semesters?.batches?.name ?? 'Unknown Batch';
      const semesterName = item.semesters?.name           ?? 'Unknown Semester';
      const key = `${batchName}__${semesterName}`;
      if (!map.has(key)) map.set(key, { batchName, semesterName, items: [] });
      map.get(key)!.items.push(item);
    }
    let arr = Array.from(map.values());
    arr.sort((a, b) => {
      const si = SEMESTER_ORDER.indexOf(a.semesterName);
      const sj = SEMESTER_ORDER.indexOf(b.semesterName);
      const semCmp = semAscending ? si - sj : sj - si;
      if (semCmp !== 0) return semCmp;
      const bi = parseInt(a.batchName), bj = parseInt(b.batchName);
      return batchDescending ? bj - bi : bi - bj;
    });
    return arr;
  }, [results, semAscending, batchDescending]);

  // ── Toggle helpers ────────────────────────────────────────────────────────────
  const toggleCollapsed = (key: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleBatch    = (id: string) =>
    setSelBatches(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSemester = (id: string) =>
    setSelSemesters(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const batchCountLabel = selBatches.length   === 0 ? 'All batches'   : `${selBatches.length} selected`;
  const semCountLabel   = selSemesters.length === 0 ? 'All semesters' : `${selSemesters.length} selected`;
  const hasResults      = grouped.length > 0;
  const hasDrive        = driveResults.length > 0 || driveSearching;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link"><Home size={16} /> Home</Link>

          {/* Drive toggle */}
          <button
            onClick={() => setDriveEnabled(e => {
              if (e) { driveAbortRef.current?.abort(); setDriveResults([]); setDriveSearching(false); }
              return !e;
            })}
            title={driveEnabled ? 'Drive search ON — click to disable' : 'Drive search OFF — click to enable'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 20, fontSize: 12,
              fontWeight: 600, border: '1px solid var(--border)',
              background: driveEnabled ? 'rgba(37,99,235,0.1)' : 'var(--surface)',
              color: driveEnabled ? 'var(--primary-blue)' : 'var(--muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Wifi size={13} />
            Drive {driveEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Apps dropdown */}
          <div className="apps-dropdown" ref={appsRef}>
            <button className="apps-btn" onClick={() => setShowApps(s => !s)} title="Quick Access" aria-label="Open semester navigation">
              <LayoutGrid size={22} />
            </button>
            <div className={`apps-dropdown-content${showApps ? ' show' : ''}`}>
              <div className="apps-grid">
                {BBA_SEMS_FIXED.map(({ num, ord }) => (
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

      {/* ── Search section ────────────────────────────────────────────────────── */}
      <main className={`transition-all duration-500 ${hasResults ? 'pt-16' : 'pt-40'}`}>
        <div className="max-w-screen-sm mx-auto px-4">

          {/* Logo */}
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
              placeholder="Search courses, teachers, or files…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', gap: 6, alignItems: 'center' }}>
              {driveSearching && <span title="Searching Drive files…"><Loader2 size={14} className="animate-spin" style={{ color: '#60a5fa' }} /></span>}
              {loading
                ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary-blue)' }} />
                : <Search size={18} />}
            </div>
          </div>

          {/* Advanced toggle */}
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

          {/* Filters panel */}
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

      {/* ── Results section ───────────────────────────────────────────────────── */}
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

            {/* Grouped metadata results */}
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
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {group.items.length} course{group.items.length !== 1 ? 's' : ''}
                      </span>
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

            {/* ── Drive Results Panel ─────────────────────────────────────────── */}
            {(hasDrive || driveEnabled) && searchTerm.trim().length >= 3 && (
              <div style={{ marginTop: 16 }}>
                <DriveResultsPanel
                  results={driveResults}
                  searching={driveSearching}
                  searched={driveSearched}
                  total={driveTotal}
                  visible={drivePanelOpen}
                  onToggle={() => setDrivePanelOpen(o => !o)}
                />
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !hasResults && !searchTerm && (
          <p className="search-stats-subtle">Ready! Enter search terms or apply filters to find resources.</p>
        )}
      </div>

      {/* Drive panel styles */}
      <style jsx>{`
        .drive-results-panel {
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          background: var(--card-bg);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .drive-results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .drive-results-header:hover { background: var(--hover); }
        .drive-result-count {
          display: inline-flex;
          align-items: center;
          background: rgba(37,99,235,0.1);
          color: var(--primary-blue);
          border-radius: 20px;
          padding: 1px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .drive-results-body {
          padding: 0 4px 8px;
          max-height: 500px;
          overflow-y: auto;
        }
        .drive-result-group {
          margin: 8px 4px 0;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .drive-result-group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .drive-result-file-list {
          list-style: none;
          margin: 0;
          padding: 4px 0;
        }
        .drive-result-file-item {}
        .drive-result-file-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          text-decoration: none;
          color: var(--text-primary);
          transition: background 0.12s;
        }
        .drive-result-file-link:hover { background: var(--hover); }
        .drive-result-file-icon { font-size: 15px; flex-shrink: 0; }
        .drive-result-file-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .drive-result-file-name {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .drive-result-file-path {
          font-size: 11px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
