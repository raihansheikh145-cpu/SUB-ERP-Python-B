const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Login
    await page.type('input[type="text"], input[type="email"]', 'raihansheikh145@hotmail.com');
    await page.type('input[type="password"]', '87654321');
    
    // Click login button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('SIGN IN') || text.includes('Sign In')) {
            await btn.click();
            break;
        }
    }
    
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    
    // Navigate directly to Chart of Accounts URL since it's more reliable than clicking
    await page.goto('http://localhost:5173/accounting/chart-of-accounts', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d0adfb28-93b1-4f9d-b045-a65cba668aee\\scratch\\ui_screenshot_chart_of_accounts.png', fullPage: true });
    await browser.close();
})();
