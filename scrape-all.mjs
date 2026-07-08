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

async function getOurProducts() {
  const { data: products } = await supabase.from('products').select('id, name, sku, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name
  return { products, brandMap };
}

async function scrapeAllFromWVPHVS() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Known collections on wvphvs
  const collections = [
    'https://wvphvs.com/collections/all',
    'https://wvphvs.com/collections/disposablevape',
    'https://wvphvs.com/collections/pod-system',
    'https://wvphvs.com/collections/pod',
    'https://wvphvs.com/collections/e-liquid',
    'https://wvphvs.com/collections/e-liquids',
    'https://wvphvs.com/collections/vape-juice',
    'https://wvphvs.com/collections/device',
    'https://wvphvs.com/collections/devices',
    'https://wvphvs.com/collections/coils',
    'https://wvphvs.com/collections/accessories',
    'https://wvphvs.com/collections/tanks',
    'https://wvphvs.com/collections/saltnic',
    'https://wvphvs.com/collections/freebase',
  ];

  const allProducts = new Map(); // keyed by URL to deduplicate

  for (const url of collections) {
    try {
      console.log(`\nScraping: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

      // Wait a bit for lazy images
      await page.waitForTimeout(2000);

      const found = await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll('li.grid__item, .product-item, [data-product]');
        cards.forEach(card => {
          const linkEl = card.querySelector('a');
          const link = linkEl?.href || '';
          const title = (
            card.querySelector('.card__heading a, .full-unstyled-link, .card__heading') ||
            card.querySelector('[class*="title"] a, [class*="heading"] a') ||
            card.querySelector('h3, h2, .product-item__title')
          )?.textContent?.trim() || '';

          // Try to find product image - check multiple sources
          const imgEl = card.querySelector('img');
          let img = '';
          if (imgEl) {
            img = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-srcset')?.split(' ')[0] || '';
          }

          if (title && img) {
            items.push({ title, img, link });
          }
        });
        return items;
      });

      for (const p of found) {
        if (p.link && !allProducts.has(p.link)) {
          allProducts.set(p.link, p);
        } else if (!p.link) {
          // Use title+img as key if no link
          const key = p.title + p.img;
          if (!allProducts.has(key)) {
            allProducts.set(key, p);
          }
        }
      }
      console.log(`  Found ${found.length} products (${allProducts.size} unique so far)`);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  await browser.close();
  return Array.from(allProducts.values());
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordScore(a, b) {
  const wordsA = normalize(a).split(' ');
  const wordsB = normalize(b).split(' ');
  let score = 0;
  for (const wa of wordsA) {
    if (wa.length < 2) continue;
    for (const wb of wordsB) {
      if (wb.length < 2) continue;
      if (wa === wb) score += 3;
      else if (wa.includes(wb) || wb.includes(wa)) score += 2;
      else if (wa.length > 3 && wb.length > 3 && (wa.startsWith(wb) || wb.startsWith(wa))) score += 1;
    }
  }
  return score;
}

function findBestMatch(productName, brandName, scraped) {
  const pNorm = normalize(productName);
  const bNorm = normalize(brandName);
  let bestScore = 0;
  let best = null;

  for (const sp of scraped) {
    let score = wordScore(pNorm, normalize(sp.title));
    // Brand bonus
    if (bNorm && normalize(sp.title).includes(bNorm)) score += 5;
    // Exact brand+model bonus
    if (bNorm && pNorm.includes(bNorm)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = sp;
    }
  }

  return bestScore >= 5 ? best : null;
}

async function main() {
  const { products, brandMap } = await getOurProducts();
  const scraped = await scrapeAllFromWVPHVS();

  console.log(`\n\n=== Total scraped: ${scraped.length} unique products ===`);
  for (const p of scraped) {
    console.log(`  ${p.title} => ${p.img.substring(0, 80)}`);
  }

  console.log(`\n\n=== Matching to our products ===`);
  const foundProducts = [];
  const notFoundProducts = [];

  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    const match = findBestMatch(p.name, brand, scraped);
    if (match) {
      console.log(`✓ [${p.id}] ${p.name} => ${match.title}`);
      console.log(`  IMG: ${match.img}`);
      foundProducts.push({ ...p, img: match.img, scrapedTitle: match.title });
    } else {
      notFoundProducts.push(p);
      console.log(`✗ [${p.id}] ${brand} | ${p.name}`);
    }
  }

  console.log(`\n\n=== STATS ===`);
  console.log(`Total products: ${products.length}`);
  console.log(`Matched: ${foundProducts.length}`);
  console.log(`Not found: ${notFoundProducts.length}`);

  // If there are matched products, generate SQL
  if (foundProducts.length > 0) {
    console.log(`\n\n=== INSERT SQL ===`);
    for (const p of foundProducts) {
      const escapedUrl = p.img.replace(/'/g, "''");
      console.log(`INSERT INTO product_images (product_id, url, is_primary, created_at)
VALUES ('${p.id}', '${escapedUrl}', true, now())
ON CONFLICT (product_id) WHERE is_primary = true DO UPDATE SET url = EXCLUDED.url;`);
    }
  }

  // Also show not found list
  console.log(`\n\n=== NOT FOUND PRODUCTS ===`);
  for (const p of notFoundProducts) {
    const brand = brandMap[p.brand_id] || '';
    console.log(`${brand}|${p.name}`);
  }
}

main().catch(console.error);
