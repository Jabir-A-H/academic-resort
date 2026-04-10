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

  const inputClass = "w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant/30 rounded-2xl text-sm outline-none focus:bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-on-surface";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-surface-lowest rounded-3xl shadow-ambient-lg w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col border border-outline-variant/20">
        <header className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-ambient">
              {teacher ? <Save size={20} /> : <User size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface tracking-tight font-display">
                {teacher ? 'Edit Teacher Profile' : 'Register New Teacher'}
              </h3>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Registry Entry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error/5 text-error text-xs rounded-xl border border-error/20 font-bold flex items-center gap-2">
              <span className="shrink-0">⚠️</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Full Name *</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  required
                  className={`${inputClass} ${!formData.name ? '' : ''}`}
                  placeholder="Prof. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Contact Phone</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  className={inputClass}
                  placeholder="+880 1XXX-XXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="email"
                  className={inputClass}
                  placeholder="teacher@du.ac.bd"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">DU Profile URL</label>
              <div className="relative group">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  className={inputClass}
                  placeholder="https://du.ac.bd/faculty/detail/..."
                  value={formData.du_profile_url}
                  onChange={(e) => setFormData({...formData, du_profile_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1 text-primary">LinkedIn Profile</label>
              <div className="relative group">
                <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  className={`${inputClass} bg-primary/5 border-primary/20 placeholder:text-primary/30`}
                  placeholder="linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1 text-secondary">Facebook Profile</label>
              <div className="relative group">
                <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50 group-focus-within:text-secondary transition-colors" size={18} />
                <input 
                  className={`${inputClass} bg-secondary/5 border-secondary/20 placeholder:text-secondary/30`}
                  placeholder="facebook.com/..."
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                />
              </div>
            </div>
          </div>
        </form>

        <footer className="p-6 border-t border-outline-variant/20 bg-surface-low/50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-surface-container text-on-surface border border-outline-variant/20 rounded-2xl font-bold hover:bg-surface-high transition-all active:scale-95 text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 px-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all shadow-ambient active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (teacher ? 'Update Registry' : 'Add to Registry')}
          </button>
        </footer>
      </div>
    </div>
  );
}
