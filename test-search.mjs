import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });  // visible for debugging
  const page = await browser.newPage();

  // Test DuckDuckGo
  console.log('=== DuckDuckGo HTML ===');
  await page.goto('https://html.duckduckgo.com/html/?q=Geekvape+Aegis+Solo+3+vape', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(2000);
  
  const ddgContent = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const urls = [];
    links.forEach(a => {
      if (a.href && a.href.includes('http') && !a.href.includes('duckduckgo')) {
        urls.push(a.href.substring(0, 100));
      }
    });
    return urls.slice(0, 10);
  });
  console.log('DDG results:', ddgContent);

  // Test Bing
  console.log('\n=== Bing ===');
  await page.goto('https://www.bing.com/search?q=Geekvape+Aegis+Solo+3+vape', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(2000);
  
  const bingContent = await page.evaluate(() => {
    const links = document.querySelectorAll('.b_algo h2 a');
    return Array.from(links).map(a => ({ text: a.textContent?.trim(), href: a.href?.substring(0, 100) }));
  });
  console.log('Bing results:', bingContent);

  // Also dump non-google links
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href^="http"]')).slice(0, 20).map(a => ({
      text: a.textContent?.trim().substring(0, 50),
      href: a.href?.substring(0, 100),
      cls: a.className
    }));
  });
  console.log('\nAll links on Bing:', allLinks);

  await browser.close();
}

main().catch(console.error);
