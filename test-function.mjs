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
  // Try calling the new function
  const { data, error } = await supabase.rpc('insert_product_image', {
    p_product_id: 'a1000000-0000-0000-0000-000000000001',
    p_url: 'https://via.placeholder.com/400x400.png?text=Test',
    p_is_primary: true
  });

  if (error) {
    console.log('Function call failed:', error.message);
  } else {
    console.log('Function succeeded! Inserted ID:', data);
    
    // Clean up test
    await supabase.from('product_images').delete().eq('id', data);
    console.log('Cleaned up test row');
  }
}

main().catch(console.error);
