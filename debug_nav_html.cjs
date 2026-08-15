const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Navigating...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('Waiting for splash screen and effects...');
    await page.waitForTimeout(8000);
    
    console.log('Forcing navigation to invoices...');
    await page.evaluate(() => {
       window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'INVOICES' } }));
    });
    
    await page.waitForTimeout(3000);
    
    const invoiceHtml = await page.evaluate(() => {
       // Find the element that contains the SmartFilterBar or table
       // Because it's inside <div class="flex-1 overflow-auto..."><div class="h-full">...
       const container = document.querySelector('main > div.flex-1.overflow-auto > div.h-full');
       return container ? container.innerHTML : 'No container found';
    });
    console.log('Invoice Container HTML:', invoiceHtml.substring(0, 2000));
    
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
