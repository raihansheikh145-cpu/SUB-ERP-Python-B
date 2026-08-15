import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: 'new',
            defaultViewport: { width: 1280, height: 800 }
        });
        const page = await browser.newPage();
        
        console.log('Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        
        // Let's also do a quick login if we land on the login page!
        const html = await page.content();
        if (html.includes('Sign In to ERP')) {
            console.log('On login page. Attempting to log in as admin...');
            // Need to know what the login fields are
            // Usually there's an email and password input
            try {
                await page.type('input[type="text"]', 'admin');
                await page.type('input[type="password"]', '000000');
                await page.keyboard.press('Enter');
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                console.log('Logged in!');
            } catch (e) {
                console.error('Login attempt failed:', e.message);
            }
        }
        
        // Wait a bit for React to render Chart of Accounts
        await new Promise(r => setTimeout(r, 2000));
        
        const screenshotPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d0adfb28-93b1-4f9d-b045-a65cba668aee\\scratch\\ui_screenshot.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
        
        await browser.close();
    } catch (err) {
        // Fallback to Edge if Chrome is not found
        console.log('Chrome failed, trying Edge...', err.message);
        try {
            const browser = await puppeteer.launch({
                executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                headless: 'new',
                defaultViewport: { width: 1280, height: 800 }
            });
            const page = await browser.newPage();
            
            console.log('Navigating to http://localhost:5173...');
            await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
            
            const html = await page.content();
            if (html.includes('Sign In to ERP')) {
                console.log('On login page. Attempting to log in as admin...');
                try {
                    const inputs = await page.$$('input');
                    if (inputs.length >= 2) {
                        await inputs[0].type('admin');
                        await inputs[1].type('000000');
                        await page.keyboard.press('Enter');
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                        console.log('Logged in!');
                    }
                } catch (e) {
                    console.error('Login attempt failed:', e.message);
                }
            }
            
            await new Promise(r => setTimeout(r, 3000));
            
            const screenshotPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d0adfb28-93b1-4f9d-b045-a65cba668aee\\scratch\\ui_screenshot.png';
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
            
            await browser.close();
        } catch (e2) {
            console.error('Both Chrome and Edge failed.', e2);
        }
    }
})();
