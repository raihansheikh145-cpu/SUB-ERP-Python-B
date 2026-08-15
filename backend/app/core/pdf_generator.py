from playwright.async_api import async_playwright, Browser
from jinja2 import Environment, FileSystemLoader
import os
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Setup Jinja2 Environment
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# Global browser instance
_playwright = None
_browser: Browser = None

async def get_browser() -> Browser:
    global _playwright, _browser
    if _browser is None:
        _playwright = await async_playwright().start()
        # Launch headless chromium with args optimized for performance in server env
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )
    return _browser

async def close_browser():
    global _playwright, _browser
    if _browser:
        await _browser.close()
    if _playwright:
        await _playwright.stop()

async def generate_pdf(template_name: str, context: Dict[str, Any]) -> bytes:
    """
    Renders an HTML template using Jinja2 and converts it to a PDF using Playwright.
    """
    # 1. Render HTML
    template = jinja_env.get_template(template_name)
    html_content = template.render(context)
    
    # 2. Get Browser and Generate PDF
    browser = await get_browser()
    page = await browser.new_page()
    
    try:
        # Load HTML directly into the page
        await page.set_content(html_content, wait_until="networkidle")
        
        # Generate PDF with standard A4 settings
        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        return pdf_bytes
    finally:
        await page.close()
