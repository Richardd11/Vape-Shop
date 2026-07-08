import { chromium } from 'playwright';

const BASE = 'https://vape-shop-eight.vercel.app';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // ✅ Step 1: Go to POS
  console.log('➡️ Navigating to POS...');
  await page.goto(`${BASE}/pos`, { waitUntil: 'networkidle', timeout: 30000 });

  // ✅ Step 2: Login
  console.log('🔐 Logging in...');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'admin@vapeshop.ph');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('✅ Logged in! Redirecting to POS...');
  await page.goto(`${BASE}/pos`, { waitUntil: 'networkidle', timeout: 30000 });

  // wait for products to load
  await sleep(3000);

  // ✅ Step 3: Click first available product to add to cart
  console.log('🛒 Adding product to cart...');
  const products = page.locator('button:has(img)');
  const count = await products.count();
  if (count === 0) {
    console.log('❌ No products found');
    await browser.close();
    return;
  }

  // Click first enabled product button
  const firstProduct = page.locator('button').filter({ has: page.locator('img') }).first();
  await firstProduct.click();
  await sleep(1000);

  // ✅ Step 4: If variant picker appears, select first variant
  const variantModal = page.locator('text=Select a variant');
  if (await variantModal.isVisible().catch(() => false)) {
    console.log('📦 Selecting variant...');
    const variantBtn = page.locator('.card-glass button:not([disabled])').filter({ hasText: /₱/ }).first();
    if (await variantBtn.isVisible().catch(() => false)) {
      await variantBtn.click();
      await sleep(500);
    }
  }

  // ✅ Step 5: Open checkout
  console.log('🧾 Opening checkout...');
  await page.click('#checkout-btn');
  await sleep(1000);

  // ✅ Step 6: Get all payment method buttons
  const paymentButtons = page.locator('.card-glass .grid.grid-cols-3 button');
  const btnCount = await paymentButtons.count();
  console.log(`Payment buttons found: ${btnCount}`);

  let gcashClicked = false;
  for (let i = 0; i < btnCount; i++) {
    const text = await paymentButtons.nth(i).textContent();
    console.log(`  Button ${i}: "${text.trim()}"`);
    if (text.includes('GCash') && !text.includes('+')) {
      console.log('💳 Clicking GCash...');
      await paymentButtons.nth(i).click();
      gcashClicked = true;
      await sleep(500);
      break;
    }
  }

  if (!gcashClicked) {
    console.log('❌ Pure GCash button not found');
  }

  // ✅ Step 8: Fill GCash amount (use total)
  const gcashInput = page.locator('input[type="number"]').first();
  if (await gcashInput.isVisible().catch(() => false)) {
    const totalText = await page.locator('.card-glass .text-brand-400').last().textContent();
    const total = totalText.replace(/[^0-9.]/g, '');
    await gcashInput.fill(total);
    console.log(`💰 GCash amount: ${total}`);
  }

  // ✅ Step 9: Click Confirm Sale
  console.log('✅ Clicking Confirm Sale...');
  const confirmBtn = page.locator('#confirm-sale-btn');
  await confirmBtn.click();

  // Wait for result
  await sleep(5000);

  // Check what happened
  const pageContent = await page.content();
  if (pageContent.includes('Complete payment') || pageContent.includes('GCash window')) {
    console.log('✅ GCash flow started - PayMongo checkout opened!');
  } else {
    console.log('⚠️ No PayMongo flow detected. Checking for errors...');
    const toast = page.locator('.toast, [role="status"], [role="alert"]');
    if (await toast.isVisible().catch(() => false)) {
      const toastText = await toast.textContent();
      console.log(`Toast message: ${toastText}`);
    }
  }

  // Check how many tabs are now open
  const pages = context.pages();
  console.log(`Open tabs: ${pages.length}`);

  // Take screenshot
  await page.screenshot({ path: 'paymongo-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved: paymongo-test-result.png');

  await browser.close();
  console.log('🏁 Done!');
}

run().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
