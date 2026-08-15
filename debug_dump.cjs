const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Navigating...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    console.log('Waiting for splash screen...');
    await page.waitForTimeout(4000);
    
    // Check if login is present
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
       console.log('Logging in...');
       await page.fill('input[type="email"]', 'raihansheikh145@gmail.com');
       await page.fill('input[type="password"]', 'raihansheikh145@gmail.com'); // guess based on generic passwords, wait
       await page.click('button[type="submit"]');
       await page.waitForTimeout(6000);
    }
    
    console.log('Forcing navigation to invoices...');
    await page.evaluate(() => {
       window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'INVOICES' } }));
    });
    
    await page.waitForTimeout(3000);
    
    const invoiceHtml = await page.evaluate(() => {
       const container = document.querySelector('main > div.flex-1.overflow-y-auto');
       if (container) return container.innerHTML;
       const fallback = document.querySelector('main');
       return fallback ? fallback.innerHTML : 'No container found';
    });
    
    require('fs').writeFileSync('invoice_container.html', invoiceHtml);
    console.log('Invoice Container HTML saved to invoice_container.html (Length:', invoiceHtml.length, ')');
    
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
