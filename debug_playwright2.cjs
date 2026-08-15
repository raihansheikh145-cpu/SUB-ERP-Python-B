const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Navigating...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('Clicking Invoices...');
    // The sidebar item usually has text like "Invoices" or we can just find it
    await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button, a, div'));
       const invoiceBtn = buttons.find(b => b.textContent && b.textContent.includes('Invoices'));
       if (invoiceBtn) invoiceBtn.click();
       else console.log('Could not find invoice button');
    });
    
    // wait a bit for it to crash
    await page.waitForTimeout(2000);
    console.log('Finished waiting');
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
