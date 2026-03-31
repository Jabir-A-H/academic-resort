'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Linkedin, 
  Facebook, 
  Loader2, 
  Save 
} from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  teacher?: any;
}

export default function TeacherModal({ isOpen, onClose, onSave, teacher }: TeacherModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    du_profile_url: '',
    linkedin_url: '',
    facebook_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        du_profile_url: teacher.du_profile_url || '',
        linkedin_url: teacher.linkedin_url || '',
        facebook_url: teacher.facebook_url || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        du_profile_url: '',
        linkedin_url: '',
        facebook_url: ''
      });
    }
  }, [teacher, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              {teacher ? <Save size={20} /> : <User size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {teacher ? 'Edit Teacher Profile' : 'Register New Teacher'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Registry Entry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex items-center gap-2">
              <span className="shrink-0">⚠️</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 shadow-sm"
                  placeholder="Prof. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contact Phone</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 shadow-sm"
                  placeholder="+880 1XXX-XXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 shadow-sm"
                  placeholder="teacher@du.ac.bd"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">DU Profile URL</label>
              <div className="relative group">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 shadow-sm"
                  placeholder="https://du.ac.bd/faculty/detail/..."
                  value={formData.du_profile_url}
                  onChange={(e) => setFormData({...formData, du_profile_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1 text-blue-700">LinkedIn Profile</label>
              <div className="relative group">
                <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 shadow-sm placeholder:text-blue-200"
                  placeholder="linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1 text-indigo-700">Facebook Profile</label>
              <div className="relative group">
                <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-gray-700 shadow-sm placeholder:text-indigo-200"
                  placeholder="facebook.com/..."
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                />
              </div>
            </div>
          </div>
        </form>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white text-gray-600 border border-gray-200 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 px-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (teacher ? 'Update Registry' : 'Add to Registry')}
          </button>
        </footer>
      </div>
    </div>
  );
}
