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
