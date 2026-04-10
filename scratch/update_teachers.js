const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const newTeachers = `
Md. Maksudur Rahman Sarker
Professor & Chairman
Dr. Riazur Rahman Chowdhury
Professor
Dr. Dhiman Kumar Chowdhury
Professor
Dr. Mahmuda Akter
Professor
Dr. Mahfuzul Hoque
Professor
Md. Nazim Uddin Bhuiyan
Professor
Dr. Md. Monzur Morshed
Professor
Dr. Md. Sharif Hossain
Professor
Dr. Mizanur Rahman
Professor
Dr. Mohammad Tareq
Professor
Sadia Afroze
Professor
Dr. Dewan Mahboob Hossain
Professor
Amirus Salat
Professor
Tanzina Haque
Professor
Dr. Ranjan Kumar Mitra
Professor
Dr. Md. Musfiqur Rahman
Professor
Dr. Md. Saiful Alam
Professor
Al-Amin
Professor
Dr. Mohammad Moniruzzaman
Professor
Dr. Kawsar Jahan
Professor
Dr. Md. Jamil Sharif, FCMA
Professor
Rumana Ahmed
Associate Professor
Bilkis Akhter
Associate Professor
Ishter Mahal
Associate Professor
Dr. Moshahida Sultana
Associate Professor
Dr. Minhaj Ferdous
Associate Professor
Dr. Anup Kumar Saha, FCMA
Associate Professor
Md. Mazharul Anwar
Assistant Professor
Shah Alam
Assistant Professor
Md. Ahasan Uddin
Assistant Professor
Jannatul Naima
Assistant Professor
Md. Mahadi Hasan
Assistant Professor
Mohammad Saif Uddin Bhuiyah, ACMA
Assistant Professor
Md. Rezaul Karim
Assistant Professor
Hasina Begum
Assistant Professor
Ahmed Rizvan Hasan
Assistant Professor
Asia Khatun
Assistant Professor
Raihan Sobhan
Assistant Professor
Md. Sahid Hossain
Lecturer
Sanjida Afrin
Lecturer
Shawrin Ahmed Khan
Lecturer
`.trim().split('\n').filter(l => l.trim() !== '');

const teacherList = [];
for (let i = 0; i < newTeachers.length; i += 2) {
  teacherList.push({ name: newTeachers[i].trim(), designation: newTeachers[i+1].trim() });
}

function computeSimilarity(s1, s2) {
  s1 = s1.toLowerCase().replace(/[^a-z ]/g, '').trim();
  s2 = s2.toLowerCase().replace(/[^a-z ]/g, '').trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const w1 = s1.split(' ');
  const w2 = s2.split(' ');
  let matches = 0;
  for (const w of w1) {
    if (w2.includes(w) && w.length > 2) matches++;
  }
  return matches / Math.max(w1.length, w2.length);
}

async function run() {
  const { data: existing, error } = await supabase.from('teachers').select('id, name, designation');
  if (error) {
    console.error("Error fetching", error);
    return;
  }

  let updated = 0;
  let inserted = 0;

  for (const t of teacherList) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const e of existing) {
      const score = computeSimilarity(e.name, t.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = e;
      }
    }

    if (bestScore >= 0.6) {
      // update
      const { error: updErr } = await supabase.from('teachers')
        .update({ name: t.name, designation: t.designation })
        .eq('id', bestMatch.id);
      if (updErr) console.error("Error updating", updErr);
      else {
        console.log(`Updated: "${bestMatch.name}" -> "${t.name}" (${t.designation})`);
        updated++;
      }
    } else {
      // insert
      const { error: insErr } = await supabase.from('teachers')
        .insert({ name: t.name, designation: t.designation });
      if (insErr) console.error("Error inserting", insErr);
      else {
        console.log(`Inserted: "${t.name}" (${t.designation})`);
        inserted++;
      }
    }
  }

  console.log(`Done! Updated ${updated}, Inserted ${inserted}`);
}

run();
