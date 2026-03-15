'use client';

import React, { useState, ChangeEvent } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';

interface ExtractedLink {
  category: string;
  title: string;
  url: string;
  status: 'pending' | 'verifying' | 'done';
}

interface LinkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (links: Array<{ category: string, title: string, url: string }>) => Promise<void>;
  categories: string[];
}

export default function LinkImportModal({ isOpen, onClose, onSave, categories }: LinkImportModalProps) {
  const [urlInput, setUrlInput] = useState<string>('');
  const [extractedLinks, setExtractedLinks] = useState<ExtractedLink[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProcess = () => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    const processed: ExtractedLink[] = urls.map(url => {
      let category = categories[0];
      let title = 'New Resource';
      const lowerUrl = url.toLowerCase();
      
      if (lowerUrl.includes('book') || lowerUrl.includes('manual') || lowerUrl.includes('textbook')) {
        category = 'Books and Manuals';
        title = 'Textbook';
      } else if (lowerUrl.includes('slide') || lowerUrl.includes('lecture') || lowerUrl.includes('material')) {
        category = 'Slides and Materials';
        title = 'Lecture Material';
      } else if (lowerUrl.includes('question') || lowerUrl.includes('exam') || lowerUrl.includes('bank') || lowerUrl.includes('prev')) {
        category = 'Question Bank';
        title = 'Past Question';
      }
      
      return { url, category, title, status: 'pending' };
    });
    
    setExtractedLinks([...extractedLinks, ...processed]);
    setUrlInput('');
  };

  const handleSaveAll = async () => {
    setIsProcessing(true);
    try {
      await onSave(extractedLinks.map(({ category, title, url }) => ({ category, title, url })));
      setExtractedLinks([]);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const removeLink = (index: number) => {
    setExtractedLinks(extractedLinks.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof ExtractedLink, value: string) => {
    const newLinks = [...extractedLinks];
    (newLinks[index] as any)[field] = value;
    setExtractedLinks(newLinks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-gray-900 border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Smart Link Import</h2>
            <p className="text-sm text-gray-500">Paste multiple URLs to automatically categorize them.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Paste URLs (one per line)</label>
            <textarea 
              className="w-full h-32 p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-mono"
              placeholder="https://drive.google.com/..."
              value={urlInput}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setUrlInput(e.target.value)}
            />
            <button 
              onClick={handleProcess}
              disabled={!urlInput.trim()}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50 text-sm"
            >
              Analyze & Categorize
            </button>
          </div>

          {extractedLinks.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                Review Links ({extractedLinks.length})
                <button onClick={() => setExtractedLinks([])} className="text-red-500 hover:underline text-xs">Clear All</button>
              </label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">URL</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {extractedLinks.map((link, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 w-48">
                          <select 
                            className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-blue-500 text-gray-900"
                            value={link.category}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField(i, 'category', e.target.value)}
                          >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 w-64 text-gray-900">
                          <input 
                            type="text"
                            className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-blue-500"
                            value={link.title}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField(i, 'title', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="truncate max-w-[200px] text-blue-600 font-mono text-[10px]">{link.url}</div>
                        </td>
                        <td className="px-6 py-2 text-right">
                          <button onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500 p-1.5">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-all text-sm">
            Cancel
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={extractedLinks.length === 0 || isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save {extractedLinks.length} Links
          </button>
        </div>
      </div>
    </div>
  );
}
