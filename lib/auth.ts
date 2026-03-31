import { supabase } from './supabase';

export type UserRole = 'MASTER_ADMIN' | 'REPRESENTATIVE';

export interface UserProfile {
  id: string;
  role: UserRole;
  batch_id: string | null;
  email?: string;
}

/**
 * Fetches the current logged-in user's profile from the profiles table.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return {
    ...data,
    email: user.email,
  } as UserProfile;
}

/**
 * Utility to check if a user is a Master Admin.
 */
export function isMasterAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'MASTER_ADMIN';
}

/**
 * Utility to check if a user is a Representative for a specific batch.
 */
export function isRepresentativeForBatch(profile: UserProfile | null, batchId: string): boolean {
  if (profile?.role === 'MASTER_ADMIN') return true;
  return profile?.role === 'REPRESENTATIVE' && profile?.batch_id === batchId;
}
