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

async function getWvphvsProducts() {
  const res = await fetch('https://wvphvs.com/products.json?limit=250');
  const data = await res.json();
  return data.products.map(p => ({
    title: p.title.toLowerCase(),
    img: p.images?.[0]?.src || null,
    rawTitle: p.title
  })).filter(p => p.img);
}

async function main() {
  // Get our products
  const { data: ourProducts } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  // Get wvphvs products
  const wvphvs = await getWvphvsProducts();
  console.log(`WVPHVS has ${wvphvs.length} products with images\n`);

  // For each of our products, find best match
  function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function score(a, b) {
    const wa = normalize(a).split(' ');
    const wb = normalize(b).split(' ');
    let s = 0;
    for (const w of wa) if (w.length > 2 && wb.includes(w)) s += 3;
    for (const w of wb) if (w.length > 2 && wa.includes(w)) s += 3;
    // Bonus for exact word match
    for (const wa2 of wa) for (const wb2 of wb) {
      if (wa2 === wb2 && wa2.length > 2) s += 5;
    }
    return s;
  }

  const results = [];
  for (const p of ourProducts) {
    const brand = brandMap[p.brand_id] || '';
    const query = normalize(`${brand} ${p.name}`);
    
    let bestScore = 0;
    let bestMatch = null;

    for (const wp of wvphvs) {
      const s = score(query, wp.title);
      if (s > bestScore) {
        bestScore = s;
        bestMatch = wp;
      }
    }

    if (bestMatch && bestScore >= 5) {
      results.push({
        id: p.id,
        name: p.name,
        brand,
        matchTitle: bestMatch.rawTitle,
        url: bestMatch.img,
        score: bestScore
      });
      process.stdout.write('✓');
    } else {
      process.stdout.write('✗');
    }
  }

  console.log(`\n\n=== RESULTS ===`);
  console.log(`Matched: ${results.length} / ${ourProducts.length}`);

  // Insert matched images
  let inserted = 0;
  for (const r of results) {
    const { error } = await supabase.rpc('insert_product_image', {
      p_product_id: r.id,
      p_url: r.url,
      p_is_primary: true
    });
    if (error) {
      console.log(`✗ ${r.name}: ${error.message}`);
    } else {
      console.log(`✓ ${r.brand} | ${r.name} => ${r.matchTitle}`);
      inserted++;
    }
  }

  console.log(`\nInserted: ${inserted} images`);

  // Products that didn't match
  const matchedIds = new Set(results.map(r => r.id));
  console.log(`\nNot matched (${ourProducts.length - results.length}):`);
  for (const p of ourProducts) {
    if (!matchedIds.has(p.id)) {
      console.log(`  ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }
}

main().catch(console.error);
