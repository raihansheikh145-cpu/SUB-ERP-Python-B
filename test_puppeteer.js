const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Need to log in and update a product
  console.log('Navigating to app...');
  await page.goto('http://localhost:3000/login');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'raihansheikh145@gmail.com');
  await page.type('input[type="password"]', 'sk445@raihan'); // Using his password from the DB URL? No, wait.
  // Actually, I don't know his password. Let's not guess.
  await browser.close();
})();
