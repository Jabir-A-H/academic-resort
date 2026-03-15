'use client';

import React, { useState, useEffect } from 'react';
import { Search, Grid, Home, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { searchResources, getBatches, getSemesters } from '@/lib/database';
import ResourceCard from '@/components/ResourceCard';

export default function AcademicResort() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const batchData = await getBatches();
        setBatches(batchData);
      } catch (err) {
        console.error('Failed to load batches:', err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    setSemesters([]);
    setSelectedSemesterId('');
    if (selectedBatchId) {
      getSemesters(selectedBatchId)
        .then(setSemesters)
        .catch(err => console.error('Failed to load semesters:', err));
    }
  }, [selectedBatchId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setLoading(true);
        try {
          const searchData = await searchResources(searchTerm, {});
          setResults(searchData);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleApplyFilters = async () => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const searchData = await searchResources(searchTerm, {
        batchId: selectedBatchId || undefined,
        semesterId: selectedSemesterId || undefined,
      });
      setResults(searchData);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Google-style Header */}
      <header className="google-header">
        <div className="header-right">
          <a href="#" className="home-link">
            <Home size={18} /> Home
          </a>
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowApps(!showApps)}
            >
              <Grid size={24} className="text-gray-600" />
            </button>
            {showApps && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-xl rounded-lg p-4 w-80 z-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <a key={sem} href="#" className="p-2 hover:bg-blue-50 rounded-lg group transition-all">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-md group-hover:scale-110 transition-transform">
                        {sem}
                      </div>
                      <span className="text-xs text-gray-600">{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Sem</span>
                    </a>
                  ))}
                  <a href="#" className="p-2 hover:bg-red-50 rounded-lg group transition-all">
                    <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-md group-hover:scale-110 transition-transform">
                      M
                    </div>
                    <span className="text-xs text-gray-600">MBA</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Search Section */}
      <main className={`transition-all duration-500 ${results.length > 0 ? 'pt-20' : 'pt-40'}`}>
        <div className="max-w-screen-md mx-auto px-4">
          <div className={`${results.length > 0 ? 'scale-75 origin-top mb-0' : 'mb-8'} transition-all duration-500 text-center`}>
            <div className="search-engine-logo text-6xl">🎓</div>
            <h1 className="search-engine-title text-4xl mt-2 font-bold text-gray-800">Academic Resort</h1>
          </div>

          {/* Search Box */}
          <div className="main-search-box relative max-w-xl mx-auto">
            <input
              type="text"
              className="main-search-input py-4 pr-12 pl-6 w-full rounded-full border-2 border-gray-200 focus:border-blue-500 outline-none shadow-sm focus:shadow-md transition-all text-lg"
              placeholder="Search academic resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
              {loading ? <Loader2 size={20} className="animate-spin text-blue-500" /> : <Search size={20} />}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          {!results.length && (
            <div className="options-toggle mt-6 text-center">
              <button 
                className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center mx-auto gap-2 transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Search {showAdvanced ? 'Specifically' : 'Globally'} 
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          )}

          {showAdvanced && !results.length && (
             <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-lg mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
               <p className="text-sm text-gray-500 mb-4 font-medium">Narrow your search by batch or semester</p>
               <div className="flex flex-col gap-3">
                 <div className="w-full">
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Batch</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500"
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                    >
                      <option value="">All Batches</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                 </div>
                 <div className="w-full">
                    <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Semester</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500"
                      value={selectedSemesterId}
                      onChange={(e) => setSelectedSemesterId(e.target.value)}
                      disabled={!selectedBatchId}
                    >
                      <option value="">All Semesters</option>
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name} Semester</option>)}
                    </select>
                 </div>
               </div>
               <button
                 className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
                 onClick={handleApplyFilters}
                 disabled={!searchTerm}
               >
                 Apply Filters & Search
               </button>
             </div>
          )}
        </div>
      </main>

      {/* Results Section */}
      <div className={`max-w-screen-md mx-auto px-4 mt-8 transition-opacity duration-500 ${results.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-6 pb-2 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">{results.length} resources found</span>
        </div>
        
        <div className="space-y-4">
          {results.map((res: any) => (
            <ResourceCard 
              key={res.id}
              course={res.courses}
              semester={res.semesters.name}
              batch={res.semesters.batches.name}
              sections={res.sections}
              links={res.resource_links}
              classUpdatesUrl={res.class_updates_url}
            />
          ))}
        </div>
      </div>

      {!searchTerm && (
        <div className="fixed bottom-12 left-0 right-0 text-center text-gray-300 pointer-events-none">
          <p className="text-sm italic">Ready! Enter search terms to find resources.</p>
        </div>
      )}
    </div>
  );
}
