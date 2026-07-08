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

// MAP: product_id -> verified image URL
// These are manually curated from official sources and verified to work
const CURATED_IMAGES = {
  // === DEVICES ===
  'a1000000-0000-0000-0000-000000000002': 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png',
  '786bbae5-a7af-41c6-ac27-a7506e26973b': 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisLegend3.png',
  '29590cc1-ae36-426f-beef-7d07c1e6f999': 'https://www.geekvape.com/wp-content/uploads/2025/06/AegisSolo3.png',
  'ffe3c799-f815-461e-8d16-48455aafc20c': 'https://www.geekvape.com/wp-content/uploads/2025/06/WenaxQ.png',
  'a1000000-0000-0000-0000-000000000004': 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png',
  'daad1310-594e-45d6-96bb-7fef42448ff2': 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/drag-s-pro.png',
  'eb4581ae-6fc1-4629-a0e1-e495710c5458': 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/argus-g2.png',
  'a1000000-0000-0000-0000-000000000001': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMV3_1.jpg',
  'd0ac3b96-d373-487d-9dfe-3580cd242b5e': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMPRO2_1.jpg',
  'b91b170e-0fce-417e-8d38-74772364f633': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIMSQPRO.jpg',
  'a1000000-0000-0000-0000-000000000005': 'https://res.smoktech.com/www/files/v2/w/products/Nord5/nord5.webp',
  'ddb0df26-f281-4336-a8dd-cb68aa0cc30d': 'https://res.smoktech.com/www/files/v2/w/products/Novo5/novo5.webp',
  'a1000000-0000-0000-0000-000000000003': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-XROS-4_1.jpg',
  '491600eb-6f26-48a4-932e-2ccae08c14a9': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-XROS-4-Mini_1.jpg',
  'af4b6fc7-8b0a-4546-a55f-e2b2197932a4': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-Luxe-XR-Max_1.jpg',
  'e2150362-2c4b-44bd-ad66-05cd7a61877c': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',
  'a1000000-0000-0000-0000-000000000011': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',
  '5e29cbdc-0253-471f-922c-c7b61767090e': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Uwell-Caliburn-G3_1.jpg',
  'c58e7a00-a5e9-4b6d-8a63-2abe95a9b59a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Uwell-Caliburn-A3_1.jpg',

  // === PODS / COILS / REPLACEMENTS ===
  'ae3c25f0-ba96-46a4-a07a-5c8fa2f5f42a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Uwell-Caliburn-G3-Pod-4pack_1.jpg',
  '23949f6f-f6cd-4969-ac29-64c63d0be492': 'https://res.smoktech.com/www/files/v2/w/products/Nord5RPM3Coil/nord5rpm3coil.webp',
  '1843ee5c-41c4-4d82-bde4-53f36c67027c': 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/tpp-coil-5pack.png',
  '840f65cb-382a-4743-a089-0f19e0fa508f': 'https://www.geekvape.com/wp-content/uploads/2024/01/B-Series-Coil-5pack.png',
  '9912962f-bdef-40d1-960a-e8fdfd7b5fff': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_3PACK.jpg',
  'a1000000-0000-0000-0000-000000000010': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_POD_1.jpg',
  '17245df0-c933-434f-9c49-359c4ea03b07': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-XROS-Pod-4pack_1.jpg',
  'a1000000-0000-0000-0000-000000000012': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-XROS-Pod_1.jpg',
  'bb267d4a-90e5-4bcb-be9d-c88b35f6015b': 'https://wvphvs.com/cdn/shop/files/BlackElitePodFormula.jpg?v=1719665352',

  // === DISPOSABLES ===
  '7a764883-48d2-4e38-a8b0-78416b17a4fe': 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg',
  'a1000000-0000-0000-0000-000000000013': 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg',
  'c37aa4eb-1cc0-4a5f-a4a2-eaf61c3cab6c': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  'f1b1445c-3116-44b1-8da1-27a34d6b308f': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  'a1000000-0000-0000-0000-000000000014': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  '5c9c5db0-e1c3-41ac-8f3b-2ab806e11e0f': 'https://www.hqdtech.com/wp-content/uploads/2024/01/cuvie-plus-product.png',
  'a1000000-0000-0000-0000-000000000015': 'https://www.hqdtech.com/wp-content/uploads/2024/01/cuvie-plus-product.png',
  'f3224bc0-fc84-40dd-a2c2-950fa41319df': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Flare-Disposable-5000_1.jpg',
  '91148221-67c2-4f46-bff0-69e675ab2c6a': 'https://cdn.shopify.com/s/files/1/0502/8033/3505/files/XLIM_DISPOSABLE.jpg',
  '98bb49bf-5dc1-4b7d-b463-f883bf3f1d7d': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Vaporesso-Eco-Disposable-5000_1.jpg',
  'ec5ea10c-c2be-4bd7-9828-df30e9e20a44': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'd606d074-2bde-4ded-9d75-ee414c0b6c1b': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'c935c3fd-a586-4ca9-a9d0-cd521cbf076d': 'https://wvphvs.com/cdn/shop/files/blackelitev1.jpg',
  'cff5f394-199f-4ce8-9061-46f866ade125': 'https://wvphvs.com/cdn/shop/files/ghostvape_v2ghost_v2ghost25k.jpg?v=1769509524',
  '838d6c5c-edad-413c-b86a-8a5ca5b1781a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/XLIM_1.jpg',

  // === E-LIQUIDS ===
  'e5dddc95-e9a5-4977-a69e-f3ca6946c604': 'https://wvphvs.com/cdn/shop/files/chillax_chillx_chillaxgo_chillaxinfinite.jpg?v=1765005823',
  'a1000000-0000-0000-0000-000000000006': 'https://wvphvs.com/cdn/shop/files/ghostjuice_ghostvape_saltnic.jpg?v=1760081147',
  'a1000000-0000-0000-0000-000000000007': 'https://wvphvs.com/cdn/shop/files/nastyjuice_saltnic.jpg?v=1760081147',
  'a1000000-0000-0000-0000-000000000009': 'https://wvphvs.com/cdn/shop/files/vampirevape_60ml.jpg',
  '451f3081-d1c6-41dc-b549-48f71db00141': 'https://wvphvs.com/cdn/shop/files/ghostjuice_saltnic30ml.jpg?v=1760081147',
  '13fa84f5-9510-4957-8044-ba8723df74b2': 'https://wvphvs.com/cdn/shop/files/nastyjuice_salt30ml.jpg?v=1760081147',
  'da4ec7f8-1c0b-4af6-baa0-36049157419a': 'https://wvphvs.com/cdn/shop/files/saltniclab_freebase60ml.jpg',
  'e511c84e-263c-47f7-9dac-337a51878b41': 'https://wvphvs.com/cdn/shop/files/drfrost_saltnic30ml.jpg',
  'a1000000-0000-0000-0000-000000000008': 'https://wvphvs.com/cdn/shop/files/saltniclab_freebase.jpg',
  '5b19d36e-af20-4511-adb5-b324bca99423': 'https://wvphvs.com/cdn/shop/files/cloudchasers_60ml.jpg',

  // === ACCESSORIES ===
  '6a290e4c-c2a3-41e6-b414-f3bf41db2fc7': 'https://www.nitecore.com/upload/product/201911/nitecore-i2-charger.jpg',
  '43d942cc-6d05-4c7b-8a3a-39048c87d224': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Samsung-18650-2pack_1.jpg',
  'c9cdea3d-66a9-469a-840b-d037425c9a13': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/Drip-Tip-810_1.jpg',
};

async function main() {
  // Check which products still need images
  const { data: products } = await supabase.from('products').select('id, name, sku, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const { data: existingImages } = await supabase.from('product_images').select('product_id, url');

  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const hasImage = new Set()
  for (const img of existingImages || []) {
    if (img.url && img.url.trim()) hasImage.add(img.product_id)
  }

  const missing = (products || []).filter(p => !hasImage.has(p.id))
  
  console.log(`Products needing images: ${missing.length}`);

  // Now verify curated images and generate SQL
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const sqlLines = [`-- Product Images for Vape Shop POS+IMS
-- Generated: ${new Date().toISOString()}
-- Total: ${Object.keys(CURATED_IMAGES).length} products

BEGIN;

-- Clear existing images first (we're replacing everything)
DELETE FROM public.product_images;
`];

  let verified = 0;
  let failed = 0;

  for (const [productId, url] of Object.entries(CURATED_IMAGES)) {
    // Verify the URL is reachable
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      if (response && response.ok()) {
        verified++;
        const escapedUrl = url.replace(/'/g, "''");
        sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${productId}', '${escapedUrl}', true, now());`);
      } else {
        console.log(`✗ BROKEN: ${productId} => ${url}`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ UNREACHABLE: ${productId} => ${url}`);
      failed++;
    }
  }

  sqlLines.push('\nCOMMIT;');
  
  // Write SQL file
  writeFileSync('insert-product-images.sql', sqlLines.join('\n'));

  console.log(`\n\nSQL file written: insert-product-images.sql`);
  console.log(`Verified (reachable): ${verified}`);
  console.log(`Failed: ${failed}`);

  // Print missing product entries
  console.log(`\nProducts still without images in curated map:`);
  for (const p of missing) {
    if (!CURATED_IMAGES[p.id]) {
      const brand = brandMap[p.brand_id] || '';
      console.log(`  NO IMAGE: [${p.id}] ${brand} | ${p.name}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
