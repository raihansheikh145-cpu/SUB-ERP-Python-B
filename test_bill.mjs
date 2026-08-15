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

    console.log('Waiting for Bills tab event...');
    await delay(2000);
    
    console.log('Dispatching nav event to bills...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'BILLS' } }));
    });
    
    await delay(3000);
    
    console.log('Taking screenshot of Bills list...');
    await page.screenshot({ path: 'bills_list.png' });
    
    console.log('Clicking New button...');
    await page.evaluate(() => {
        const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'New');
        if (newBtn) {
            console.log('Found New button, clicking...');
            newBtn.click();
        } else {
            console.log('New button NOT FOUND!');
        }
    });
    
    await delay(3000);
    
    console.log('Taking screenshot of Bills form...');
    await page.screenshot({ path: 'bills_form.png' });
    
    await browser.close();
    console.log('Done.');
})();
