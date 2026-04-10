'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Trash2, 
  X, 
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getAllUsers, updateProfile, deleteProfile } from '@/app/admin/actions';
import ConfirmModal from './ConfirmModal';

interface UserData {
  id: string;
  email: string | undefined;
  role: string | null;
  batch_id: string | null;
  has_profile: boolean;
}

interface UserManagementProps {
  batches: any[];
}

export default function UserManagement({ batches }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    userId: string;
    email: string;
  }>({
    isOpen: false,
    userId: '',
    email: ''
  });

  useEffect(() => {
    refreshUsers();
  }, []);

  async function refreshUsers() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data as UserData[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(userId: string, role: any, batchId: string | null) {
    setSaving(userId);
    try {
      await updateProfile(userId, role, batchId);
      await refreshUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(userId: string) {
    setSaving(userId);
    try {
      await deleteProfile(userId);
      await refreshUsers();
      setConfirmConfig({ isOpen: false, userId: '', email: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    } finally {
      setSaving(null);
    }
  }

  const triggerDelete = (userId: string, email: string | undefined) => {
    setConfirmConfig({
      isOpen: true,
      userId,
      email: email || 'this user'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-surface-lowest rounded-xl border border-outline-variant/30 shadow-ambient">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-muted font-medium tracking-tight">Loading user community...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/5 border border-error/20 p-4 rounded-xl flex items-center gap-3 text-error text-sm animate-fade-in">
          <AlertCircle size={18} />
          <p className="font-semibold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-error/10 rounded-full transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="bg-surface-lowest rounded-xl border border-outline-variant/30 shadow-ambient overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-low/50 border-b border-outline-variant/20">
              <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">User Email</th>
              <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Access Role</th>
              <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">Assigned Batch</th>
              <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted italic">No users found in the system.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-surface-low/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface text-sm tracking-tight">{user.email}</span>
                      <span className="text-[10px] text-muted font-mono mt-0.5 truncate max-w-[120px]">{user.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`
                        text-xs font-bold px-3 py-1.5 rounded-lg border outline-none transition-all
                        ${user.role === 'MASTER_ADMIN' 
                          ? 'bg-tertiary/10 text-tertiary border-tertiary/20' 
                          : user.role === 'REPRESENTATIVE' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-surface-container text-muted border-outline-variant/30'}
                      `}
                      value={user.role || ''}
                      onChange={(e: any) => handleUpdate(user.id, e.target.value, user.batch_id)}
                      disabled={saving === user.id}
                    >
                      <option value="">No Access</option>
                      <option value="REPRESENTATIVE">Representative</option>
                      <option value="MASTER_ADMIN">Master Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'REPRESENTATIVE' ? (
                      <select 
                        className="text-xs font-semibold px-3 py-1.5 bg-surface-lowest border border-outline-variant/30 rounded-lg outline-none focus:border-primary transition-all w-full max-w-[200px]"
                        value={user.batch_id || ''}
                        onChange={(e) => handleUpdate(user.id, user.role, e.target.value)}
                        disabled={saving === user.id}
                      >
                        <option value="">Select Batch...</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} Batch</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-outline-variant text-xs italic">— All Batches —</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {saving === user.id ? (
                        <Loader2 className="animate-spin text-primary" size={18} />
                      ) : (
                        user.has_profile && (
                          <button 
                            onClick={() => triggerDelete(user.id, user.email)}
                            className="p-2 text-muted hover:text-error hover:bg-error/5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove Profile"
                          >
                            <Trash2 size={16} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-on-surface mb-1 tracking-tight font-display">Administrative Help</h4>
          <p className="text-xs text-muted leading-relaxed max-w-xl">
            This panel lists all authentication accounts. Assign a <strong>Representative</strong> role linked to a specific batch to grant limited access. <strong>Master Admins</strong> have full control over all academic data and user permissions.
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={() => handleDelete(confirmConfig.userId)}
        title="Remove Profile"
        message={`Are you sure you want to remove the profile for ${confirmConfig.email}? This will revoke their access.`}
      />
    </div>
  );
}
