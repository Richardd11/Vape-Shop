import { readFileSync, appendFileSync } from 'fs';
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

// Hard-coded known correct image URLs for products we can verify
const KNOWN_IMAGES = {
  // BLCK Elite - verified from wvphvs.com
  'ec5ea10c-c2be-4bd7-9828-df30e9e20a44': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851', // BLCK Elite V2 Device
  'bb267d4a-90e5-4bcb-be9d-c88b35f6015b': 'https://wvphvs.com/cdn/shop/files/BlackElitePodFormula.jpg?v=1719665352', // BLCK Elite V2 Pod
  'd606d074-2bde-4ded-9d75-ee414c0b6c1b': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851', // BLCK Elite COZ 12K Disposable
  'c935c3fd-a586-4ca9-a9d0-cd521cbf076d': 'https://wvphvs.com/cdn/shop/files/blackelitev1productimage.jpg', // BLCK Elite V1 Device

  // Chillax - same brand image
  'e5dddc95-e9a5-4977-a69e-f3ca6946c604': 'https://wvphvs.com/cdn/shop/files/chillax_chillx_chillaxgo_chillaxinfinite.jpg?v=1765005823',

  // RELX - same brand
  'e2150362-2c4b-44bd-ad66-05cd7a61877c': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',
  'a1000000-0000-0000-0000-000000000011': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',
};

async function searchBingImage(page, query) {
  try {
    await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(1000);

    const imgUrl = await page.evaluate(() => {
      // Try to get the first actual product image
      const imgs = document.querySelectorAll('.img_offc, .mimg, [data-src]');
      for (const img of imgs) {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && !src.includes('data:') && src.startsWith('http')) return src;
      }
      return null;
    });

    return imgUrl;
  } catch (err) {
    return null;
  }
}

async function scrapeOfficialSite(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const ogImage = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:image"]');
      if (og) return og.getAttribute('content');
      // Try first large product image
      const imgs = document.querySelectorAll('img[src*="product"], img[src*="upload"], .product__media img, .product-single__photo img, [class*="product"] img');
      for (const img of imgs) {
        if (img.src && img.naturalWidth > 200) return img.src;
      }
      return null;
    });
    return ogImage;
  } catch {
    return null;
  }
}

// Official site URL patterns for known brands
const OFFICIAL_SITES = {
  'Geekvape': {
    base: 'https://www.geekvape.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Smok': {
    base: 'https://www.smoktech.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Vaporesso': {
    base: 'https://www.vaporesso.com',
    path: (name) => {
      const slug = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase().replace(/\s+/g, '-');
      return `/product/${slug}`;
    }
  },
  'Voopoo': {
    base: 'https://www.voopoo.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/${slug}`;
    }
  },
  'Uwell': {
    base: 'https://uwell.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Oxva': {
    base: 'https://www.oxva.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Elfbar': {
    base: 'https://www.elfbar.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Lost Mary': {
    base: 'https://www.lostmary.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'HQD': {
    base: 'https://www.hqdtech.com',
    path: (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `/product/${slug}`;
    }
  },
  'Nitecore': {
    base: 'https://www.nitecore.com',
    path: (name) => `/product/${name.toLowerCase().replace(/\s+/g, '-')}`
  },
};

async function main() {
  const { products, brandMap } = await getOurProducts();

  // Get existing images
  const { data: existingImages } = await supabase.from('product_images').select('product_id, url');
  const hasImage = new Set();
  for (const img of existingImages || []) {
    if (img.url && img.url.trim()) hasImage.add(img.product_id);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const sqlLines = [];
  const results = [];

  for (const p of products) {
    if (hasImage.has(p.id)) {
      console.log(`✓ [${p.id}] ${p.name} — already has image, skipping`);
      continue;
    }

    const brand = brandMap[p.brand_id] || '';

    // Check hardcoded known images first
    if (KNOWN_IMAGES[p.id]) {
      console.log(`★ [${p.id}] ${brand} | ${p.name} — using known image`);
      results.push({ id: p.id, name: p.name, brand, img: KNOWN_IMAGES[p.id], source: 'known' });
      continue;
    }

    // Try official site
    const siteConfig = OFFICIAL_SITES[brand];
    let imgUrl = null;
    let source = '';

    if (siteConfig) {
      const url = siteConfig.base + siteConfig.path(p.name);
      console.log(`  [${p.id}] Trying: ${url}`);
      imgUrl = await scrapeOfficialSite(page, url);
      if (imgUrl) {
        source = 'official-site';
        console.log(`  ✓ Found on official site`);
      } else {
        console.log(`  ✗ Not found on official site`);
      }
    }

    // If official site failed, try Bing image search
    if (!imgUrl) {
      const query = `${brand} ${p.name} vape product`;
      console.log(`  [${p.id}] Searching Bing: "${query}"`);
      imgUrl = await searchBingImage(page, query);
      if (imgUrl) {
        source = 'bing';
        console.log(`  ✓ Found via Bing`);
      } else {
        console.log(`  ✗ Not found via Bing`);
      }
    }

    if (imgUrl) {
      results.push({ id: p.id, name: p.name, brand, img: imgUrl, source });
    } else {
      console.log(`  ✗✗ NO IMAGE FOUND for [${p.id}] ${brand} | ${p.name}`);
    }

    // Small delay to avoid rate limiting
    await page.waitForTimeout(500);
  }

  await browser.close();

  // Generate SQL
  console.log('\n\n=== SQL STATEMENTS ===');
  for (const r of results) {
    const escapedUrl = r.img.replace(/'/g, "''");
    const sql = `INSERT INTO public.product_images (product_id, url, is_primary, created_at)
VALUES ('${r.id}', '${escapedUrl}', true, now())
ON CONFLICT (product_id) WHERE is_primary = true DO UPDATE SET url = EXCLUDED.url;`;
    sqlLines.push(sql);
    console.log(`-- [${r.source}] ${r.brand} | ${r.name}`);
    console.log(sql);
  }

  // Summary
  const found = results.length;
  const total = products.length - hasImage.size;
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total products: ${products.length}`);
  console.log(`Already had images: ${hasImage.size}`);
  console.log(`New images found: ${found}`);
  console.log(`Still missing: ${total - found}`);

  // Print missing products
  const foundIds = new Set(results.map(r => r.id));
  for (const p of products) {
    if (!hasImage.has(p.id) && !foundIds.has(p.id)) {
      const brand = brandMap[p.brand_id] || '';
      console.log(`MISSING: [${p.id}] ${brand} | ${p.name}`);
    }
  }
}

main().catch(console.error);
