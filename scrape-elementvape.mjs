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

async function searchElementVape(page, query) {
  try {
    await page.goto(`https://www.elementvape.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle',
      timeout: 20000
    });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      // Element Vape product grid
      const items = document.querySelectorAll('.product-item, [class*="product"] a img, .card-img-top, .product-thumb img, .product-image img, li a img[src*="cdn11"]');
      const imgs = [];
      
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src.includes('cdn11.bigcommerce.com') && src.includes('products') && 
            (img.naturalWidth > 100 || img.complete) && !src.includes('logo') && !src.includes('icon')) {
          // Get full size URL
          const fullSize = src.replace(/\/stencil\/[^/]+\//, '/stencil/1280x1280/');
          const title = img.alt || img.closest('a')?.title || img.closest('[class*="product"]')?.querySelector('[class*="title"], [class*="name"], h3, h4')?.textContent?.trim() || '';
          imgs.push({ src: fullSize, alt: title });
        }
      });
      return imgs.slice(0, 3);
    });

    return result;
  } catch (err) {
    console.log(`  Error searching: ${err.message}`);
    return [];
  }
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const foundImages = new Map();

  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    const query = `${brand} ${p.name}`;
    
    console.log(`\nSearching: "${query}"`);
    const results = await searchElementVape(page, query);

    if (results.length > 0) {
      console.log(`  Found: ${results[0].alt || 'No alt text'}`);
      console.log(`  URL: ${results[0].src}`);
      foundImages.set(p.id, results[0].src);
    } else {
      console.log(`  NOT FOUND on elementvape`);
    }

    // Be nice to elementvape
    await page.waitForTimeout(1500);
  }

  await browser.close();

  // Generate SQL
  const sqlLines = [
    '-- Product Images from ElementVape',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Found: ${foundImages.size} / ${products.length}`,
    '',
    'BEGIN;',
    'DELETE FROM public.product_images;',
    '',
  ];

  for (const [id, url] of foundImages) {
    const escapedUrl = url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${id}', '${escapedUrl}', true, now());`);
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');

  writeFileSync('elementvape-images.sql', sqlLines.join('\n'));
  console.log(`\n\nSQL written: elementvape-images.sql`);
  console.log(`Found: ${foundImages.size}/${products.length}`);
}

main().catch(console.error);
