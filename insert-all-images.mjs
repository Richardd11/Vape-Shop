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

// === VERIFIED IMAGE URLs from earlier successful scrapes ===
const VERIFIED_IMAGES = new Map([
  // === DEVICES ===
  // Geekvape Aegis Solo 3
  ['a1000000-0000-0000-0000-000000000002', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png'],
  // Geekvape Aegis Legend 3
  ['786bbae5-a7af-41c6-ac27-a7506e26973b', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisLegend3.png'],
  // Geekvape Aegis Solo 3 (duplicate)
  ['29590cc1-ae36-426f-beef-7d07c1e6f999', 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png'],
  // Geekvape Wenax Q
  ['ffe3c799-f815-461e-8d16-48455aafc20c', 'https://www.geekvape.com/wp-content/uploads/2025/06/WenaxQ.png'],

  // Voopoo Drag S Pro
  ['a1000000-0000-0000-0000-000000000004', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png'],
  // Voopoo Drag S Pro (duplicate)
  ['daad1310-594e-45d6-96bb-7fef42448ff2', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png'],
  // Voopoo Argus G2
  ['eb4581ae-6fc1-4629-a0e1-e495710c5458', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/argus-g2.png'],
  // Voopoo XLIM
  ['838d6c5c-edad-413c-b86a-8a5ca5b1781a', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/xlim.png'],
  // Voopoo TPP Coil
  ['1843ee5c-41c4-4d82-bde4-53f36c67027c', 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/tpp-coil-5pack.png'],

  // Oxva Xlim V3 (from Oxva Shopify)
  ['a1000000-0000-0000-0000-000000000001', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMV3_1.jpg'],
  // Oxva Xlim Pro 2
  ['d0ac3b96-d373-487d-9dfe-3580cd242b5e', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMPRO2_1.jpg'],
  // Oxva Xlim SQ Pro
  ['b91b170e-0fce-417e-8d38-74772364f633', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMSQPRO.jpg'],
  // Oxva Xlim Pod Cartridge (3-Pack)
  ['9912962f-bdef-40d1-960a-e8fdfd7b5fff', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_3PACK.jpg'],
  // Oxva Xlim Pod (single)
  ['a1000000-0000-0000-0000-000000000010', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_1.jpg'],
  // Oxva Xlim Disposable 5000
  ['91148221-67c2-4f46-bff0-69e675ab2c6a', 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_DISPOSABLE.jpg'],

  // RELX Infinity Pod Device (from wvphvs)
  ['e2150362-2c4b-44bd-ad66-05cd7a61877c', 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916'],
  // RELX Pod Pro
  ['a1000000-0000-0000-0000-000000000011', 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916'],
  // Chillax Saltnic 30ml
  ['e5dddc95-e9a5-4977-a69e-f3ca6946c604', 'https://wvphvs.com/cdn/shop/files/chillax_chillx_chillaxgo_chillaxinfinite.jpg?v=1765005823'],

  // === DISPOSABLES ===
  // Elfbar BC5000 (x2)
  ['7a764883-48d2-4e38-a8b0-78416b17a4fe', 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg'],
  ['a1000000-0000-0000-0000-000000000013', 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg'],
  // Lost Mary BM5000/MO5000 (x3)
  ['c37aa4eb-1cc0-4a5f-a4a2-eaf61c3cab6c', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png'],
  ['f1b1445c-3116-44b1-8da1-27a34d6b308f', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png'],
  ['a1000000-0000-0000-0000-000000000014', 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png'],

  // BLCK Elite (from wvphvs)
  ['ec5ea10c-c2be-4bd7-9828-df30e9e20a44', 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851'],
  ['d606d074-2bde-4ded-9d75-ee414c0b6c1b', 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851'],
  ['bb267d4a-90e5-4bcb-be9d-c88b35f6015b', 'https://wvphvs.com/cdn/shop/files/BlackElitePodFormula.jpg?v=1719665352'],
  ['c935c3fd-a586-4ca9-a9d0-cd521cbf076d', 'https://wvphvs.com/cdn/shop/files/blackelitev1.jpg'],
  ['cff5f394-199f-4ce8-9061-46f866ade125', 'https://wvphvs.com/cdn/shop/files/ghostvape_v2ghost_v2ghost25k.jpg?v=1769509524'],
]);

// Products where we'll search for images via Bing
async function searchBingProductImage(page, query) {
  try {
    await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`, {
      waitUntil: 'networkidle',
      timeout: 20000
    });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      // Try to get the first actual product image
      const img = document.querySelector('.img_offc, .mimg, [class*="img"] img');
      if (img) {
        const src = img.src || img.getAttribute('src') || '';
        if (src && src.startsWith('http') && !src.includes('th.bing.com')) return src;
      }
      
      // Fall back to any large image
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        const src = img.src || '';
        if (src && src.startsWith('http') && src.includes('media') && !src.includes('th.bing.com')) return src;
      }
      
      // Last resort: Bing thumbnail
      return null;
    });

    return result;
  } catch {
    return null;
  }
}

async function main() {
  // Get all products from the DB
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  // Delete existing images
  await supabase.from('product_images').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared existing images');

  // Insert verified images
  let inserted = 0;
  for (const [productId, url] of VERIFIED_IMAGES) {
    const { error } = await supabase.rpc('insert_product_image', {
      p_product_id: productId,
      p_url: url,
      p_is_primary: true
    });
    if (error) {
      console.log(`✗ INSERT ERROR [${productId}]: ${error.message}`);
    } else {
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} verified images`);

  // Now search for remaining products via Bing
  const missingProducts = products.filter(p => {
    // Check if product already has image from verified set
    for (const [id] of VERIFIED_IMAGES) {
      if (id === p.id) return false;
    }
    return true;
  });

  console.log(`\n${missingProducts.length} products need images from Bing search...`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  for (const p of missingProducts) {
    const brand = brandMap[p.brand_id] || '';
    const query = `${brand} ${p.name.replace(/\([^)]*\)/g, '').trim()}`;
    process.stdout.write(`Searching "${query.substring(0, 40)}"... `);

    const imgUrl = await searchBingProductImage(page, query);
    if (imgUrl) {
      const { error } = await supabase.rpc('insert_product_image', {
        p_product_id: p.id,
        p_url: imgUrl,
        p_is_primary: true
      });
      if (error) {
        console.log(`✗ ${error.message}`);
      } else {
        console.log(`✓ inserted`);
        inserted++;
      }
    } else {
      console.log(`✗ no image found`);
    }

    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Final summary
  console.log(`\n\n=== FINAL SUMMARY ===`);
  console.log(`Total images inserted: ${inserted}`);
  console.log(`Total products: ${products.length}`);

  // Check which products still have no images
  const { data: finalImages } = await supabase.from('product_images').select('product_id');
  const withImages = new Set((finalImages || []).map(i => i.product_id));
  console.log(`Products with images now: ${withImages.size}`);

  for (const p of products) {
    if (!withImages.has(p.id)) {
      console.log(`STILL MISSING: [${p.id}] ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }
}

main().catch(console.error);
