import { supabase } from './supabase'

export async function getBatches() {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .order('name', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getSemesters(batchId: string) {
  const { data, error } = await supabase
    .from('semesters')
    .select('*')
    .eq('batch_id', batchId)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function getCoursesBySemesterName(semesterName: string) {
  const { data, error } = await supabase
    .from('batch_courses')
    .select(`
      id,
      class_updates_url,
      courses (code, title),
      semesters!inner (name, drive_folder_id, batches (id, name)),
      sections (
        name,
        teachers (name)
      ),
      resource_links (category, title, url)
    `)
    .eq('semesters.name', semesterName)

  if (error) throw error
  return data || []
}

export async function searchResources(query: string, filters: { batchId?: string, semesterId?: string }) {
  let supabaseQuery = supabase
    .from('batch_courses')
    .select(`
      id,
      class_updates_url,
      courses (code, title),
      semesters (name, drive_folder_id, batches (name)),
      sections (
        name, 
        teachers (name)
      ),
      resource_links (category, title, url)
    `)

  if (filters.semesterId) {
    supabaseQuery = supabaseQuery.eq('semester_id', filters.semesterId)
  } else if (filters.batchId) {
    const { data: semesters, error: semErr } = await supabase
      .from('semesters')
      .select('id')
      .eq('batch_id', filters.batchId)
    if (semErr) throw semErr
    if (!semesters || semesters.length === 0) return []
    supabaseQuery = supabaseQuery.in('semester_id', semesters.map(s => s.id))
  }

  const { data, error } = await supabaseQuery
  if (error) throw error

  if (!query) return data

  return data.filter((item: any) => 
    item.courses.title.toLowerCase().includes(query.toLowerCase()) ||
    item.courses.code.includes(query) ||
    item.sections.some((s: any) => s.teachers?.name?.toLowerCase().includes(query.toLowerCase()))
  )
}

export async function getTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTeacherProfiles() {
  const { data, error } = await supabase
    .from('batch_courses')
    .select(`
      id,
      courses (code, title),
      semesters (name, batches (name)),
      sections (
        name,
        teachers (id, name, phone, email, du_profile_url, linkedin_url, facebook_url)
      )
    `);

  if (error) throw error;
  return data;
}

// ─── Drive folder mapping for homepage search ──────────────────────────────────
export async function getAllDriveFolderConfigs(): Promise<{ semester: string; batch: string; folderId: string }[]> {
  const { data, error } = await supabase
    .from('semesters')
    .select('name, drive_folder_id, batches!inner(name)')
    .not('drive_folder_id', 'is', null);

  if (error || !data) return [];

  return (data as any[]).map(row => ({
    semester: row.name as string,
    batch: (row.batches?.name ?? 'Unknown') as string,
    folderId: row.drive_folder_id as string,
  }));
}

export async function getCourseDetails(code: string) {
  // 1. Get the course info
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('code', code)
    .single()

  if (courseErr) throw courseErr

  // 2. Get all batch occurrences of this course
  const { data: occurrences, error: occErr } = await supabase
    .from('batch_courses')
    .select(`
      id,
      class_updates_url,
      course_id,
      semesters (
        name,
        drive_folder_id,
        batches (name)
      ),
      sections (
        name,
        teachers (name)
      ),
      resource_links (
        id,
        category,
        title,
        url
      )
    `)
    .eq('course_id', (course as any).id)

  if (occErr) throw occErr

  return {
    ...course,
    occurrences: occurrences || []
  }
}
