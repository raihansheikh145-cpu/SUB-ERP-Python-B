import puppeteer from 'puppeteer-core';
const delay = ms => new Promise(res => setTimeout(res, ms));
(async () => {
    const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/?test_bypass=1', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'BILLS' } }));
    });
    await delay(3000);
    const html = await page.content();
    console.log(html);
    await browser.close();
})();
