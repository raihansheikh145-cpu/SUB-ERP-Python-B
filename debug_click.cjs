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
    
    console.log('Clicking invoices button...');
    await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const invoiceBtn = buttons.find(b => b.textContent.includes('Invoices') || b.innerText.includes('Invoices'));
       if (invoiceBtn) {
         invoiceBtn.click();
       } else {
         console.log('Could not find Invoices button by text');
       }
    });
    
    await page.waitForTimeout(3000);
    
    const mainHtml = await page.evaluate(() => {
       const main = document.querySelector('main');
       return main ? main.innerHTML : 'No main element found';
    });
    console.log('Main HTML snippet:', mainHtml.substring(0, 1000));
    
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
