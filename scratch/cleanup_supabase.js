const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error("Missing Supabase credentials"); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

const dir = path.join(__dirname, '..', '.designplans');

const semesterMap = {
  '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th',
  '5th': '5th', '6th': '6th', '7th': '7th', '8th': '8th',
  'MBA_1st': 'mba-1st', 'MBA_2nd': 'mba-2nd'
};

function extractBatchName(heading) {
  // "30th Batch Course Materials" -> "30th Batch"
  // "24th and 25th Batch Materials" -> handle multi-batch
  const match = heading.match(/(\d+(st|nd|rd|th))\s+Batch/i);
  if (match) return match[1] + " Batch";
  return null;
}

async function buildCanonicalMap() {
  // Build: { "batchName|semesterName" : driveId }
  const canonical = {};
  
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.includes('DriveLinks') && f.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const match = file.match(/Academic_Resort_-_(.*)_Semester_DriveLinks.json/);
    if (!match) continue;
    const semName = semesterMap[match[1]];
    if (!semName) continue;
    
    const content = await fs.readFile(path.join(dir, file), 'utf-8');
    const links = JSON.parse(content);
    
    for (const linkObj of links) {
      const batchName = extractBatchName(linkObj['Heading']);
      if (!batchName) continue;
      
      const key = `${batchName}|${semName}`;
      canonical[key] = linkObj['Drive ID'];
    }
  }
  
  return canonical;
}

async function cleanup() {
  const canonical = await buildCanonicalMap();
  
  console.log("=== CANONICAL TRUTH MAP ===");
  console.log(`Total canonical batch+semester combos: ${Object.keys(canonical).length}`);
  for (const [key, id] of Object.entries(canonical)) {
    console.log(`  ${key} -> ${id}`);
  }
  
  // Fetch all semesters with their batch names
  const { data: allSemesters, error: semErr } = await supabase
    .from('semesters')
    .select('id, name, drive_folder_id, batch_id, batches(name)')
    .order('name');
  if (semErr) throw semErr;
  
  let nullified = 0;
  let corrected = 0;
  let alreadyCorrect = 0;
  let leftNull = 0;
  
  for (const sem of allSemesters) {
    const batchName = sem.batches?.name;
    if (!batchName) continue;
    
    const key = `${batchName}|${sem.name}`;
    const canonicalDriveId = canonical[key] || null;
    const currentDriveId = sem.drive_folder_id;
    
    if (canonicalDriveId === currentDriveId) {
      // Already correct (either both null or both match)
      if (canonicalDriveId) alreadyCorrect++;
      else leftNull++;
      continue;
    }
    
    if (currentDriveId && !canonicalDriveId) {
      // DB has a drive ID but scraped data says this batch+semester has NO drive link
      // This is a duplicate that was incorrectly assigned
      console.log(`\n🧹 NULLIFY: ${batchName} / ${sem.name}`);
      console.log(`   Current: ${currentDriveId} -> Setting to NULL`);
      
      const { error } = await supabase
        .from('semesters')
        .update({ drive_folder_id: null })
        .eq('id', sem.id);
      if (error) console.error(`   ERROR: ${error.message}`);
      else nullified++;
      
    } else if (currentDriveId !== canonicalDriveId) {
      // DB has wrong drive ID - correct it
      console.log(`\n🔧 CORRECT: ${batchName} / ${sem.name}`);
      console.log(`   Current: ${currentDriveId}`);
      console.log(`   Correct: ${canonicalDriveId}`);
      
      const { error } = await supabase
        .from('semesters')
        .update({ drive_folder_id: canonicalDriveId })
        .eq('id', sem.id);
      if (error) console.error(`   ERROR: ${error.message}`);
      else corrected++;
      
    } else if (!currentDriveId && canonicalDriveId) {
      // DB is missing a drive ID that should be there
      console.log(`\n➕ ADD: ${batchName} / ${sem.name}`);
      console.log(`   Setting to: ${canonicalDriveId}`);
      
      const { error } = await supabase
        .from('semesters')
        .update({ drive_folder_id: canonicalDriveId })
        .eq('id', sem.id);
      if (error) console.error(`   ERROR: ${error.message}`);
      else corrected++;
    }
  }
  
  // Now clean up batch_courses that were created from the wrong batch assignments
  // First get the valid semester IDs (those that have canonical drive IDs)
  console.log("\n\n=== CLEANING UP BATCH_COURSES ===");
  
  // Get all batch_courses
  const { data: allBatchCourses, error: bcErr } = await supabase
    .from('batch_courses')
    .select('id, semester_id, course_id, class_updates_url, semesters(name, drive_folder_id, batch_id, batches(name))');
  if (bcErr) throw bcErr;
  
  console.log(`Total batch_courses in DB: ${allBatchCourses.length}`);
  
  // A batch_course is orphaned if its parent semester has no canonical drive ID
  let deletedBatchCourses = 0;
  for (const bc of allBatchCourses) {
    const batchName = bc.semesters?.batches?.name;
    const semName = bc.semesters?.name;
    if (!batchName || !semName) continue;
    
    const key = `${batchName}|${semName}`;
    const canonicalDriveId = canonical[key] || null;
    
    if (!canonicalDriveId) {
      // This batch_course is under a semester that has no canonical drive link
      // It was created from duplicated data - delete it
      
      // First delete any sections that reference this batch_course
      const { error: secDelErr } = await supabase
        .from('sections')
        .delete()
        .eq('batch_course_id', bc.id);
      if (secDelErr) console.error(`  Section delete error: ${secDelErr.message}`);
      
      // Delete any resource_links
      const { error: rlDelErr } = await supabase
        .from('resource_links')
        .delete()
        .eq('batch_course_id', bc.id);
      if (rlDelErr) console.error(`  Resource link delete error: ${rlDelErr.message}`);
      
      // Now delete the batch_course itself
      const { error: bcDelErr } = await supabase
        .from('batch_courses')
        .delete()
        .eq('id', bc.id);
      if (bcDelErr) console.error(`  Batch course delete error: ${bcDelErr.message}`);
      else {
        console.log(`  🗑️ Deleted orphan batch_course under ${batchName} / ${semName}`);
        deletedBatchCourses++;
      }
    }
  }
  
  // Also clean up sections that are under semesters with no canonical link
  console.log("\n\n=== CLEANING UP ORPHAN SECTIONS ===");
  const { data: allSections, error: secErr } = await supabase
    .from('sections')
    .select('id, batch_course_id, name, batch_courses(semester_id, semesters(name, batch_id, batches(name)))');
  if (secErr) throw secErr;
  
  let deletedSections = 0;
  for (const sec of allSections) {
    const batchName = sec.batch_courses?.semesters?.batches?.name;
    const semName = sec.batch_courses?.semesters?.name;
    if (!batchName || !semName) continue;
    
    const key = `${batchName}|${semName}`;
    const canonicalDriveId = canonical[key] || null;
    
    if (!canonicalDriveId) {
      const { error } = await supabase.from('sections').delete().eq('id', sec.id);
      if (!error) { deletedSections++; }
    }
  }
  
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Already correct:       ${alreadyCorrect}`);
  console.log(`Left as null (valid):  ${leftNull}`);
  console.log(`Nullified (dupes):     ${nullified}`);
  console.log(`Corrected/Added:       ${corrected}`);
  console.log(`Deleted batch_courses: ${deletedBatchCourses}`);
  console.log(`Deleted sections:      ${deletedSections}`);
  
  // Verify: check for remaining duplicates
  const { data: dupeCheck } = await supabase.rpc('check_dupes', {}).catch(() => ({ data: null }));
  // Manual check via raw query 
  console.log("\n=== POST-CLEANUP DUPLICATE CHECK ===");
  const { data: remaining } = await supabase
    .from('semesters')
    .select('drive_folder_id')
    .not('drive_folder_id', 'is', null);
  
  const idCounts = {};
  for (const r of remaining) {
    idCounts[r.drive_folder_id] = (idCounts[r.drive_folder_id] || 0) + 1;
  }
  const dupes = Object.entries(idCounts).filter(([_, c]) => c > 1);
  if (dupes.length === 0) {
    console.log("✅ No duplicate drive IDs remaining in semesters table!");
  } else {
    console.log(`⚠️ ${dupes.length} drive IDs still duplicated:`);
    for (const [id, count] of dupes) {
      console.log(`  ${id} appears ${count} times`);
    }
  }
}

cleanup().then(() => console.log("\n✅ Cleanup complete!")).catch(console.error);
