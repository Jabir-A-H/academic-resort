/*
================================================================================
SUPABASE SCHEMA (RUN THIS IN SUPABASE SQL EDITOR)
================================================================================
const SCHEMA = `
-- 1. Batches Table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Semesters Table
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "1st", "2nd"
  drive_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Permanent Courses (Standard Reference)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., "1101"
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Batch Specific Course Instance
CREATE TABLE batch_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  class_updates_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  du_profile_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update sections table to use teacher_id
DROP TABLE IF EXISTS sections;
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_course_id UUID REFERENCES batch_courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- Restricted to A, B, or C in UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Resource Links
CREATE TABLE resource_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_course_id UUID REFERENCES batch_courses(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- "Notes", "Slides", "Books", "Question Bank"
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure resource_links use finalized categories
-- (Logic will handle mapping old names to: Class Notes, Slides and Materials, Books and Manuals, Question Bank)
`;

// ... (Rest of the migration logic will need to handle teacher insertion first)
================================================================================
*/

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load Environment Variables (Set these before running)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCHES_DIR = path.join(process.cwd(), 'batches');

async function migrate() {
  const files = fs.readdirSync(BATCHES_DIR).filter(f => f.startsWith('batch-') && f.endsWith('.json'));

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const data = JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, file), 'utf8'));

    // 1. Insert Batch
    const { data: batch, error: bErr } = await supabase
      .from('batches')
      .upsert({ name: data.batch_name })
      .select()
      .single();

    if (bErr) { console.error('Batch Error:', bErr); continue; }

    // 2. Process Semesters
    for (const [semName, semData] of Object.entries(data.semesters)) {
      const driveFolder = data.drive_folders?.[`${semName.toLowerCase()}_semester`] || null;
      
      const { data: semester, error: sErr } = await supabase
        .from('semesters')
        .upsert({ 
          batch_id: batch.id, 
          name: semName,
          drive_folder_id: driveFolder
        })
        .select()
        .single();

      if (sErr) { console.error('Semester Error:', sErr); continue; }

      // 3. Process Subjects
      for (const [code, subject] of Object.entries((semData as any).subjects)) {
        // Ensure Course exists
        const { data: course, error: cErr } = await supabase
          .from('courses')
          .upsert({ code: subject.code, title: subject.title }, { onConflict: 'code' })
          .select()
          .single();

        if (cErr) { console.error('Course Error:', cErr); continue; }

        // Insert Batch Course
        const { data: batchCourse, error: bcErr } = await supabase
          .from('batch_courses')
          .upsert({
            semester_id: semester.id,
            course_id: course.id,
            class_updates_url: subject.links.class_updates
          })
          .select()
          .single();

        if (bcErr) { console.error('BatchCourse Error:', bcErr); continue; }

        // 4. Insert Sections & Teachers
        for (const [secName, teacherName] of Object.entries(subject.teachers)) {
          if (!teacherName) continue;

          // Deduplicate Teachers
          const { data: teacher, error: tErr } = await supabase
            .from('teachers')
            .upsert({ name: teacherName }, { onConflict: 'name' })
            .select()
            .single();

          if (tErr) { console.error('Teacher Error:', tErr); continue; }

          await supabase.from('sections').insert({
            batch_course_id: batchCourse.id,
            teacher_id: teacher.id,
            name: secName // A, B, or C
          });
        }

        // 5. Insert Links with Finalized Categories
        const linkTypes = [
          { key: 'notes', label: 'Class Notes' },
          { key: 'slides_lectures', label: 'Slides and Materials' },
          { key: 'books_manuals', label: 'Books and Manuals' },
          { key: 'question_bank', label: 'Question Bank' }
        ];

        for (const type of linkTypes) {
          const links = subject.links[type.key] || [];
          for (const url of links) {
            if (url) {
              await supabase.from('resource_links').insert({
                batch_course_id: batchCourse.id,
                category: type.label,
                url: url
              });
            }
          }
        }
      }
    }
  }

  console.log('Migration Complete!');
}

migrate();
