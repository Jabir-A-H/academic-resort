'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, LayoutGrid, Home, ChevronDown, Settings2, Loader2, Wifi, ExternalLink,
} from 'lucide-react';
import { searchFilesInFolders, mimeIcon, type DriveSearchResult, type FolderConfig } from '@/lib/drive';
import { getAllDriveFolderConfigs } from '@/lib/database';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface TreeNode {
  name: string;
  driveId?: string;           // Drive folder ID for linking (if known)
  children: Record<string, TreeNode>;
  files: DriveSearchResult[];
  hasMatchingContent: boolean;
}
// semester → batch → tree-root
type SemTree = Record<string, Record<string, TreeNode>>;

// ─── Constants ──────────────────────────────────────────────────────────────────
const SEMESTER_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','mba-1st','mba-2nd'];

function semLabel(s: string) {
  return s.startsWith('mba-')
    ? `MBA ${s.replace('mba-','')} Semester`
    : `${s.charAt(0).toUpperCase()}${s.slice(1)} Semester`;
}

function toOrdinal(n: number) {
  if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd';
  return `${n}th`;
}

// ─── Build hierarchical tree from flat file results + folder registry ─────────────────
function buildTree(results: DriveSearchResult[], folderRegistry: Map<string, string>): SemTree {
  const tree: SemTree = {};
  for (const file of results) {
    const { semester, batch } = file;
    if (!tree[semester]) tree[semester] = {};
    if (!tree[semester][batch]) {
      tree[semester][batch] = { name: 'root', children: {}, files: [], hasMatchingContent: true };
    }
    // path is like "Accounting / Chapter 1" or "Root" for top-level files
    const pathParts = (!file.path || file.path === 'Root') ? [] : file.path.split(' / ').filter(Boolean);
    let node = tree[semester][batch];
    let builtPath = '';
    for (const part of pathParts) {
      builtPath = builtPath ? `${builtPath} / ${part}` : part;
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          driveId: folderRegistry.get(builtPath),  // attach Drive ID if we have it
          children: {},
          files: [],
          hasMatchingContent: false,
        };
      } else if (!node.children[part].driveId) {
        node.children[part].driveId = folderRegistry.get(builtPath);
      }
      node.children[part].hasMatchingContent = true;
      node = node.children[part];
    }
    node.files.push(file);
  }
  return tree;
}

// ─── Recursive tree renderer ─────────────────────────────────────────────────────
function DriveTreeNode({ node }: { node: TreeNode }) {
  const folders = Object.entries(node.children).sort(([a],[b]) => a.localeCompare(b));
  const files = [...node.files].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <>
      {folders.map(([name, child]) => (
        <div key={name} className="tree-folder-group">
          {/* Folder row */}
          <div className={`file-item folder-row ${child.hasMatchingContent ? 'matching-folder' : 'parent-folder'}`}>
            <span className="file-icon">{child.hasMatchingContent ? '📁' : '📂'}</span>
            <span className="file-name" style={{ opacity: child.hasMatchingContent ? 1 : 0.55 }}>
              {name}
            </span>
            {child.driveId && (
              <a
                href={`https://drive.google.com/drive/folders/${child.driveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="folder-open-link"
                title={`Open “${name}” in Google Drive`}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          {/* Children block (adds visual guide line and indent automatically) */}
          <div className="tree-children">
            <DriveTreeNode node={child} />
          </div>
        </div>
      ))}
      {files.map((file, i) => (
        <div key={i} className="file-item">
          <span className="file-icon">{mimeIcon(file.mimeType)}</span>
          <a
            href={file.link}
            target="_blank"
            rel="noopener noreferrer"
            className="file-name file-name-link"
            title={file.name}
          >
            {file.name}
          </a>
        </div>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────────
export default function AcademicResort() {
  // Drive folder configs (loaded once on mount)
  const [allConfigs, setAllConfigs] = useState<FolderConfig[]>([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm]   = useState('');
  const [searching,  setSearching]    = useState(false);
  const [searched,   setSearched]     = useState(0);
  const [total,      setTotal]        = useState(0);
  const [driveResults, setDriveResults] = useState<DriveSearchResult[]>([]);
  const [driveEnabled, setDriveEnabled] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  // Populated during search traversal: folder-path → Drive folder ID
  const folderRegistryRef = useRef<Map<string, string>>(new Map());

  // Filter state
  const [selBatches,   setSelBatches]   = useState<string[]>([]);
  const [selSemesters, setSelSemesters] = useState<string[]>([]);
  const [batchOpen,    setBatchOpen]    = useState(false);
  const [semOpen,      setSemOpen]      = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Display options
  const [semAscending,    setSemAscending]    = useState(true);
  const [batchDescending, setBatchDescending] = useState(true);
  const [ctrlOpen, setCtrlOpen] = useState(false);

  // Collapsible accordion state
  const [collapsedSems,    setCollapsedSems]    = useState<Set<string>>(new Set());
  const [collapsedBatches, setCollapsedBatches] = useState<Set<string>>(new Set());

  // UI
  const [showApps, setShowApps] = useState(false);
  const appsRef    = useRef<HTMLDivElement>(null);
  const ctrlRef    = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // ── Load Drive folder configs from Supabase on mount ─────────────────────────
  useEffect(() => {
    getAllDriveFolderConfigs().then(configs => {
      setAllConfigs(configs.map(c => ({
        folderId: c.folderId,
        semester: c.semester,
        batch: c.batch,
        label: c.batch,
      })));
      setConfigsLoaded(true);
    });
  }, []);

  // ── Derived filter options ─────────────────────────────────────────────────────
  const uniqueBatches = useMemo(() =>
    [...new Set(allConfigs.map(c => c.batch))].sort((a,b) => {
      const ai = parseInt(a), bi = parseInt(b);
      return isNaN(ai) || isNaN(bi) ? a.localeCompare(b) : bi - ai;
    }),
    [allConfigs]
  );

  const uniqueSemesters = useMemo(() =>
    [...new Set(allConfigs.map(c => c.semester))].sort(
      (a,b) => SEMESTER_ORDER.indexOf(a) - SEMESTER_ORDER.indexOf(b)
    ),
    [allConfigs]
  );

  // ── Configs filtered by selections ─────────────────────────────────────────────
  const activeConfigs = useMemo(() =>
    allConfigs.filter(c => {
      if (selBatches.length   > 0 && !selBatches.includes(c.batch))       return false;
      if (selSemesters.length > 0 && !selSemesters.includes(c.semester))  return false;
      return true;
    }),
    [allConfigs, selBatches, selSemesters]
  );

  // ── Outside-click handlers ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (appsRef.current    && !appsRef.current.contains(e.target as Node))    setShowApps(false);
      if (ctrlRef.current    && !ctrlRef.current.contains(e.target as Node))    setCtrlOpen(false);
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setBatchOpen(false); setSemOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Run Drive search ──────────────────────────────────────────────────────────
  const runSearch = useCallback(async (term: string, configs: FolderConfig[]) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // Fresh registry for this search
    folderRegistryRef.current = new Map();

    setDriveResults([]);
    setSearching(true);
    setSearched(0);
    setTotal(configs.length);
    setCollapsedSems(new Set());
    setCollapsedBatches(new Set());

    try {
      const final = await searchFilesInFolders(
        configs, term, 4, ctrl.signal,
        (results, searched, total) => {
          if (ctrl.signal.aborted) return;
          setDriveResults(results);
          setSearched(searched);
          setTotal(total);
        },
        folderRegistryRef.current  // ← pass registry so folder IDs are captured
      );
      if (!ctrl.signal.aborted) {
        setDriveResults(final);
        setSearching(false);
      }
    } catch {
      if (!ctrl.signal.aborted) setSearching(false);
    }
  }, []);

  // ── Debounced search trigger ──────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      abortRef.current?.abort();
      setDriveResults([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(() => {
      if (driveEnabled && activeConfigs.length > 0) {
        runSearch(searchTerm.trim(), activeConfigs);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, activeConfigs, driveEnabled, runSearch]);

  // ── Build tree ────────────────────────────────────────────────────────────────
  const tree = useMemo(() => buildTree(driveResults, folderRegistryRef.current), [driveResults]);

  // ── Sort semesters ────────────────────────────────────────────────────────────
  const sortedSems = useMemo(() =>
    Object.keys(tree).sort((a,b) => {
      const ai = SEMESTER_ORDER.indexOf(a), bi = SEMESTER_ORDER.indexOf(b);
      return semAscending ? ai - bi : bi - ai;
    }),
    [tree, semAscending]
  );

  const sortedBatchEntries = (batchMap: Record<string, TreeNode>) =>
    Object.entries(batchMap).sort(([a],[b]) => {
      const ai = parseInt(a), bi = parseInt(b);
      return isNaN(ai) || isNaN(bi) ? 0 : (batchDescending ? bi - ai : ai - bi);
    });

  // ── Toggle helpers ────────────────────────────────────────────────────────────
  const toggleSem   = (s: string) => setCollapsedSems(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const toggleBatch = (k: string) => setCollapsedBatches(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const expandAll  = () => { setCollapsedSems(new Set()); setCollapsedBatches(new Set()); };
  const collapseAllSems   = () => setCollapsedSems(new Set(sortedSems));
  const collapseAllBatches = () => {
    const keys: string[] = [];
    for (const sem of Object.keys(tree)) for (const b of Object.keys(tree[sem])) keys.push(`${sem}__${b}`);
    setCollapsedBatches(new Set(keys));
  };

  const hasResults = driveResults.length > 0 || searching;
  const progressPct = total > 0 ? Math.round((searched / total) * 100) : 0;

  const BBA_SEMS = [1,2,3,4,5,6,7,8].map(n => ({ num: n, ord: toOrdinal(n) }));

  return (
    <div className="min-h-screen relative flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <header className="google-header">
        <div className="header-right">
          <Link href="/" className="home-link"><Home size={16} /> Home</Link>

          {/* Drive toggle */}
          <button
            onClick={() => setDriveEnabled(e => {
              if (e) { abortRef.current?.abort(); setDriveResults([]); setSearching(false); }
              return !e;
            })}
            title={driveEnabled ? 'Drive search ON — click to disable' : 'Drive search OFF — click to enable'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)',
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

      {/* ── Search section ──────────────────────────────────────────────────────── */}
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
              placeholder="Search academic resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', gap: 6, alignItems: 'center' }}>
              {searching
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
                Narrow search by batch or semester
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
                    <span className="filter-count">{selBatches.length === 0 ? 'All batches' : `${selBatches.length} selected`}</span>
                  </div>
                  <span className="filter-arrow">▼</span>
                </div>
                <div className={`filter-dropdown-content${batchOpen ? ' show' : ''}`}>
                  {uniqueBatches.map(b => (
                    <div key={b} className="filter-option" onClick={() =>
                      setSelBatches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])
                    }>
                      <input type="checkbox" readOnly checked={selBatches.includes(b)} id={`b_${b}`} />
                      <label htmlFor={`b_${b}`}>{b}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semester filter */}
              <div className="filter-item">
                <div
                  className={`filter-button${semOpen ? ' active' : ''}`}
                  onClick={() => { setSemOpen(s => !s); setBatchOpen(false); }}
                  role="button" tabIndex={0}
                >
                  <div className="filter-button-text">
                    <span className="filter-label">Semesters</span>
                    <span className="filter-count">{selSemesters.length === 0 ? 'All semesters' : `${selSemesters.length} selected`}</span>
                  </div>
                  <span className="filter-arrow">▼</span>
                </div>
                <div className={`filter-dropdown-content${semOpen ? ' show' : ''}`}>
                  {uniqueSemesters.map(s => (
                    <div key={s} className="filter-option" onClick={() =>
                      setSelSemesters(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
                    }>
                      <input type="checkbox" readOnly checked={selSemesters.includes(s)} id={`s_${s}`} />
                      <label htmlFor={`s_${s}`}>{semLabel(s)}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Results section ──────────────────────────────────────────────────────── */}
      <div className="search-results-container" id="searchResultsContainer" style={{ marginTop: hasResults ? 8 : 0 }}>

        {/* Loading bar */}
        <div className="max-w-screen-md mx-auto px-4 w-full">
          <div className={`retro-loading-container${searching ? ' active' : ''}`}>
            <div className="simple-loading-bar"><div className="loading-bar-fill" /></div>
          </div>
        </div>

        {(hasResults || (!searching && searchTerm.trim().length >= 2)) && (
          <div className="max-w-screen-md mx-auto px-4 w-full">

            {/* Results header */}
            <div className="results-header" id="resultControls" style={{ display: hasResults || !searching ? 'flex' : 'none' }}>
              <div className="results-status" id="resultsStats">
                {searching
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
                      <Loader2 size={13} className="animate-spin" />
                      Searching {searched}/{total} folders{progressPct > 0 ? ` (${progressPct}%)` : ''}
                      {driveResults.length > 0 && <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>· {driveResults.length} found so far</span>}
                    </span>
                  : driveResults.length === 0
                  ? <span style={{ color: 'var(--muted)', fontSize: 13 }}>No matching files found. Try different search terms.</span>
                  : <span>Found {driveResults.length} result{driveResults.length !== 1 ? 's' : ''}</span>
                }
              </div>

              {/* Display options */}
              {driveResults.length > 0 && (
                <div className="result-controls" ref={ctrlRef}>
                  <button
                    className={`controls-dropdown-btn${ctrlOpen ? ' open' : ''}`}
                    onClick={() => setCtrlOpen(s => !s)}
                  >
                    <Settings2 size={14} /> Display Options <ChevronDown size={12} />
                  </button>
                  <div className={`controls-dropdown-menu${ctrlOpen ? ' show' : ''}`}>
                    <button className="controls-dropdown-item" onClick={() => { expandAll(); setCtrlOpen(false); }}>📂 Expand All</button>
                    <button className="controls-dropdown-item" onClick={() => { collapseAllSems(); setCtrlOpen(false); }}>📁 Collapse All</button>
                    <button className="controls-dropdown-item" onClick={() => { collapseAllBatches(); setCtrlOpen(false); }}>🗂️ Minimize Batches</button>
                    <button className="controls-dropdown-item" onClick={() => { setSemAscending(s => !s); setCtrlOpen(false); }}>
                      📊 Semester: {semAscending ? 'Ascending' : 'Descending'}
                    </button>
                    <button className="controls-dropdown-item" onClick={() => { setBatchDescending(s => !s); setCtrlOpen(false); }}>
                      🎓 Batch: {batchDescending ? 'Newest first' : 'Oldest first'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {searching && total > 0 && (
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, var(--primary-blue), #60a5fa)',
                  transition: 'width 0.4s ease', borderRadius: 2,
                }} />
              </div>
            )}

            {/* Semester → Batch → Tree */}
            <div id="all-resources">
              {sortedSems.map(semester => {
                const isSemCollapsed = collapsedSems.has(semester);
                return (
                  <div key={semester} className="semester-group">
                    {/* Semester header (h2 accordion) */}
                    <div className="semester-header" onClick={() => toggleSem(semester)}>
                      <h2>
                        <button className="accordion-btn" aria-expanded={!isSemCollapsed}>
                          <span className="accordion-icon">{isSemCollapsed ? '▶' : '▼'}</span>
                          {semLabel(semester).toUpperCase()}
                        </button>
                      </h2>
                    </div>

                    {/* Semester content */}
                    {!isSemCollapsed && (
                      <div className="semester-content" id={`semester-${semester}`}>
                        {sortedBatchEntries(tree[semester]).map(([batch, batchNode]) => {
                          const batchKey = `${semester}__${batch}`;
                          const isBatchCollapsed = collapsedBatches.has(batchKey);
                          const fileCount = driveResults.filter(r => r.semester === semester && r.batch === batch).length;

                          return (
                            <div key={batch} className="batch-group">
                              {/* Batch header (h3 accordion) */}
                              <div className="batch-header-item" onClick={() => toggleBatch(batchKey)}>
                                <h3>
                                  <button className="accordion-btn" aria-expanded={!isBatchCollapsed}>
                                    <span className="accordion-icon">{isBatchCollapsed ? '▶' : '▼'}</span>
                                    {batch}
                                  </button>
                                </h3>
                                <span className="batch-file-count">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                              </div>

                              {/* Batch content — file tree */}
                              {!isBatchCollapsed && (
                                <div className="batch-content" id={`batch-${semester}-${batch}`}>
                                  <div className="tree-results">
                                    <DriveTreeNode node={batchNode} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Empty state */}
        {!searching && !hasResults && !searchTerm.trim() && (
          <div className="max-w-screen-sm mx-auto px-4">
            <p className="search-stats-subtle">
              {configsLoaded
                ? `Ready! ${allConfigs.length} semester folder${allConfigs.length !== 1 ? 's' : ''} indexed. Enter search terms to find files.`
                : 'Loading folder index...'}
            </p>
          </div>
        )}
      </div>

      {/* ── Tree & result styles ─────────────────────────────────────────────────── */}
      <style jsx global>{`
        .search-results-container {
          padding-bottom: 60px;
        }
        /* Semester group */
        .semester-group {
          margin-bottom: 16px;
        }
        .semester-header {
          cursor: pointer;
          user-select: none;
        }
        .semester-header h2 {
          margin: 0;
        }
        .accordion-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .accordion-btn:hover { 
          background: var(--hover);
        }
        .accordion-icon {
          font-size: 11px;
          color: var(--muted);
          flex-shrink: 0;
        }

        /* Semester content */
        .semester-content {
          margin: 8px 0 0 0;
          padding-left: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Batch group */
        .batch-group {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          background: var(--card-bg);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .batch-header-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-right: 16px;
          background: var(--card-bg);
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid transparent;
          transition: background 0.15s;
        }
        .batch-header-item:hover { background: var(--hover); }
        .batch-header-item h3 {
          flex: 1;
          margin: 0;
        }
        .batch-header-item .accordion-btn {
          border: none;
          border-radius: 0;
          background: transparent;
          padding: 12px 18px;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .batch-header-item .accordion-btn:hover { background: transparent; box-shadow: none; }
        .batch-file-count {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
          font-weight: 500;
          padding-left: 12px;
        }

        /* Batch content / tree */
        .batch-content {
          border-top: 1px solid var(--border);
          background: var(--card-bg);
          padding-left: 8px; /* start offset for the root tree */
        }
        .tree-results {
          padding: 8px 0;
        }

        /* Tree generic item row */
        .file-item {
          display: flex;
          flex-wrap: nowrap; /* Prevent icon wrapping */
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          margin: 2px 0;
          font-size: 13.5px;
          transition: background 0.12s ease, color 0.12s ease;
          color: var(--text-primary);
          cursor: default;
          border-radius: 6px;
        }
        .file-item:hover {
          background: var(--hover);
        }
        /* Folder rows: not interactive, just label */
        .folder-row {
          cursor: default;
        }
        /* File name link — only the text is clickable */
        .file-name-link {
          color: inherit;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .file-name-link:hover {
          color: var(--primary-blue);
          text-decoration: underline;
        }
        .matching-folder {
          color: var(--primary-blue);
          font-weight: 600;
        }
        .parent-folder {
          color: var(--muted);
        }
        .file-icon {
          font-size: 15px;
          flex-shrink: 0;
          line-height: 1;
        }
        .file-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Vertical indent guide lines */
        :root { --tree-guide: rgba(0,0,0,0.15); }
        @media (prefers-color-scheme: dark) { :root { --tree-guide: rgba(255,255,255,0.15); } }
        
        .tree-children {
          margin-left: 9.5px;   /* Shift child block so its left border sits under the middle of the folder icon */
          padding-left: 12px;   /* Spacing between the vertical line and the content */
          border-left: 1.5px dashed var(--tree-guide);
        }

        /* Folder open-in-Drive icon */
        .folder-open-link {
          display: flex;
          align-items: center;
          margin-left: auto;
          padding: 4px;
          color: var(--muted);
          opacity: 0;           /* Hidden by default */
          border-radius: 4px;
          transition: opacity 0.15s, background 0.15s, color 0.15s;
        }
        .folder-row:hover .folder-open-link {
          opacity: 1;
        }
        .folder-open-link:hover {
          color: var(--primary-blue);
        }
      `}</style>

    </div>
  );
}
