import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint is meant to be called by Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch all unique semester drive links
    const { data: semesters, error: semError } = await supabase
      .from('semesters')
      .select('id, name, drive_link');

    if (semError) throw semError;

    const results = [];

    for (const sem of semesters || []) {
      if (!sem.drive_link) continue;
      
      // Basic check: is it a valid URL?
      try {
        const response = await fetch(sem.drive_link, { method: 'HEAD' });
        results.push({
          semester: sem.name,
          status: response.status,
          ok: response.ok
        });
      } catch (e) {
        results.push({ semester: sem.name, status: 'error', ok: false });
      }
    }

    return NextResponse.json({ success: true, checked: results.length, details: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
