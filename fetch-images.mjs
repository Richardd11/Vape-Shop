import { readFileSync } from 'fs';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
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

async function getSupabaseProducts() {
  const { data: products } = await supabase.from('products').select('id, name, sku, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const { data: images } = await supabase.from('product_images').select('product_id, url');

  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const hasImage = new Set()
  for (const img of images || []) {
    if (img.url && img.url.trim()) hasImage.add(img.product_id)
  }

  const missing = (products || []).filter(p => !hasImage.has(p.id))

  console.log(`\n=== Our Products ===`)
  console.log(`Total: ${products.length}, Missing images: ${missing.length}`)
  for (const p of missing) {
    const brand = brandMap[p.brand_id] || 'Unknown'
    console.log(`${p.id} | ${brand} | ${p.name}`)
  }
  return { missing, products, brandMap }
}

async function scrapeWVPHVS() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n=== Scraping wvphvs.com ===');
  await page.goto('https://wvphvs.com/collections/all', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Get all products from the collection
  const allProducts = await page.evaluate(() => {
    const items = new Map();
    const cards = document.querySelectorAll('li.grid__item');
    cards.forEach(card => {
      const link = card.querySelector('a')?.href || '';
      const titleEl = card.querySelector('.card__heading a, .full-unstyled-link, .card__heading');
      const title = titleEl?.textContent?.trim() || '';
      
      const imgEl = card.querySelector('img');
      let img = imgEl?.src || imgEl?.getAttribute('data-src') || '';
      // Convert to high-res by replacing width param
      if (img.includes('width=')) {
        img = img + '&width=1000';
      }

      if (title && img) {
        items.set(title.toLowerCase(), { title, img, link });
      }
    });
    return Array.from(items.values());
  });

  console.log(`Found ${allProducts.length} unique products`);
  
  // Print them
  for (const p of allProducts) {
    console.log(`${p.title}`);
  }

  await browser.close();
  return allProducts;
}

// Simple name matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchProduct(productName, scrapedProducts, brandName) {
  const normalized = normalizeName(productName);
  const words = normalized.split(' ');
  
  let bestScore = 0;
  let bestMatch = null;

  for (const sp of scrapedProducts) {
    const spNorm = normalizeName(sp.title);
    let score = 0;

    // Check each word from our product against scraped title
    for (const word of words) {
      if (word.length < 2) continue;
      if (spNorm.includes(word)) {
        score += word.length;
      }
    }

    // Bonus for brand match
    if (brandName && spNorm.includes(normalizeName(brandName))) {
      score += 10;
    }

    // Penalty for length mismatch (more than 2x difference)
    const ratio = normalized.length / spNorm.length;
    if (ratio > 2 || ratio < 0.5) {
      score *= 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sp;
    }
  }

  // Require minimum score
  return bestScore > 5 ? bestMatch : null;
}

async function main() {
  const { missing, products, brandMap } = await getSupabaseProducts();
  const scraped = await scrapeWVPHVS();

  console.log('\n=== Matching ===');
  let matched = 0;
  for (const p of missing) {
    const brand = brandMap[p.brand_id] || '';
    const match = matchProduct(p.name, scraped, brand);
    if (match) {
      console.log(`MATCH: [${p.id}] ${p.name} => ${match.title}`);
      console.log(`  IMG: ${match.img}`);
      
      // Insert into product_images
      const { error } = await supabase.from('product_images').insert({
        product_id: p.id,
        url: match.img,
        is_primary: true
      });
      if (error) {
        console.log(`  INSERT ERROR: ${error.message}`);
      } else {
        console.log('  ✓ INSERTED');
        matched++;
      }
    }
  }

  // Print unmatched
  console.log(`\n=== Results ===`);
  console.log(`Matched & Inserted: ${matched}`);
  console.log(`Unmatched: ${missing.length - matched}`);
  for (const p of missing) {
    const brand = brandMap[p.brand_id] || '';
    const match = matchProduct(p.name, scraped, brand);
    if (!match) {
      console.log(`NO MATCH: [${p.id}] ${brand} | ${p.name}`);
    }
  }
}

main().catch(console.error);
