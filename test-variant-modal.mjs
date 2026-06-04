import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// Login
await page.goto('http://localhost:3000/login', { timeout: 15000, waitUntil: 'networkidle' });
await page.fill('#email', 'admin@vapeshop.ph');
await page.fill('#password', 'admin123');
await page.click('button:has-text("Sign In")');
await page.waitForTimeout(5000);

// Go to inventory and find first product to edit
await page.goto('http://localhost:3000/inventory', { timeout: 10000, waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Click edit link for first product
const editLinks = page.locator('a[href*="/inventory/"][class*="text-brand"]').first();
if (await editLinks.count() > 0) {
  await editLinks.click();
} else {
  // Try mobile card layout
  const mobileLinks = await page.locator('.md\\:hidden a[href*="/inventory/"]').all();
  console.log(`Mobile edit links: ${mobileLinks.length}`);
  if (mobileLinks.length > 0) {
    await mobileLinks[0].click();
  } else {
    // Try any link to inventory detail
    const anyLinks = await page.locator('a[href*="/inventory/"]').all();
    console.log(`All inventory links: ${anyLinks.length}`);
    for (const link of anyLinks) {
      const href = await link.getAttribute('href');
      console.log('  Link:', href);
      if (href && href.match(/\/inventory\/[a-f0-9-]+$/)) {
        await link.click();
        break;
      }
    }
  }
}
await page.waitForTimeout(3000);
console.log('Edit page URL:', page.url());

// Check for VariantEditor
const variantCards = await page.locator('.sm\\:hidden .rounded-xl.border').all();
console.log(`Mobile variant cards: ${variantCards.length}`);

if (variantCards.length > 0) {
  // Get first card's stock
  const firstCard = variantCards[0];
  const stockInput = firstCard.locator('input[type="number"]').first();
  const oldStock = await stockInput.inputValue();
  console.log('Old stock:', oldStock);

  // Click plus button
  const plusBtn = firstCard.locator('button svg.lucide-plus').first();
  // Alternative: find button with plus icon
  const plusBtns = firstCard.locator('button').all();
  let clicked = false;
  for (const btn of plusBtns) {
    const inner = await btn.innerHTML();
    if (inner.includes('lucide-plus') || inner.includes('Plus')) {
      await btn.click();
      clicked = true;
      console.log('Clicked plus button');
      await page.waitForTimeout(500);
      break;
    }
  }
  if (!clicked) console.log('Could not find plus button');

  const newStock = await stockInput.inputValue();
  console.log('New stock:', newStock);

  // Click save button
  const saveBtn = page.locator('button:has-text("Save")').last();
  const saveVisible = await saveBtn.isVisible();
  console.log('Save button visible:', saveVisible);
  const saveDisabled = await saveBtn.isDisabled();
  console.log('Save button disabled:', saveDisabled);

  if (saveVisible && !saveDisabled) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
    console.log('Clicked save. URL:', page.url());
    
    // Check for error
    const errorMsg = await page.locator('text=/error|failed/i').first().textContent().catch(() => '');
    if (errorMsg) console.log('Error message:', errorMsg);
  }

  await page.screenshot({ path: 'screenshots/variant-editor-test.png', fullPage: false });
}

await browser.close();
