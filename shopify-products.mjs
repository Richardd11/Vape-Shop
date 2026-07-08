// Use native fetch (Node 18+)
async function getShopifyProducts(domain) {
  const url = `https://${domain}/products.json?limit=250`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.products.map(p => ({
    title: p.title,
    img: p.images?.[0]?.src || null,
    handle: p.handle,
    product_type: p.product_type,
    vendor: p.vendor
  }));
}

// Known Shopify vape stores
const STORES = [
  'wvphvs.com',
  'elementvape.com',
  'vapeph.com',
];

async function main() {
  for (const store of STORES) {
    console.log(`\n=== ${store} ===`);
    try {
      const products = await getShopifyProducts(store);
      console.log(`Found ${products.length} products`);
      for (const p of products.slice(0, 5)) {
        console.log(`  ${p.title} => ${p.img?.substring(0, 80) || 'no img'}`);
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

main();
