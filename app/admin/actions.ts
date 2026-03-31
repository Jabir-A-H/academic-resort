'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Using Service Role Key for Admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Lists all users from auth.users and matches them with their profiles.
 */
export async function getAllUsers() {
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw authError;

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*');
  if (profileError) throw profileError;

  // Merge auth data with profile data
  return authUsers.users.map(user => {
    const profile = profiles.find(p => p.id === user.id);
    return {
      id: user.id,
      email: user.email,
      role: profile?.role || null,
      batch_id: profile?.batch_id || null,
      has_profile: !!profile
    };
  });
}

/**
 * Creates or updates a profile for a specific user.
 */
export async function updateProfile(userId: string, role: 'MASTER_ADMIN' | 'REPRESENTATIVE', batchId: string | null) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      role,
      batch_id: batchId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Removes a profile entry.
 */
export async function deleteProfile(userId: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Teacher CRUD Actions
 */
export async function upsertTeacher(teacherData: any) {
  const { error } = await supabaseAdmin
    .from('teachers')
    .upsert(teacherData, { onConflict: 'id' });

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  const { error } = await supabaseAdmin
    .from('teachers')
    .delete()
    .eq('id', teacherId);

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Section & Course Actions
 */
export async function addCourseWithDefaultSections(semesterId: string, courseId: string, sections: string[] = ['A', 'B', 'C']) {
  // 1. Create the batch_course
  const { data: batchCourse, error: bcError } = await supabaseAdmin
    .from('batch_courses')
    .insert({
      semester_id: semesterId,
      course_id: courseId
    })
    .select()
    .single();

  if (bcError) throw bcError;

  // 2. Add default sections
  const sectionsToInsert = sections.map(name => ({
    batch_course_id: batchCourse.id,
    name,
    teacher_id: null
  }));

  const { error: secError } = await supabaseAdmin
    .from('sections')
    .insert(sectionsToInsert);

  if (secError) throw secError;

  revalidatePath('/admin');
  return { success: true, batchCourseId: batchCourse.id };
}

export async function addSectionToCourse(batchCourseId: string, sectionName: string) {
  const { error } = await supabaseAdmin
    .from('sections')
    .insert({
      batch_course_id: batchCourseId,
      name: sectionName,
      teacher_id: null
    });

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteSectionFromCourse(sectionId: string) {
  const { error } = await supabaseAdmin
    .from('sections')
    .delete()
    .eq('id', sectionId);

  if (error) throw error;
  revalidatePath('/admin');
  return { success: true };
}
