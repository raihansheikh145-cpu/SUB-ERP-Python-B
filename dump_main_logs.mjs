import puppeteer from 'puppeteer-core';

(async () => {
    const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[browser error]', err));
    
    await page.goto('http://localhost:3000/?test_bypass=1', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'BILLS' } }));
    });
    
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
})();
