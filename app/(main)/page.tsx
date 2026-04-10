'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, LayoutGrid, Home, ChevronDown, Settings2, Loader2, Wifi, ExternalLink, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchFilesInFolders, mimeIcon, clearDriveCache, type DriveSearchResult, type FolderConfig } from '@/lib/drive';
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
        <div key={name} className="flex flex-col mb-1">
          {/* Folder row */}
          <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-colors cursor-default ${child.hasMatchingContent ? 'text-primary font-medium' : 'text-muted'}`}>
            <span className="flex-shrink-0 text-base leading-none">{child.hasMatchingContent ? '📁' : '📂'}</span>
            <span className="flex-1 truncate" style={{ opacity: child.hasMatchingContent ? 1 : 0.7 }}>
              {name}
            </span>
            {child.driveId && (
              <a
                href={`https://drive.google.com/drive/folders/${child.driveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto p-1 text-muted opacity-0 hover:opacity-100 hover:text-primary transition-all rounded"
                title={`Open “${name}” in Google Drive`}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          {/* Children block (adds visual guide line and indent automatically) */}
          <div className="ml-2.5 pl-3 border-l border-dashed border-outline-variant/50">
            <DriveTreeNode node={child} />
          </div>
        </div>
      ))}
      {files.map((file, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-2 text-sm text-on-surface hover:bg-surface-low rounded-lg transition-colors group">
          <span className="flex-shrink-0 text-base leading-none">{mimeIcon(file.mimeType)}</span>
          <a
            href={file.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate group-hover:text-primary group-hover:underline transition-colors"
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
  const [isBustingCache, setIsBustingCache] = useState(false);
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
  const runSearch = useCallback(async (term: string, configs: FolderConfig[], refresh = false) => {
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
        folderRegistryRef.current, // ← pass registry so folder IDs are captured
        refresh
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
      if (activeConfigs.length > 0) {
        runSearch(searchTerm.trim(), activeConfigs);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, activeConfigs, runSearch]);

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
    <div className="flex-1 relative flex flex-col w-full h-full">

      {/* ── Search section ──────────────────────────────────────────────────────── */}
      <main className={`transition-all duration-500 w-full flex flex-col ${hasResults ? 'justify-start pt-4' : 'flex-1 justify-center pb-32'}`}>
        <div className="max-w-screen-sm mx-auto px-4 w-full">

          {/* Hero */}
          <div className={`text-center transition-all duration-500 ${hasResults ? 'scale-90 origin-top mb-4 opacity-0 pointer-events-none absolute' : 'mb-12'}`}>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-on-surface mb-3 tracking-tight">
              Academic Resort
            </h1>
            <p className="text-base text-muted max-w-sm mx-auto">
              Curated course materials, efficiently organized for your semester.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full max-w-lg mx-auto mb-6 z-10">
            <input
              type="text"
              id="globalSearch"
              className="w-full px-6 py-4 bg-surface-lowest text-on-surface placeholder-muted border border-outline-variant/30 rounded-2xl shadow-ambient focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-base"
              placeholder="Search academic resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted flex flex-col items-center justify-center pointer-events-none">
              {searching
                ? <Loader2 size={20} className="animate-spin text-primary" />
                : <Search size={20} />}
            </div>
          </div>

          {/* Advanced toggle */}
          {!hasResults && (
            <div className="text-center">
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full ${showAdvanced ? 'text-primary bg-primary/10' : 'text-primary bg-transparent hover:bg-primary/5'}`}
                onClick={() => {
                  if (showAdvanced) {
                    setSelBatches([]);
                    setSelSemesters([]);
                  }
                  setShowAdvanced(s => !s);
                }}
              >
                {showAdvanced ? 'Search Globally' : 'Search Specifically'}
                <ChevronDown size={14} className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Filters panel */}
          <AnimatePresence>
            {showAdvanced && !hasResults && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 max-w-md mx-auto p-4 bg-surface-lowest rounded-2xl shadow-ambient border border-outline-variant/30 flex flex-col gap-3">
                  <p className="text-xs font-medium text-muted mx-1">
                    Narrow your search scope
                  </p>

                  {/* Batch filter */}
                  <div className="relative w-full">
                    <button
                      className={`w-full px-4 py-2.5 text-sm font-medium flex justify-between items-center rounded-xl border transition-colors ${batchOpen ? 'border-primary bg-surface-low text-primary' : 'border-outline-variant/30 bg-surface-lowest text-on-surface hover:border-primary/50'}`}
                      onClick={() => { setBatchOpen(s => !s); setSemOpen(false); }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Batches</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-muted">
                          {selBatches.length === 0 ? 'All' : selBatches.length}
                        </span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${batchOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {batchOpen && (
                      <div className="mt-1 bg-surface-low border border-outline-variant/30 rounded-xl max-h-52 overflow-y-auto z-20 flex flex-col absolute w-full left-0">
                        {uniqueBatches.map(b => (
                          <label key={b} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lowest border-b border-outline-variant/20 last:border-0 cursor-pointer text-sm text-on-surface transition-colors">
                            <input
                              type="checkbox"
                              checked={selBatches.includes(b)}
                              onChange={() => setSelBatches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                            />
                            {b}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Semester filter */}
                  <div className="relative w-full">
                    <button
                      className={`w-full px-4 py-2.5 text-sm font-medium flex justify-between items-center rounded-xl border transition-colors ${semOpen ? 'border-primary bg-surface-low text-primary' : 'border-outline-variant/30 bg-surface-lowest text-on-surface hover:border-primary/50'}`}
                      onClick={() => { setSemOpen(s => !s); setBatchOpen(false); }}
                    >
                      <div className="flex items-center gap-2">
                        <span>Semesters</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-muted">
                          {selSemesters.length === 0 ? 'All' : selSemesters.length}
                        </span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform ${semOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {semOpen && (
                      <div className="mt-1 bg-surface-low border border-outline-variant/30 rounded-xl max-h-52 overflow-y-auto z-20 flex flex-col absolute w-full left-0">
                        {uniqueSemesters.map(s => (
                          <label key={s} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lowest border-b border-outline-variant/20 last:border-0 cursor-pointer text-sm text-on-surface transition-colors">
                            <input
                              type="checkbox"
                              checked={selSemesters.includes(s)}
                              onChange={() => setSelSemesters(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                              className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                            />
                            {semLabel(s)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cache Control & Ready Status */}
                  <div className="mt-2 pt-3 border-t border-outline-variant/30 flex items-center justify-center gap-2">
                    <p className="m-0 text-xs text-muted">
                      {configsLoaded
                        ? `Ready! ${allConfigs.length} folders indexed.`
                        : 'Loading folder index...'}
                    </p>
                    {configsLoaded && (
                      <button
                        onClick={async () => {
                          const toFetch = activeConfigs.length > 0 ? activeConfigs : allConfigs;
                          setIsBustingCache(true);
                          clearDriveCache();
                          try {
                            await Promise.allSettled(
                              toFetch.map(c => fetch(`/api/drive?folderId=${c.folderId}&refresh=true`))
                            );
                          } finally {
                            setIsBustingCache(false);
                            if (searchTerm.trim().length >= 2) runSearch(searchTerm, activeConfigs, true);
                          }
                        }}
                        title="Refresh drive cache"
                        disabled={isBustingCache}
                        className="p-1 text-muted hover:text-on-surface transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isBustingCache ? 'animate-spin text-primary' : ''} />
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── Results section ──────────────────────────────────────────────────────── */}
      <div className={`mt-2 pb-16 ${hasResults ? 'block' : 'hidden'}`}>

        {/* Loading bar (Tailwind) */}
        <div className="max-w-screen-md mx-auto px-4 w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-4 opacity-0 transition-opacity aria-[busy=true]:opacity-100" aria-busy={searching}>
          <div className="h-full bg-primary/70 w-2/3 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] translate-x-[-100%]" style={{ animation: searching ? 'loadingBarFlow 1.4s linear infinite' : 'none' }} />
          <style dangerouslySetInnerHTML={{__html: `@keyframes loadingBarFlow { 0% { transform: translateX(-100%); width: 30%; } 50% { width: 60%; } 100% { transform: translateX(300%); width: 30%; } }`}} />
        </div>

        {(hasResults || (!searching && searchTerm.trim().length >= 2)) && (
          <div className="max-w-screen-md mx-auto px-4 w-full">

            {/* Results header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-outline-variant/30">
              <div className="text-sm font-medium text-muted">
                {searching
                  ? <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      Searching {searched}/{total} folders{progressPct > 0 ? ` (${progressPct}%)` : ''}
                      {driveResults.length > 0 && <span className="text-primary font-semibold ml-1">· {driveResults.length} found</span>}
                    </span>
                  : driveResults.length === 0
                  ? <span>No matching files found. Try different search terms.</span>
                  : <span>Found {driveResults.length} result{driveResults.length !== 1 ? 's' : ''}</span>
                }
              </div>

              {/* Display options */}
              {driveResults.length > 0 && (
                <div className="relative" ref={ctrlRef}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${ctrlOpen ? 'bg-surface-low border-primary text-primary' : 'bg-surface-lowest border-outline-variant/30 text-muted hover:border-primary/50'}`}
                    onClick={() => setCtrlOpen(s => !s)}
                  >
                    <Settings2 size={13} /> View Options <ChevronDown size={11} />
                  </button>
                  <AnimatePresence>
                    {ctrlOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1.5 w-48 bg-surface-lowest border border-outline-variant/30 shadow-ambient rounded-xl z-20 py-1"
                      >
                        <button className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-low hover:text-primary transition-colors flex items-center gap-2" onClick={() => { expandAll(); setCtrlOpen(false); }}>📂 Expand All</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-low hover:text-primary transition-colors flex items-center gap-2" onClick={() => { collapseAllSems(); setCtrlOpen(false); }}>📁 Collapse All</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-low hover:text-primary transition-colors flex items-center gap-2" onClick={() => { collapseAllBatches(); setCtrlOpen(false); }}>🗂️ Minimize Batches</button>
                        <div className="h-px bg-outline-variant/20 my-1"></div>
                        <button className="w-full text-left px-4 py-2 text-xs text-muted hover:bg-surface-low transition-colors" onClick={() => { setSemAscending(s => !s); setCtrlOpen(false); }}>
                          Semester: {semAscending ? 'Ascending' : 'Descending'}
                        </button>
                        <button className="w-full text-left px-4 py-2 text-xs text-muted hover:bg-surface-low transition-colors" onClick={() => { setBatchDescending(s => !s); setCtrlOpen(false); }}>
                          Batch: {batchDescending ? 'Newest first' : 'Oldest first'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            <div className="flex flex-col gap-4">
              {sortedSems.map(semester => {
                const isSemCollapsed = collapsedSems.has(semester);
                return (
                  <div key={semester} className="rounded-2xl border border-outline-variant/30 bg-surface-lowest overflow-hidden shadow-ambient">
                    {/* Semester header */}
                    <button 
                      className="w-full flex items-center gap-3 px-5 py-4 bg-surface text-on-surface hover:bg-surface-low transition-colors select-none"
                      onClick={() => toggleSem(semester)}
                      aria-expanded={!isSemCollapsed}
                    >
                      <span className="text-[11px] text-muted shrink-0 transition-transform duration-200" style={{ transform: isSemCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                      <h2 className="text-sm font-bold tracking-wide uppercase m-0 flex-1 text-left">
                        {semLabel(semester)}
                      </h2>
                    </button>

                    {/* Semester content */}
                    <AnimatePresence initial={false}>
                      {!isSemCollapsed && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
                            {sortedBatchEntries(tree[semester]).map(([batch, batchNode]) => {
                              const batchKey = `${semester}__${batch}`;
                              const isBatchCollapsed = collapsedBatches.has(batchKey);
                              const fileCount = driveResults.filter(r => r.semester === semester && r.batch === batch).length;

                              return (
                                <div key={batch} className="rounded-xl border border-outline-variant/20 bg-surface-lowest overflow-hidden">
                                  {/* Batch header */}
                                  <button 
                                    className="w-full flex items-center justify-between px-4 py-3 bg-surface-low hover:bg-surface-container transition-colors select-none"
                                    onClick={() => toggleBatch(batchKey)}
                                    aria-expanded={!isBatchCollapsed}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-muted shrink-0 transition-transform duration-200" style={{ transform: isBatchCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                                      <h3 className="text-sm font-semibold text-on-surface m-0 text-left">
                                        Batch {batch}
                                      </h3>
                                    </div>
                                    <span className="text-xs text-muted font-medium">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                                  </button>

                                  {/* Batch content */}
                                  <AnimatePresence initial={false}>
                                    {!isBatchCollapsed && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden bg-surface-lowest"
                                      >
                                        <div className="p-3 border-t border-outline-variant/20">
                                          <DriveTreeNode node={batchNode} />
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>


    </div>
  );
}
