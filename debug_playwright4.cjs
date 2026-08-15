const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Navigating...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('Waiting for splash screen...');
    await page.waitForTimeout(6000);
    
    console.log('Forcing navigation to invoices...');
    await page.evaluate(() => {
       window.dispatchEvent(new CustomEvent('accounting-nav', { detail: 'invoices' }));
    });
    
    await page.waitForTimeout(3000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body snippet:', bodyText.substring(0, 500).replace(/\n/g, ' '));
    
    console.log('Finished waiting');
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
