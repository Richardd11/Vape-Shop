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

const TARGET_SITES = [
  { name: 'The Vape Shop PH', url: 'https://thevapeshop.ph', search: '/?s=%s&post_type=product' },
  { name: 'WVPHVS', url: 'https://wvphvs.com', search: '/search?q=%s' },
];

async function searchSite(page, baseUrl, searchPath, query) {
  const url = baseUrl + searchPath.replace('%s', encodeURIComponent(query));
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => {
      // Try WooCommerce product image pattern
      const imgs = document.querySelectorAll('img[src*="wp-content"], img[src*="uploads"], img.attachment-woocommerce_thumbnail, .product img, [class*="product"] img');
      for (const img of imgs) {
        const src = img.src || img.getAttribute('data-src') || '';
        const parentText = img.closest('[class*="product"]')?.querySelector('[class*="title"], [class*="name"], h2, h3')?.textContent?.trim() || img.alt || '';
        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
          return { src: src.replace(/-100x100|-150x150|-300x300|-600x600/g, ''), title: parentText };
        }
      }
      return null;
    });
    return result;
  } catch {
    return null;
  }
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const found = new Map();

  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    const query = `${brand} ${p.name}`;

    for (const site of TARGET_SITES) {
      process.stdout.write(`[${query.substring(0, 30)}] @ ${site.name}... `);
      const result = await searchSite(page, site.url, site.search, query);
      if (result && result.src) {
        console.log(`✓`);
        found.set(p.id, { url: result.src, site: site.name });
        break;
      } else {
        console.log(`✗`);
      }
    }
  }

  await browser.close();

  // Generate SQL
  const sqlLines = [
    '-- Product Images from TheVapeShop.ph',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Found: ${found.size} / ${products.length}`,
    '',
    'BEGIN;',
    'DELETE FROM public.product_images;',
    '',
  ];

  for (const [id, info] of found) {
    const escaped = info.url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${id}', '${escaped}', true, now());`);
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');

  writeFileSync('vapeshop-images.sql', sqlLines.join('\n'));
  console.log(`\nSQL written. Found ${found.size}/${products.length}`);
}

main().catch(console.error);
