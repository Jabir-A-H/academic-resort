const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { google } = require('googleapis');

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Drive API Setup
const apiKeyString = process.env.GOOGLE_DRIVE_API_KEYS;
if (!apiKeyString) {
  console.error("Missing Google Drive API key");
  process.exit(1);
}
const apiKeys = apiKeyString.split(',');
const drive = google.drive({ version: 'v3', auth: apiKeys[0] });

const dir = path.join(__dirname, '..', '.designplans');

// Map JSON filename identifiers to DB semester names
const semesterMap = {
  '1st': '1st',
  '2nd': '2nd',
  '3rd': '3rd',
  '4th': '4th',
  '5th': '5th',
  '6th': '6th',
  '7th': '7th',
  '8th': '8th',
  'MBA_1st': 'mba-1st',
  'MBA_2nd': 'mba-2nd'
};

/**
 * Normalizes batch headings from the legacy site.
 * Common headings: "30th Batch Course Materials", "27th Batch Updates & Materials", etc.
 */
function extractBatchTitle(heading) {
  // Try to find Nth Batch
  const match = heading.match(/(\d+(st|nd|rd|th))\s+Batch/i);
  if (match) {
    return match[1] + " Batch";
  }
  return null;
}

async function updateSupabase() {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.includes('DriveLinks') && f.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const match = file.match(/Academic_Resort_-_(.*)_Semester_DriveLinks.json/);
    if (!match) continue;
    
    const semKey = match[1];
    const semName = semesterMap[semKey];
    if (!semName) continue;
    
    const { data: semDataFull, error: semErr } = await supabase
      .from('semesters')
      .select('id, name, batch_id');
      
    const content = await fs.readFile(path.join(dir, file), 'utf-8');
    const links = JSON.parse(content);
    
    console.log(`\n\n=== Semester: ${semName} ===`);
    
    for (const linkObj of links) {
      // The schema mapping was a little off before - "name" is what batches has, not "title" nor "is_active"
      const heading = linkObj['Heading'];
      const folderId = linkObj['Drive ID'];
      const batchTitle = extractBatchTitle(heading);
      
      // We only care about batch-level folders right now
      if (!batchTitle) {
        console.log(`Skipping non-batch section: "${heading}"`);
        continue;
      }
      
      console.log(`\nFound Batch mapping: "${batchTitle}" (ID: ${folderId})`);
      
      // Find the batch in Supabase
      let { data: batchData, error: batchErr } = await supabase
        .from('batches')
        .select('*')
        .eq('name', batchTitle)
        .single();
        
      if (batchErr || !batchData) {
        console.log(`    -> Batch "${batchTitle}" not found in DB! Creating it...`);
        const { data: newBatch, error: errNew } = await supabase.from('batches').insert({ name: batchTitle }).select().single();
        if (errNew) {
           console.error("Failed to create batch: " + errNew.message);
           continue;
        }
        batchData = newBatch;
        
        // Let's create the 10 semesters for it
        const defaultSemesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 'mba-1st', 'mba-2nd'];
        const semesterInserts = defaultSemesters.map(name => ({
          batch_id: batchData.id,
          name: name
        }));
        await supabase.from('semesters').insert(semesterInserts);
        
        // Refresh full semester list
        const { data: updatedSems } = await supabase.from('semesters').select('id, name, batch_id');
        semDataFull.push(...updatedSems.filter(s => s.batch_id === batchData.id));
      }
      
      // Find the specific semester for this batch!
      const mySemester = semDataFull.find(s => s.batch_id === batchData.id && s.name === semName);
      if (!mySemester) {
          console.error(`  -> Could not find semester ${semName} for Batch ${batchTitle}`);
          continue;
      }
      
      console.log(`    -> Updating semester ID ${mySemester.id} with Drive ID`);
      await supabase
          .from('semesters')
          .update({ drive_folder_id: folderId })
          .eq('id', mySemester.id);
      
      try {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id, name)',
          supportsAllDrives: true
        });
        
        const children = response.data.files || [];
        console.log(`    -> Child folders found: ${children.map(c=>c.name).join(', ')}`);
        
        for (const child of children) {
          const cname = child.name;
          const cid = child.id;
          
          let role = 'student';
          
          // Let's see if course_code is a good fit. Actually, batch_courses stores course_code. So cname works.
          const { data: exBc } = await supabase
            .from('batch_courses')
            .select('*')
            .eq('semester_id', mySemester.id)
            .eq('course_code', cname)
            .single();
            
          if (exBc) {
            console.log(`       ~ Updating batch_course: ${cname}`);
            await supabase
              .from('batch_courses')
              .update({ drive_folder_id: cid })
              .eq('id', exBc.id);
          } else {
            console.log(`       + Creating batch_course: ${cname}`);
            await supabase
              .from('batch_courses')
              .insert({
                batch_id: batchData.id,
                semester_id: mySemester.id,
                course_code: cname,
                drive_folder_id: cid
              });
          }
        }
      } catch (childErr) {
        console.error(`    -> ERROR fetching children: ${childErr.message}`);
      }
    }
  }
}

updateSupabase().then(() => console.log("\n✅ Migration complete!")).catch(console.error);
