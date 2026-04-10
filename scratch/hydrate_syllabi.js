const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function hydrate() {
  console.log("🚀 Starting Curriculum Hydration...");

  // 1. Fetch batches 24, 25, 26, 27
  const { data: batches } = await supabase
    .from('batches')
    .select('id, name')
    .in('name', ['24th Batch', '25th Batch', '26th Batch', '27th Batch']);

  // 2. Fetch semesters for these batches
  const { data: semesters } = await supabase
    .from('semesters')
    .select('id, name, batch_id')
    .in('batch_id', batches.map(b => b.id));

  // 3. Fetch courses for 2013-2014 syllabus
  const { data: courses } = await supabase
    .from('courses')
    .select('id, code, title')
    .eq('syllabus', '2013-2014');

  console.log(`Found ${batches.length} batches, ${semesters.length} semesters, and ${courses.length} courses.`);

  const semesterMap = {
    '11': '1st',
    '12': '2nd',
    '21': '3rd',
    '22': '4th',
    '31': '5th',
    '32': '6th',
    '41': '7th',
    '42': '8th',
    '61': 'MBA 1st',
    '62': 'MBA 2nd'
  };

  let bcCount = 0;
  let secCount = 0;

  for (const batch of batches) {
    console.log(`\n📦 Processing ${batch.name}...`);
    
    for (const course of courses) {
      const codePrefix = course.code.substring(0, 2);
      const semName = semesterMap[codePrefix];
      if (!semName) continue;

      // Find the specific semester record for this batch
      const semester = semesters.find(s => s.batch_id === batch.id && s.name.toLowerCase() === semName.toLowerCase());
      if (!semester) continue;

      // Check if batch_course exists
      const { data: existingBC } = await supabase
        .from('batch_courses')
        .select('id')
        .eq('semester_id', semester.id)
        .eq('course_id', course.id)
        .single();

      let bcId;
      if (!existingBC) {
        const { data: newBC, error: bcErr } = await supabase
          .from('batch_courses')
          .insert({ semester_id: semester.id, course_id: course.id })
          .select()
          .single();
        
        if (bcErr) {
          console.error(`  Error creating batch_course for ${course.code}: ${bcErr.message}`);
          continue;
        }
        bcId = newBC.id;
        bcCount++;
      } else {
        bcId = existingBC.id;
      }

      // Ensure Section A and B
      for (const secName of ['A', 'B']) {
        const { data: existingSec } = await supabase
          .from('sections')
          .select('id')
          .eq('batch_course_id', bcId)
          .eq('name', secName)
          .single();

        if (!existingSec) {
          const { error: secErr } = await supabase
            .from('sections')
            .insert({ batch_course_id: bcId, name: secName });
          if (secErr) console.error(`    Error creating Section ${secName}: ${secErr.message}`);
          else secCount++;
        }
      }
    }
  }

  console.log(`\n✅ Hydration Complete!`);
  console.log(`   New batch_courses: ${bcCount}`);
  console.log(`   New sections: ${secCount}`);
}

hydrate().catch(console.error);
