import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // Find Jabir
    const jabir = authData.users.find(u => u.email === 'jabirahaian@gmail.com');
    if (!jabir) {
      return NextResponse.json({ error: 'User jabirahaian@gmail.com not found in auth system' }, { status: 404 });
    }

    // Upsert the master admin profile
    const { data, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: jabir.id, 
        role: 'MASTER_ADMIN',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ 
      success: true, 
      message: 'Master Admin account successfully verified and repaired!',
      profile: data 
    });
  } catch (error: any) {
    console.error('Setup endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
