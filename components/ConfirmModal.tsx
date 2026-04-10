'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  confirmVariant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-surface-lowest rounded-3xl shadow-ambient-lg w-full max-w-md overflow-hidden animate-scale-in border border-outline-variant/20">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmVariant === 'danger' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-muted hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-on-surface mb-2 tracking-tight font-display">
            {title}
          </h3>
          <p className="text-muted text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-surface-container text-on-surface rounded-2xl font-bold hover:bg-surface-high transition-all active:scale-95 text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white transition-all shadow-ambient active:scale-95 text-sm ${
                confirmVariant === 'danger' 
                  ? 'bg-error hover:bg-error/90' 
                  : 'bg-primary hover:bg-primary-container'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
