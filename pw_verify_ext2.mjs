import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0,200)); });

await page.goto('http://localhost:4200/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1000);
await page.fill('input[placeholder="Enter your username"]', 'admin');
await page.fill('input[placeholder="Enter your password"]', 'admin123');
await page.click('button:has-text("Sign In")');
await page.waitForTimeout(2000);

await page.goto('http://localhost:4200/investment-package-types/bidding', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);

async function tabsNow(label) {
  const tabTexts = await page.locator('button').allTextContents();
  const tabs = tabTexts.filter(t => t.trim().length > 0 && t.trim().length < 25);
  console.log(`${label}:`, JSON.stringify(tabs));
  return tabs.some(t => t.includes('Extension Worker'));
}

let ok = await tabsNow('First load');
for (let i = 1; i <= 3; i++) {
  await page.click('button:has-text("Detail")');
  await page.waitForTimeout(300);
  await page.click('text=Oromia Bidding');
  await page.waitForTimeout(1200);
  ok = await tabsNow(`After reselect #${i}`);
}
console.log('EXTENSION WORKER STILL PRESENT:', ok);
console.log('ERROR COUNT:', errors.length);
console.log('ERRORS:', JSON.stringify(errors.slice(0,3)));
await browser.close();
