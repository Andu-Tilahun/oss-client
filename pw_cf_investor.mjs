import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'], headless: false, slowMo: 200 });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e)));
page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0, 300)); });

async function screenshot(name) {
  const path = `/tmp/cfi_${name}_${Date.now()}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${name}: ${path}`);
  return path;
}

async function dumpTabs() {
  await page.waitForTimeout(500);
  const tabs = await page.locator('app-tabs button').allTextContents();
  const clean = tabs.map(t => t.trim()).filter(t => t.length > 0 && t.length < 50);
  console.log('  TABS:', JSON.stringify(clean));
  return clean;
}

// ── STEP 1: Login as investor ─────────────────────────────────────────────────
console.log('\n=== LOGIN as natiinvestor58 ===');
await page.goto('http://localhost:4200/login', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.fill('input[placeholder="Enter your username"]', 'natiinvestor58');
await page.fill('input[placeholder="Enter your password"]', 'admin123');
await page.click('button:has-text("Sign In")');
await page.waitForTimeout(3000);
console.log('URL after login:', page.url());
await screenshot('01_after_login');

// ── STEP 2: Go to crowdfunding page ─────────────────────────────────────────
console.log('\n=== STEP 2: Crowdfunding page ===');
await page.goto('http://localhost:4200/investment-package-types/crowdfunding', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
await screenshot('02_crowdfunding_page');

// Dump what's on screen
const rows = await page.locator('table tbody tr').allTextContents();
console.log('Rows visible:', rows);

const tabs = await dumpTabs();

// ── STEP 3: Look for the package row and click it ───────────────────────────
console.log('\n=== STEP 3: Select the CLOSED crowdfunding package ===');
const firstRow = page.locator('table tbody tr').first();
const rowCount = await page.locator('table tbody tr').count();
console.log('Row count:', rowCount);

if (rowCount > 0) {
  await firstRow.click();
  await page.waitForTimeout(3000);
  const tabs2 = await dumpTabs();
  await screenshot('03_package_selected');

  // ── STEP 4: Check for currency/pay icon in action column ─────────────────
  console.log('\n=== STEP 4: Check table row actions ===');
  const payButtons = await page.locator('[title="Pay"], button[title="Pay"], [title*="pay" i]').all();
  console.log('Pay buttons:', payButtons.length);

  // Also check for any currency-related buttons
  const actionButtons = await page.locator('table tbody tr button, table tbody tr app-action-icon-button').all();
  console.log('Action buttons in table:', actionButtons.length);
  for (const btn of actionButtons) {
    const title = await btn.getAttribute('title').catch(() => '');
    const text = await btn.textContent().catch(() => '');
    console.log('  Action btn:', { title, text: text?.trim() });
  }

  // ── STEP 5: Check for Payment tab ────────────────────────────────────────
  console.log('\n=== STEP 5: Check tabs on right panel ===');
  const paymentTab = tabs2.find(t => t.toLowerCase().includes('payment'));
  console.log('Payment tab present:', !!paymentTab);

  if (paymentTab) {
    await page.locator('app-tabs button').filter({ hasText: 'Payment' }).click();
    await page.waitForTimeout(1500);
    await screenshot('04_payment_tab');
    const content = await page.locator('app-investment-package-detail-panel').textContent();
    console.log('Payment tab content:', content?.slice(0, 600));
  } else {
    console.log('⚠️  No Payment tab found. Checking investor bid record via API...');
  }
}

// ── STEP 6: Check investor's own bid records via API ────────────────────────
console.log('\n=== STEP 6: Investor bid records from API ===');
const apiResult = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/investment-packages/investmentRecord/filter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ page: 0, size: 20, sortBy: 'createdDate', sortDirection: 'DESC' })
    });
    const data = await r.json();
    return { status: r.status, records: data?.content?.map(x => ({ id: x.id, status: x.status, investmentPackageId: x.investmentPackageId, amount: x.amount })) };
  } catch(e) { return { error: String(e) }; }
});
console.log('Investor records:', JSON.stringify(apiResult, null, 2));

// ── STEP 7: Check the specific package's filter (crowdfunding) ───────────────
console.log('\n=== STEP 7: Crowdfunding packages from API ===');
const cfPackages = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/investment-packages/filter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        investmentPackageType: 'CROWDFUNDING',
        sortBy: 'fundingDeadline',
        sortDirection: 'DESC',
        page: 0,
        size: 10
      })
    });
    const data = await r.json();
    return { status: r.status, packages: data?.content?.map(x => ({ id: x.id, title: x.title, fundingStatus: x.fundingStatus, investorIdList: x.investorIdList, paymentStatus: x.paymentStatus })) };
  } catch(e) { return { error: String(e) }; }
});
console.log('Crowdfunding packages:', JSON.stringify(cfPackages, null, 2));

// ── STEP 8: Now check the investment-package-type-list filter endpoint ────────
console.log('\n=== STEP 8: Investment package TYPES (what the UI uses) ===');
const pkgTypes = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/investment-packages/filter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        investmentPackageType: 'CROWDFUNDING',
        sortBy: 'fundingDeadline',
        sortDirection: 'DESC',
        page: 0,
        size: 100
      })
    });
    const text = await r.text();
    return { status: r.status, body: text.slice(0, 1000) };
  } catch(e) { return { error: String(e) }; }
});
console.log('Package types response:', JSON.stringify(pkgTypes, null, 2));

// Also try the investment-package-types endpoint
const pkgTypesAlt = await page.evaluate(async () => {
  try {
    const endpoints = [
      '/api/investment-package-types/filter',
      '/api/investment-package/types/filter',
    ];
    const results = {};
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ investmentPackageType: 'CROWDFUNDING', page: 0, size: 10 })
        });
        results[ep] = { status: r.status, body: (await r.text()).slice(0, 500) };
      } catch(e) { results[ep] = { error: String(e) }; }
    }
    return results;
  } catch(e) { return { error: String(e) }; }
});
console.log('Alt endpoints:', JSON.stringify(pkgTypesAlt, null, 2));

console.log('\n=== PAGE ERRORS ===', errors.length);
errors.forEach(e => console.log(e));

await browser.close();
console.log('\nDone.');
