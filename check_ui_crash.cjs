const puppeteer = require('puppeteer-core');

(async () => {
  try {
    // Find Edge or Chrome path
    const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    
    const browser = await puppeteer.launch({
      executablePath,
      headless: "new"
    });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    console.log("Navigating to http://localhost:5173/products...");
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait a bit for React to render and potentially crash
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer Script Error:", err);
  }
})();
