import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.bing.com/search?q=Geekvape+Aegis+Solo+3+vape', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(2000);

  // Get the actual HTML of the first result
  const html = await page.evaluate(() => {
    const result = document.querySelector('.b_algo');
    if (!result) return 'No results found';
    return result.innerHTML.substring(0, 2000);
  });
  console.log('First result HTML:');
  console.log(html);

  // Also try to get the actual URL
  const urls = await page.evaluate(() => {
    const results = [];
    const algos = document.querySelectorAll('.b_algo');
    algos.forEach(algo => {
      const link = algo.querySelector('a');
      if (link) {
        results.push({
          href: link.href,
          text: link.textContent?.trim(),
          // Try to find the real URL
          cite: algo.querySelector('.b_caption .b_algo_single a, cite')?.textContent?.trim(),
          linkText: algo.querySelector('a')?.textContent?.trim()
        });
      }
    });
    return results.slice(0, 5);
  });

  console.log('\nParsed results:');
  console.log(JSON.stringify(urls, null, 2));

  // Also check what og:image the first result page has
  const firstLink = urls[0];
  if (firstLink) {
    console.log(`\nNavigating to actual URL...`);
    // The href is a Bing redirect, let's use it
    await page.goto(firstLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const pageInfo = await page.evaluate(() => ({
      url: window.location.href,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null,
      title: document.title
    }));
    console.log('Page info:', JSON.stringify(pageInfo, null, 2));
  }

  await browser.close();
}

main().catch(console.error);
