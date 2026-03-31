const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Fetching users...');
  const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
  if (userErr) console.error('User Error:', userErr);
  
  const jabir = users?.users.find(u => u.email === 'jabirahaian@gmail.com');
  console.log('Jabir Auth ID:', jabir?.id);
  
  console.log('Fetching profiles...');
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  if (profErr) console.error('Profile Error:', profErr);
  
  console.log('All Profiles:', profiles);

  if (jabir && profiles && !profiles.find(p => p.id === jabir.id)) {
    console.log('Fixing Jabir profile...');
    const { error } = await supabaseAdmin.from('profiles').insert({
      id: jabir.id,
      role: 'MASTER_ADMIN'
    });
    console.log('Fix result:', error || 'Success');
  }
}
check();
