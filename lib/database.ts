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

  if (filters.batchId) {
    // Handling specific batch filter if needed
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
