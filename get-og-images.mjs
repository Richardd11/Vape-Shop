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

async function getOGImage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const og = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      if (meta) return meta.getAttribute('content');
      
      // Try Twitter image
      const twitter = document.querySelector('meta[name="twitter:image"]');
      if (twitter) return twitter.getAttribute('content');
      
      // Try Schema.org image
      const ldJson = document.querySelector('script[type="application/ld+json"]');
      if (ldJson) {
        try {
          const data = JSON.parse(ldJson.textContent);
          if (data.image) return Array.isArray(data.image) ? data.image[0] : data.image;
        } catch {}
      }
      
      // Try first big product image
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        if (img.naturalWidth > 300 && img.naturalHeight > 300 && img.src.startsWith('http')) {
          return img.src;
        }
      }
      return null;
    });
    return og;
  } catch {
    return null;
  }
}

async function searchAndGetOG(page, query) {
  // Use DuckDuckGo lite (no JS, very scrape-friendly)
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' vape')}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Get first organic result URL from DDG
    const firstResult = await page.evaluate(() => {
      const links = document.querySelectorAll('.result__a, .result__url, a[class*="result"]');
      for (const link of links) {
        const href = link.href || link.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes('duckduckgo.com') && !href.includes('youtube.com') && !href.includes('facebook.com')) {
          return href;
        }
        // DDG uses redirect URLs
        if (href.includes('uddg=')) {
          const match = href.match(/uddg=([^&]+)/);
          if (match) return decodeURIComponent(match[1]);
        }
      }
      return null;
    });

    if (firstResult) {
      console.log(`  Result: ${firstResult.substring(0, 80)}`);
      const og = await getOGImage(page, firstResult);
      if (og) return og;
    }

    return null;
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return null;
  }
}

// Fallback using Bing
async function searchAndGetOGBing(page, query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query + ' vape')}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const firstResult = await page.evaluate(() => {
      const link = document.querySelector('.b_algo h2 a');
      if (link) return link.href;
      return null;
    });

    if (firstResult) {
      console.log(`  Bing result: ${firstResult.substring(0, 80)}`);
      const og = await getOGImage(page, firstResult);
      if (og) return og;
    }

    return null;
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
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await ctx.newPage();

  const results = [];

  for (const p of products) {
    const brand = brandMap[p.brand_id] || '';
    const query = `${brand} ${p.name}`;
    process.stdout.write(`[${results.length+1}/${products.length}] ${query}... `);
    
    let og = await searchAndGetOG(page, query);
    if (!og) {
      og = await searchAndGetOGBing(page, query);
    }
    if (og) {
      console.log(`✓ ${og.substring(0, 60)}`);
      results.push({ id: p.id, name: p.name, brand, url: og });
    } else {
      console.log(`✗ Not found`);
    }

    await page.waitForTimeout(2000);
  }

  await browser.close();

  // SQL output
  const sqlLines = [
    '-- Product Images from Google Search OG Images',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Found: ${results.length} / ${products.length}`,
    '',
    'BEGIN;',
    'DELETE FROM public.product_images;',
    '',
  ];

  for (const r of results) {
    const escaped = r.url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${r.id}', '${escaped}', true, now());`);
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');
  sqlLines.push('');
  sqlLines.push(`-- MISSING PRODUCTS:`);
  const foundIds = new Set(results.map(r => r.id));
  for (const p of products) {
    if (!foundIds.has(p.id)) {
      sqlLines.push(`-- [${p.id}] ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }

  writeFileSync('og-images.sql', sqlLines.join('\n'));
  console.log(`\nSQL written to og-images.sql`);
}

main().catch(console.error);
