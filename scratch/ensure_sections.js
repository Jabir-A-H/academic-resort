const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureSections() {
  console.log("🛠️ Ensuring Sections A and B for all courses...");

  // 1. Fetch all batch_courses
  const { data: batchCourses, error: bcErr } = await supabase
    .from('batch_courses')
    .select('id');
  if (bcErr) throw bcErr;

  console.log(`Found ${batchCourses.length} batch_courses in database.`);

  let createdSecs = 0;

  for (const bc of batchCourses) {
    for (const secName of ['A', 'B']) {
      const { data: existingSec } = await supabase
        .from('sections')
        .select('id')
        .eq('batch_course_id', bc.id)
        .eq('name', secName)
        .single();

      if (!existingSec) {
        const { error: secErr } = await supabase
          .from('sections')
          .insert({ batch_course_id: bc.id, name: secName });
        
        if (secErr) {
          console.error(`  Error creating section ${secName} for BC ${bc.id}: ${secErr.message}`);
        } else {
          createdSecs++;
        }
      }
    }
  }

  console.log(`\n✅ Finished section enforcement!`);
  console.log(`   New sections created: ${createdSecs}`);
}

ensureSections().catch(console.error);
