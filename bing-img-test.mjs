import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('https://www.bing.com/images/search?q=Geekvape+Aegis+Solo+3+vape&form=HDRSC2&first=1', {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(3000);

  // See what the page looks like
  const info = await page.evaluate(() => {
    // Check for the image grid
    const imgs = document.querySelectorAll('img');
    const results = [];
    imgs.forEach((img, i) => {
      if (i < 10) {
        results.push({
          src: img.src?.substring(0, 120),
          width: img.naturalWidth,
          height: img.naturalHeight,
          alt: img.alt?.substring(0, 50),
          cls: img.className?.substring(0, 50)
        });
      }
    });
    return results;
  });

  console.log('Images on page:');
  console.log(JSON.stringify(info, null, 2));

  // Check for the main result elements
  const links = await page.evaluate(() => {
    const results = [];
    // Check various selectors
    ['.imgpt', '.mimg', '.iusc', '[class*="img"]', '.infopt'].forEach(sel => {
      const els = document.querySelectorAll(sel);
      results.push(`${sel}: ${els.length} elements`);
    });
    return results;
  });
  console.log('\nSelectors:', links);

  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
