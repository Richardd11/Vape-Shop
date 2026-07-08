import { readFileSync } from 'fs';
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

const IMAGES = {
  'e5dddc95-e9a5-4977-a69e-f3ca6946c604': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/CHILLAXGO_CHILLX_CHILLXGO.jpg',
  'ec5ea10c-c2be-4bd7-9828-df30e9e20a44': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'd606d074-2bde-4ded-9d75-ee414c0b6c1b': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/black-elite-v2-12000-puffs.jpg?v=1716718851',
  'bb267d4a-90e5-4bcb-be9d-c88b35f6015b': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/BlackElitePodFormula.jpg?v=1719665352',
  'c935c3fd-a586-4ca9-a9d0-cd521cbf076d': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/blackelitev1.jpg',
  'cff5f394-199f-4ce8-9061-46f866ade125': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/ghostvape_v2ghost_v2ghost25k.jpg?v=1769509524',
  'e2150362-2c4b-44bd-ad66-05cd7a61877c': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/relxwecreate.jpg?v=1752064916',
  'a1000000-0000-0000-0000-000000000011': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/relxwecreate.jpg?v=1752064916',
  '7a764883-48d2-4e38-a8b0-78416b17a4fe': 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg',
  'a1000000-0000-0000-0000-000000000013': 'https://dbh4s5ja0maaw.cloudfront.net/products/bc5000/card-1.jpg',
  'c37aa4eb-1cc0-4a5f-a4a2-eaf61c3cab6c': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  'f1b1445c-3116-44b1-8da1-27a34d6b308f': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  'a1000000-0000-0000-0000-000000000014': 'https://d31ixytk8zua6i.cloudfront.net/uploads/202506181138204215.png',
  'a1000000-0000-0000-0000-000000000001': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  'd0ac3b96-d373-487d-9dfe-3580cd242b5e': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  'b91b170e-0fce-417e-8d38-74772364f633': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  '9912962f-bdef-40d1-960a-e8fdfd7b5fff': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  'a1000000-0000-0000-0000-000000000010': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  '91148221-67c2-4f46-bff0-69e675ab2c6a': 'https://cdn.shopify.com/s/files/1/0556/3429/6912/files/nexlim_blacknexlim.jpg?v=1780131272',
  '1843ee5c-41c4-4d82-bde4-53f36c67027c': 'https://sen.voopoo.com.cn/www-voopoo/static/dist/uploads/202605/20260520/%E6%AD%A3%E4%BE%A7%281%29.png',

  '491600eb-6f26-48a4-932e-2ccae08c14a9': 'https://store.vaporesso.com/cdn/shop/files/XROS4MINI-black.png?v=1783424239',
  'a1000000-0000-0000-0000-000000000003': 'https://store.vaporesso.com/cdn/shop/files/XROS4-pastelpalette.png?v=1783433568',
  'af4b6fc7-8b0a-4546-a55f-e2b2197932a4': 'https://cdn11.bigcommerce.com/s-fi8xpl/images/stencil/1280x1280/products/1334/5282/Vaporesso-Luxe-80W-XR-Max-Pod-System_4966__50549.1741334291.jpg?c=2',
  'c58e7a00-a5e9-4b6d-8a63-2abe95a9b59a': 'https://files.myuwell.com/blob/product/caliburn-a3/color/1.webp',
  '5b19d36e-af20-4511-adb5-b324bca99423': 'https://jayscard.com/wp-content/uploads/images/1547/Cloud-chaser-Fruitia-Banana-Ice-60ml-Vape-Juice-Flavor-chasers-ly0.jpg',
  'c25fe921-0a73-47bf-b4f0-f197417f63fe': 'https://files.myuwell.com/blob/product/caliburn-a3/color/1.webp',

};

async function main() {
  await supabase.from('product_images').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');

  let ok = 0, fail = 0;
  for (const [id, url] of Object.entries(IMAGES)) {
    const { error } = await supabase.rpc('insert_product_image', {
      p_product_id: id,
      p_url: url,
      p_is_primary: true
    });
    if (error) { fail++; console.log(`FAIL ${id}: ${error.message}`); }
    else { ok++; }
  }

  console.log(`\nInserted: ${ok}, Failed: ${fail}`);

  const { data: products } = await supabase.from('products').select('id, name, brand_id');
  const { data: brands } = await supabase.from('brands').select('id, name');
  const brandMap = {};
  for (const b of brands || []) brandMap[b.id] = b.name;
  const { data: current } = await supabase.from('product_images').select('product_id');
  const currentSet = new Set((current || []).map(i => i.product_id));

  console.log(`Products with images: ${currentSet.size}/${products.length}`);
  console.log('\nStill missing:');
  for (const p of products || []) {
    if (!currentSet.has(p.id)) {
      console.log(`  ${brandMap[p.brand_id] || ''} | ${p.name}`);
    }
  }
}

main().catch(console.error);
