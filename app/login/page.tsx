'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/lib/auth';
import { Loader2, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        const profile = await getCurrentUserProfile();
        
        if (profile && (profile.role === 'MASTER_ADMIN' || (profile.role === 'REPRESENTATIVE' && profile.batch_id))) {
          router.push('/admin');
        } else {
          await supabase.auth.signOut();
          router.push('/login?error=pending');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Academic Resort
        </Link>
        <div className="text-4xl mb-4">🎓</div>
        <h2 className="text-center text-3xl font-extrabold text-on-surface tracking-tight font-display">
          Representative Login
        </h2>
        <p className="mt-2 text-center text-sm text-muted font-medium tracking-tight">
          Manage your batch academic resources
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-lowest py-8 px-6 shadow-ambient sm:rounded-2xl sm:px-10 border border-outline-variant/30">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 px-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm outline-none focus:bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-on-surface"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 px-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm outline-none focus:bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-on-surface"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {errorParam === 'pending' && (
              <div className="text-primary text-xs bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-3 animate-fade-in">
                <AlertCircle className="shrink-0" size={18} />
                <p className="font-semibold leading-relaxed">
                  Your account is ready! Please wait for the admin to approve your batch access.
                </p>
              </div>
            )}

            {error && (
              <div className="text-error text-xs bg-error/5 p-4 rounded-xl border border-error/20 flex items-center gap-2 animate-fade-in">
                <AlertCircle className="shrink-0" size={14} /> {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all shadow-ambient active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
