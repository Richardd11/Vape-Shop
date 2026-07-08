import { readFileSync } from 'fs';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to wvphvs.com...');
  await page.goto('https://wvphvs.com/collections/all', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const products = await page.evaluate(() => {
    const items = [];
    const cards = document.querySelectorAll('.product-item, .card, [data-product], li.grid__item');
    cards.forEach(card => {
      const link = card.querySelector('a')?.href || '';
      const title = (
        card.querySelector('.card__heading a, .product-item__title, h3 a, .full-unstyled-link, .card__heading') ||
        card.querySelector('[class*="title"] a, [class*="heading"] a') ||
        card.querySelector('h3, h2')
      )?.textContent?.trim() || '';
      const img = card.querySelector('img')?.src || 
                  card.querySelector('img')?.getAttribute('data-src') || '';
      if (title && img) items.push({ title, img, link });
    });
    return items;
  });

  console.log(`Found ${products.length} products`);
  for (const p of products.slice(0, 30)) {
    console.log(`${p.title} => ${p.img.substring(0, 100)}`);
  }

  await browser.close();
}

main().catch(console.error);
