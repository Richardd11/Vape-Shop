import { readFileSync, writeFileSync, appendFileSync } from 'fs';
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

// === VERIFIED IMAGE URLS (tested and working) ===
const VERIFIED = new Map(Object.entries({
  // --- Devices ---
  'a1000000-0000-0000-0000-000000000002': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33817/205674/Geekvape-Aegis-Solo-3__09525.1738230227.jpg',
  '786bbae5-a7af-41c6-ac27-a7506e26973b': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33816/205668/Geekvape-Aegis-Legend-3__28266.1738230126.jpg',
  '29590cc1-ae36-426f-beef-7d07c1e6f999': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33817/205674/Geekvape-Aegis-Solo-3__09525.1738230227.jpg',
  'ffe3c799-f815-461e-8d16-48455aafc20c': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33818/205681/Geekvape-Wenax-Q__64555.1738230336.jpg',
  
  'a1000000-0000-0000-0000-000000000004': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32689/197745/Voopoo-Drag-S-Pro__04393.1738006520.jpg',
  'daad1310-594e-45d6-96bb-7fef42448ff2': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32689/197745/Voopoo-Drag-S-Pro__04393.1738006520.jpg',
  'eb4581ae-6fc1-4629-a0e1-e495710c5458': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32690/197750/Voopoo-Argus-G2__02396.1738006553.jpg',
  '838d6c5c-edad-413c-b86a-8a5ca5b1781a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32689/197745/Voopoo-Drag-S-Pro__04393.1738006520.jpg',

  'a1000000-0000-0000-0000-000000000001': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32111/194783/Oxva-Xlim-V3__74055.1738004240.jpg',
  'd0ac3b96-d373-487d-9dfe-3580cd242b5e': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32152/194646/Oxva-Xlim-Pro-2__47178.1738004098.jpg',
  'b91b170e-0fce-417e-8d38-74772364f633': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32150/194637/Oxva-Xlim-SQ-Pro__78069.1738004070.jpg',

  'a1000000-0000-0000-0000-000000000005': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31679/191668/Smok-Nord-5__45753.1738002697.jpg',
  'ddb0df26-f281-4336-a8dd-cb68aa0cc30d': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31677/191655/Smok-Novo-5__54856.1738002684.jpg',

  'a1000000-0000-0000-0000-000000000003': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32952/199351/Vaporesso-XROS-4__93989.1738007883.jpg',
  '491600eb-6f26-48a4-932e-2ccae08c14a9': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32953/199358/Vaporesso-XROS-4-Mini__74910.1738007901.jpg',
  'af4b6fc7-8b0a-4546-a55f-e2b2197932a4': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32955/199365/Vaporesso-Luxe-XR-Max__77923.1738007930.jpg',

  '5e29cbdc-0253-471f-922c-c7b61767090e': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32825/198573/Uwell-Caliburn-G3__46555.1738008224.jpg',
  'c58e7a00-a5e9-4b6d-8a63-2abe95a9b59a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32824/198568/Uwell-Caliburn-A3__32622.1738008205.jpg',

  'e2150362-2c4b-44bd-ad66-05cd7a61877c': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',
  'a1000000-0000-0000-0000-000000000011': 'https://wvphvs.com/cdn/shop/files/relxwecreate.jpg?v=1752064916',

  // --- Pods / Coils ---
  'ae3c25f0-ba96-46a4-a07a-5c8fa2f5f42a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32826/198578/Uwell-Caliburn-G3-Pod-4pack__83488.1738008243.jpg',
  '23949f6f-f6cd-4969-ac29-64c63d0be492': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31680/191674/Smok-Nord-5-RPM3-Coil-5pack__77926.1738002706.jpg',
  '1843ee5c-41c4-4d82-bde4-53f36c67027c': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32688/197741/Voopoo-TPP-Coil-5pack__83413.1738006497.jpg',
  '840f65cb-382a-4743-a089-0f19e0fa508f': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/33819/205686/Geekvape-B-Series-Coil-5pack__39164.1738230384.jpg',
  '9912962f-bdef-40d1-960a-e8fdfd7b5fff': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32151/194641/Oxva-Xlim-Pod-Cartridge-3pack__00053.1738004085.jpg',
  'a1000000-0000-0000-0000-000000000010': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32151/194641/Oxva-Xlim-Pod-Cartridge-3pack__00053.1738004085.jpg',
  '17245df0-c933-434f-9c49-359c4ea03b07': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32954/199361/Vaporesso-XROS-Pod-4pack__91652.1738007916.jpg',
  'a1000000-0000-0000-0000-000000000012': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32954/199361/Vaporesso-XROS-Pod-4pack__91652.1738007916.jpg',
  'bb267d4a-90e5-4bcb-be9d-c88b35f6015b': 'https://wvphvs.com/cdn/shop/files/BlackElitePodFormula.jpg?v=1719665352',

  // --- Disposables ---
  '7a764883-48d2-4e38-a8b0-78416b17a4fe': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31681/191680/Elfbar-BC5000__19226.1738002715.jpg',
  'a1000000-0000-0000-0000-000000000013': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31681/191680/Elfbar-BC5000__19226.1738002715.jpg',
  'c37aa4eb-1cc0-4a5f-a4a2-eaf61c3cab6c': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31852/192668/Lost-Mary-BM5000__37687.1738003430.jpg',
  'f1b1445c-3116-44b1-8da1-27a34d6b308f': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31853/192674/Lost-Mary-MO5000__41970.1738003443.jpg',
  'a1000000-0000-0000-0000-000000000014': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31852/192668/Lost-Mary-BM5000__37687.1738003430.jpg',
  '5c9c5db0-e1c3-41ac-8f3b-2ab806e11e0f': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31682/191686/HQD-Cuvie-Plus__05580.1738002723.jpg',
  'a1000000-0000-0000-0000-000000000015': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31682/191686/HQD-Cuvie-Plus__05580.1738002723.jpg',
  'f3224bc0-fc84-40dd-a2c2-950fa41319df': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31683/191691/Flare-Disposable-5000__23307.1738002735.jpg',
  '91148221-67c2-4f46-bff0-69e675ab2c6a': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32149/194632/Oxva-Xlim-Disposable-5000__25385.1738004054.jpg',
  '98bb49bf-5dc1-4b7d-b463-f883bf3f1d7d': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/32956/199370/Vaporesso-Eco-Disposable-5000__66883.1738007947.jpg',
  'ec5ea10c-c2be-4bd7-9828-df30e9e20a44': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'd606d074-2bde-4ded-9d75-ee414c0b6c1b': 'https://wvphvs.com/cdn/shop/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'c935c3fd-a586-4ca9-a9d0-cd521cbf076d': 'https://wvphvs.com/cdn/shop/files/blackelitev1.jpg',
  'cff5f394-199f-4ce8-9061-46f866ade125': 'https://wvphvs.com/cdn/shop/files/ghostvape_v2ghost_v2ghost25k.jpg?v=1769509524',

  // --- E-liquids ---
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

  // --- Accessories ---
  '6a290e4c-c2a3-41e6-b414-f3bf41db2fc7': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31685/191697/Nitecore-i2-Charger__48484.1738002761.jpg',
  '43d942cc-6d05-4c7b-8a3a-39048c87d224': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31684/191694/Samsung-18650-2pack__88086.1738002751.jpg',
  'c9cdea3d-66a9-469a-840b-d037425c9a13': 'https://cdn11.bigcommerce.com/s-7c32k5fgkn/images/stencil/1280x1280/products/31686/191702/Drip-Tip-810__76777.1738002771.jpg',
}));

async function main() {
  // Get products and brands for reference
  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  // Generate SQL
  const sqlLines = [
    '-- Product Images for Vape Shop POS+IMS',
    '-- Generated: ' + new Date().toISOString(),
    '-- Run this in Supabase Dashboard → SQL Editor',
    '',
    'BEGIN;',
    '',
    '-- Clear existing images (we are replacing with verified URLs)',
    'DELETE FROM public.product_images;',
    '',
  ];

  // Track which products got images
  const covered = new Set();
  for (const [productId, url] of VERIFIED) {
    const escapedUrl = url.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.product_images (product_id, url, is_primary, created_at) VALUES ('${productId}', '${escapedUrl}', true, now());`);
    covered.add(productId);
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');
  sqlLines.push('');

  // Check for missing products
  const missing = (products || []).filter(p => !covered.has(p.id));
  if (missing.length > 0) {
    sqlLines.push('-- PRODUCTS STILL MISSING IMAGES:');
    for (const p of missing) {
      const brand = brandMap[p.brand_id] || 'Unknown';
      sqlLines.push(`-- [${p.id}] ${brand} | ${p.name}`);
    }
  }

  sqlLines.push('');
  sqlLines.push(`-- Total: ${VERIFIED.size} images inserted, ${missing.length} still missing`);

  writeFileSync('insert-product-images.sql', sqlLines.join('\n'));
  console.log(`SQL file written: insert-product-images.sql`);
  console.log(`Images: ${VERIFIED.size}`);
  console.log(`Missing: ${missing.length}`);

  if (missing.length > 0) {
    console.log('\nMissing products:');
    for (const p of missing) {
      const brand = brandMap[p.brand_id] || 'Unknown';
      console.log(`  [${p.id}] ${brand} | ${p.name}`);
    }
  }
}

main().catch(console.error);
