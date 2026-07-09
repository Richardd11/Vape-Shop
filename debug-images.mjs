import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Log all image requests with their status
page.on('response', resp => {
  if (resp.url().includes('supabase.co') || resp.url().includes('.png') || resp.url().includes('.jpg') || resp.url().includes('.webp')) {
    console.log('IMG:', resp.status(), resp.url().substring(0, 100));
  }
});

let consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 150));
});
page.on('pageerror', err => consoleErrors.push(err.message));

await page.goto('https://vape-shop-eight.vercel.app/store/products', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Check the actual DOM for image elements and their src attributes
const domInfo = await page.evaluate(() => {
  const productCards = document.querySelectorAll('.group');
  const imgs = document.querySelectorAll('.group img');
  return {
    productCardCount: productCards.length,
    imageCount: imgs.length,
    images: Array.from(imgs).map(img => ({
      src: img.getAttribute('src') || '(EMPTY)',
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    })),
    firstCardInner: productCards.length > 0 ? productCards[0].innerHTML.substring(0, 500) : 'NONE'
  };
});

console.log('\n=== DOM INFO ===');
console.log('Product cards:', domInfo.productCardCount);
console.log('Image elements:', domInfo.imageCount);
console.log('First card HTML:', domInfo.firstCardInner.substring(0, 300));
console.log('\n=== IMAGE CHECK ===');
domInfo.images.forEach((img, i) => {
  const status = img.complete && img.naturalWidth > 0 ? 'OK' : 'BROKEN';
  console.log(i, status, 'src=' + img.src.substring(0, 90));
});

console.log('\nConsole errors:', consoleErrors.length ? consoleErrors : 'NONE');

await browser.close();
