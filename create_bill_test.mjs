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
    
    console.log('Dispatching nav event to bills...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('accounting-nav', { detail: { screen: 'BILLS' } }));
    });
    
    await delay(3000);
    
    console.log('Clicking New button...');
    await page.evaluate(() => {
        const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'New');
        if (newBtn) newBtn.click();
    });
    
    await delay(2000);
    console.log('Taking screenshot of Bills form...');
    await page.screenshot({ path: 'bills_form_before_fill.png' });
    
    console.log('Filling form...');
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        
        // Find reference input
        const refInput = inputs.find(i => i.placeholder === 'Reference / Invoice No.');
        if (refInput) {
            refInput.value = 'TEST-BILL-123';
            refInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Find Add Line button
        const addLineBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Add Line'));
        if (addLineBtn) addLineBtn.click();
    });
    
    await delay(1000);
    
    await page.evaluate(() => {
        // Try to set vendor if select exists
        const selects = Array.from(document.querySelectorAll('select'));
        if (selects.length > 0) {
            const vendorSelect = selects[0];
            if (vendorSelect.options.length > 1) {
                vendorSelect.selectedIndex = 1;
                vendorSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Save as Draft
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Save as Draft');
        if (saveBtn) saveBtn.click();
    });
    
    await delay(3000);
    
    console.log('Taking screenshot after save...');
    await page.screenshot({ path: 'bills_after_save.png' });
    
    await browser.close();
    console.log('Done.');
})();
