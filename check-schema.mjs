import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1).replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // Check table structure
  const { data: columns, error: colErr } = await supabase.rpc('get_table_info', { table_name: 'product_images' });
  if (colErr) {
    console.log('RPC not available, trying direct query...');
    const { data, error } = await supabase.from('product_images').select('*').limit(1);
    if (error) {
      console.log('Query error:', error.message);
    } else {
      console.log('Sample row:', JSON.stringify(data, null, 2));
    }
  } else {
    console.log('Columns:', columns);
  }

  // Check existing RLS policies
  const { data: policies, error: polErr } = await supabase.rpc('get_policies');
  if (polErr) {
    console.log('Cannot check policies via RPC');
  } else {
    console.log('Policies:', policies);
  }

  // Try inserting and see what happens
  const { data, error } = await supabase.from('product_images').insert({
    product_id: 'a1000000-0000-0000-0000-000000000001',
    url: 'https://example.com/test.jpg',
    is_primary: true
  });

  if (error) {
    console.log('Insert error:', error.message);
    if (error.message.includes('violates row-level security')) {
      console.log('RLS is blocking inserts. Need service_role key or SQL editor.');
    }
  } else {
    console.log('Insert succeeded! RLS is not blocking.');
    // Clean up
    await supabase.from('product_images').delete().eq('product_id', 'a1000000-0000-0000-0000-000000000001').eq('url', 'https://example.com/test.jpg');
  }
}

main().catch(console.error);
