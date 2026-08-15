const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('Page loaded successfully.');
    
    // Evaluate if root is empty
    const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'no root element');
    if (!rootHtml || rootHtml.trim() === '') {
      console.log('ROOT IS EMPTY (White Screen)');
    } else {
      console.log('ROOT HAS CONTENT');
    }
  } catch (err) {
    console.error('Error navigating:', err.message);
  } finally {
    await browser.close();
  }
})();
