import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('https://vape-shop-eight.vercel.app/store', { waitUntil: 'networkidle', timeout: 30000 });

// Wait for product images to appear (not skeleton loaders)
await page.waitForSelector('.group img', { timeout: 15000 });
await page.waitForTimeout(3000);

const results = await page.evaluate(() => {
  const imgs = document.querySelectorAll('.group img');
  return Array.from(imgs).map((img, i) => {
    const src = img.getAttribute('src') || '';
    const naturalW = img.naturalWidth || 0;
    const naturalH = img.naturalHeight || 0;
    const complete = img.complete;
    const ok = complete && naturalW > 0 && naturalH > 0;
    return { i, ok, src: src.length > 90 ? src.substring(0, 90) + '...' : src, w: naturalW, h: naturalH };
  });
});

const total = results.length;
const ok = results.filter(r => r.ok).length;
const broken = results.filter(r => !r.ok);

console.log(`\n=== Product Images: ${ok}/${total} OK, ${total - ok} broken ===\n`);
if (broken.length > 0) {
  console.log('--- BROKEN ---');
  broken.forEach(r => console.log(`  [${r.i}] ${r.src}`));
}
console.log('\n--- ALL ---');
results.forEach(r => console.log(`  ${r.ok ? '✓' : '✗'} [${r.i}] w=${r.w} h=${r.h} ${r.src}`));

await browser.close();
