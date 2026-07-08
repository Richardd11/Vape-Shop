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

async function searchSite(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Try to get product images using various selectors
    const data = await page.evaluate(() => {
      const results = [];
      const selectors = [
        'img[src*="wp-content"]', 'img[src*="/uploads/"]', 'img[src*="products"]',
        '.product img', '[class*="product"] img', '.woocommerce-loop-product__link img',
        '.product-thumbnail img', '.attachment-woocommerce_thumbnail', '.wp-post-image',
        '.card img', '.product-item img', '.grid__item img', 'li img[src*="cdn"]'
      ];
      
      const seen = new Set();
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(img => {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src && src.startsWith('http') && !seen.has(src) && 
              !src.includes('logo') && !src.includes('icon') && !src.includes('banner') &&
              !src.includes('cart') && !src.includes('checkout')) {
            seen.add(src);
            const title = img.alt || img.title || 
              img.closest('a')?.title || 
              img.closest('[class*="product"]')?.querySelector('[class*="title"], [class*="name"], h2, h3')?.textContent?.trim() || '';
            results.push({ src, title: title.toLowerCase() });
          }
        });
      });
      return results;
    });
    
    return data;
  } catch (err) {
    return [];
  }
}

function ourKey(name, brand) {
  return (brand + ' ' + name).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchScore(ourKey, scrapedTitle) {
  const aWords = ourKey.split(' ');
  const bWords = scrapedTitle.split(' ');
  let score = 0;
  for (const wa of aWords) if (wa.length > 2) {
    for (const wb of bWords) if (wb.length > 2) {
      if (wa === wb) score += 3;
      else if (wa.includes(wb) || wb.includes(wa)) score += 1;
    }
  }
  return score;
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();

  // Map each product to a search URL
  const sources = [];
  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    const q = encodeURIComponent(`${brand} ${p.name}`);
    sources.push({ product: p, brand, url: `https://www.vapeph.com/?s=${q}&post_type=product` });
  }

  const found = new Map();
  let processed = 0;

  // Try vapeph.com for each product
  for (const { product, brand, url } of sources) {
    processed++;
    process.stdout.write(`[${processed}/${sources.length}] ${brand} ${product.name}... `);
    
    const results = await searchSite(page, url);
    if (results.length > 0) {
      // Get the first one (most relevant)
      const key = ourKey(product.name, brand);
      let bestScore = 0;
      let best = null;
      for (const r of results) {
        const score = matchScore(key, r.title);
        if (score > bestScore) { bestScore = score; best = r; }
      }
      if (best && bestScore >= 2) {
        console.log(`✓ (score:${bestScore})`);
        found.set(product.id, best.src);
      } else if (results[0]) {
        // Use first result even if not great match
        console.log(`✓ (default)`);
        found.set(product.id, results[0].src);
      }
    } else {
      console.log(`✗`);
    }
    
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Generate SQL
  const sqlLines = [
    '-- Product Images from vapeph.com',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Found: ${found.size} / ${products.length}`,
    '', 'BEGIN;', 'DELETE FROM public.product_images;', '',
  ];
  
  for (const [id, url] of found) {
    const escaped = url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${id}', '${escaped}', true, now());`);
  }
  sqlLines.push('', 'COMMIT;', '');
  
  const foundIds = new Set(found.keys());
  sqlLines.push(`-- MISSING (${products.length - found.size}):`);
  for (const p of products) {
    if (!foundIds.has(p.id)) {
      sqlLines.push(`-- [${p.id}] ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }

  writeFileSync('vapeph-images.sql', sqlLines.join('\n'));
  console.log(`\nSQL written to vapeph-images.sql`);
}

main().catch(console.error);
