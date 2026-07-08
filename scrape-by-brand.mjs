import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright';
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

// Sites that have our products organized by brand
async function scrapeBrandPage(page, url, brandName) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const products = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('.product, li.product, [class*="product"]');
      cards.forEach(card => {
        const name = card.querySelector('[class*="title"], [class*="name"], h2, h3, .woocommerce-loop-product__title')?.textContent?.trim() || '';
        const img = card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src') || '';
        const link = card.querySelector('a')?.href || '';
        if (name && img && img.includes('http')) {
          items.push({ name: name.toLowerCase(), img: img.replace(/-100x100|-150x150|-300x300/g, ''), link });
        }
      });
      return items;
    });

    return products;
  } catch {
    return [];
  }
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchScore(ourName, scrapedName) {
  const a = normalize(ourName);
  const b = normalize(scrapedName);
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  let matches = 0;
  for (const wa of wordsA) if (wa.length > 2 && b.includes(wa)) matches++;
  for (const wb of wordsB) if (wb.length > 2 && a.includes(wb)) matches++;
  return matches;
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Group products by brand
  const byBrand = {};
  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(p);
  }

  const foundImages = new Map();

  // Try scraping each brand from thevapeshop.ph
  for (const [brand, brandProducts] of Object.entries(byBrand)) {
    const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
    const urls = [
      `https://thevapeshop.ph/brand/${brandSlug}/`,
      `https://thevapeshop.ph/product-brands/${brandSlug}/`,
      `https://thevapeshop.ph/product-category/${brandSlug}/`,
      `https://thevapeshop.ph/?s=${encodeURIComponent(brand)}&post_type=product`,
    ];

    let scrapedProducts = [];
    for (const url of urls) {
      console.log(`\nTrying: ${url}`);
      scrapedProducts = await scrapeBrandPage(page, url, brand);
      if (scrapedProducts.length > 0) {
        console.log(`  Found ${scrapedProducts.length} products for ${brand}`);
        break;
      }
    }

    if (scrapedProducts.length === 0) {
      console.log(`  No products found for ${brand} on thevapeshop.ph`);
      continue;
    }

    // Match our products to scraped ones
    for (const ourProduct of brandProducts) {
      let bestScore = 0;
      let bestMatch = null;
      
      for (const sp of scrapedProducts) {
        const score = matchScore(ourProduct.name, sp.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = sp;
        }
      }

      if (bestMatch && bestScore >= 2) {
        console.log(`  MATCH: [${ourProduct.name}] => [${bestMatch.name}]`);
        console.log(`    IMG: ${bestMatch.img.substring(0, 80)}`);
        foundImages.set(ourProduct.id, bestMatch.img);
      } else {
        console.log(`  NO MATCH: [${ourProduct.name}] (best score: ${bestScore})`);
      }
    }
  }

  // Also try wvphvs for remaining products
  const remaining = products.filter(p => !foundImages.has(p.id));
  if (remaining.length > 0) {
    console.log(`\n\n=== Trying wvphvs for remaining ${remaining.length} products ===`);
    
    // Scrape all products from wvphvs
    const wvphvsProducts = await scrapeBrandPage(page, 'https://wvphvs.com/collections/all', '');
    
    for (const ourProduct of remaining) {
      let bestScore = 0;
      let bestMatch = null;
      for (const sp of wvphvsProducts) {
        const score = matchScore(ourProduct.name, sp.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = sp;
        }
      }
      if (bestMatch && bestScore >= 2) {
        console.log(`  MATCH: [${ourProduct.name}] => [${bestMatch.name}]`);
        foundImages.set(ourProduct.id, bestMatch.img);
      }
    }
  }

  await browser.close();

  // Generate SQL
  const sqlLines = [
    '-- Product Images from thevapeshop.ph + wvphvs.com',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Found: ${foundImages.size} / ${products.length}`,
    '',
    'BEGIN;',
    'DELETE FROM public.product_images;',
    '',
  ];

  for (const [id, url] of foundImages) {
    const escaped = url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${id}', '${escaped}', true, now());`);
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');

  // Print missing
  const foundIds = new Set(foundImages.keys());
  sqlLines.push(`\n-- MISSING (${products.length - foundImages.size}):`);
  for (const p of products) {
    if (!foundIds.has(p.id)) {
      sqlLines.push(`-- [${p.id}] ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }

  writeFileSync('brand-images.sql', sqlLines.join('\n'));
  console.log(`\nSQL written to brand-images.sql`);
  console.log(`Found: ${foundImages.size}/${products.length}`);
}

main().catch(console.error);
