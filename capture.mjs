import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  console.log("Launching Edge...");
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));

  console.log("Navigating to app...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  console.log("Forcing navigation to bills...");
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'BILLS' } }));
  });
  
  await new Promise(r => setTimeout(r, 2000));

  console.log("Extracting HTML...");
  const html = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  
  fs.writeFileSync('dom_dump.html', html);
  fs.writeFileSync('browser_logs.txt', logs.join('\n'));
  
  console.log("Done.");
  await browser.close();
})();
