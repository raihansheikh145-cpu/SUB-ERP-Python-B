import puppeteer from 'puppeteer-core';

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log('Launching browser...');
    const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[browser error]', err));

    console.log('Navigating to app on 3000...');
    await page.goto('http://localhost:3000/?test_bypass=1', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    
    console.log('Dispatching nav event to PAYMENTS...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'PAYMENTS' } }));
    });
    
    await delay(2000);
    console.log('Taking screenshot of Payments tab...');
    await page.screenshot({ path: 'payments_list.png' });
    
    console.log('Clicking New button on Payments...');
    await page.evaluate(() => {
        const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'New');
        if (newBtn) newBtn.click();
    });
    
    await delay(2000);
    await page.screenshot({ path: 'payments_form.png' });

    console.log('Dispatching nav event to JOURNALS...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'JOURNAL' } }));
    });
    
    await delay(2000);
    console.log('Taking screenshot of Journals tab...');
    await page.screenshot({ path: 'journals_list.png' });
    
    console.log('Clicking New button on Journals...');
    await page.evaluate(() => {
        const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'New');
        if (newBtn) newBtn.click();
    });
    
    await delay(2000);
    await page.screenshot({ path: 'journals_form.png' });

    await browser.close();
    console.log('Done.');
})();
