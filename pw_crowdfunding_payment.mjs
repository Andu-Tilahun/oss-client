import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'], headless: false, slowMo: 300 });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e)));
page.on('console', msg => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0, 300)); });

// ── helpers ──────────────────────────────────────────────────────────────────
async function login(username, password) {
  await page.goto('http://localhost:4200/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.fill('input[placeholder="Enter your username"]', username);
  await page.fill('input[placeholder="Enter your password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2500);
}

async function screenshot(name) {
  const ts = Date.now();
  const path = `/tmp/cf_${name}_${ts}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${name}: ${path}`);
  return path;
}

async function dumpTabs() {
  const buttons = await page.locator('app-tabs button, [role="tab"]').allTextContents();
  const tabs = buttons.map(t => t.trim()).filter(t => t.length > 0 && t.length < 40);
  console.log('  TABS:', JSON.stringify(tabs));
  return tabs;
}

// ── STEP 1: Admin — check what crowdfunding packages exist ────────────────────
console.log('\n=== STEP 1: Admin login + crowdfunding page ===');
await login('admin', 'admin123');
await page.goto('http://localhost:4200/investment-package-types/crowdfunding', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await screenshot('01_admin_crowdfunding_list');

// Grab all package rows visible
const adminRows = await page.locator('table tbody tr, [role="row"]').allTextContents();
console.log('Admin crowdfunding rows:', adminRows.slice(0, 5));

// Check if any package shows CLOSED status (winners chosen)
const closedPackages = adminRows.filter(r => r.includes('CLOSED'));
console.log('CLOSED packages:', closedPackages.length);

// Click on first row to see the detail
const firstRow = page.locator('table tbody tr').first();
if (await firstRow.count() > 0) {
  await firstRow.click();
  await page.waitForTimeout(1500);
  await dumpTabs();
  await screenshot('02_admin_first_package_detail');

  // Click investor tab to see investors
  const investorTab = page.locator('button:has-text("Investor"), [role="tab"]:has-text("Investor")').first();
  if (await investorTab.count() > 0) {
    await investorTab.click();
    await page.waitForTimeout(1500);
    await screenshot('03_admin_investor_tab');
    const investorContent = await page.locator('app-investment-package-detail-panel, .space-y-4').first().textContent();
    console.log('Investor tab content snippet:', investorContent?.slice(0, 500));
  }
}

// ── STEP 2: Find investor credentials from API or check users page ────────────
console.log('\n=== STEP 2: Check for investor users ===');
await page.goto('http://localhost:4200/users', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const userRows = await page.locator('table tbody tr').allTextContents();
const investors = userRows.filter(r => r.toLowerCase().includes('investor'));
console.log('Investor users found:', investors.slice(0, 3));
await screenshot('04_users_list');

// ── STEP 3: Try logging in as investor1 ──────────────────────────────────────
console.log('\n=== STEP 3: Try investor login ===');
await page.goto('http://localhost:4200/login');
await page.waitForTimeout(500);

// Try common investor credentials
const investorCreds = [
  ['investor1', 'investor123'],
  ['investor1', 'password'],
  ['investor', 'investor123'],
  ['investor', 'password'],
  ['test_investor', 'password123'],
];

let loggedInAsInvestor = false;
let investorUsername = '';

for (const [u, p] of investorCreds) {
  await page.fill('input[placeholder="Enter your username"]', u);
  await page.fill('input[placeholder="Enter your password"]', p);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1500);
  const url = page.url();
  if (!url.includes('/login')) {
    loggedInAsInvestor = true;
    investorUsername = u;
    console.log(`✅ Logged in as investor: ${u}`);
    break;
  }
  console.log(`❌ Failed: ${u} / ${p}`);
  await page.goto('http://localhost:4200/login');
  await page.waitForTimeout(500);
}

if (!loggedInAsInvestor) {
  console.log('⚠️  Could not log in as investor — trying to find credentials in app');
  await screenshot('05_investor_login_failed');
  // Try to read from backend API
  await login('admin', 'admin123');
  const resp = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/users?role=INVESTOR&size=5', { credentials: 'include' });
      return await r.text();
    } catch (e) { return String(e); }
  });
  console.log('API users response:', resp.slice(0, 500));
}

// ── STEP 4: Investor on crowdfunding page ─────────────────────────────────────
if (loggedInAsInvestor) {
  console.log('\n=== STEP 4: Investor on crowdfunding page ===');
  await page.goto('http://localhost:4200/investment-package-types/crowdfunding', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await screenshot('06_investor_crowdfunding');

  const investorPageRows = await page.locator('table tbody tr').allTextContents();
  console.log('Investor sees rows:', investorPageRows.slice(0, 5));

  // Click first row
  const iRow = page.locator('table tbody tr').first();
  if (await iRow.count() > 0) {
    await iRow.click();
    await page.waitForTimeout(2000);
    const tabs = await dumpTabs();
    await screenshot('07_investor_first_package');

    // Check for currency/pay icon in action column
    const payIcon = page.locator('[title="Pay"], button[title="Pay"]');
    console.log('Pay icon count:', await payIcon.count());

    // Check for payment tab
    const paymentTab = tabs.find(t => t.toLowerCase().includes('payment'));
    console.log('Payment tab present:', !!paymentTab);

    if (paymentTab) {
      await page.locator('button:has-text("Payment"), [role="tab"]:has-text("Payment")').first().click();
      await page.waitForTimeout(1500);
      await screenshot('08_payment_tab_content');
      const content = await page.locator('app-investment-package-detail-panel').textContent();
      console.log('Payment tab content:', content?.slice(0, 500));
    } else {
      // Debug: what is the investorBidRecord status?
      console.log('No payment tab — checking investor bid status');

      // Click investor tab to see investor's status
      const invTab = page.locator('button:has-text("Investor")').first();
      if (await invTab.count() > 0) {
        await invTab.click();
        await page.waitForTimeout(1500);
        await screenshot('09_investor_tab_debug');
        const invContent = await page.locator('app-investment-package-detail-panel').textContent();
        console.log('Investor tab:', invContent?.slice(0, 600));
      }
    }

    // Try clicking currency icon in each row
    const currencyIcons = page.locator('[title="Pay"]');
    const count = await currencyIcons.count();
    console.log('Currency pay icons in table:', count);
    if (count > 0) {
      await currencyIcons.first().click();
      await page.waitForTimeout(1500);
      await screenshot('10_after_pay_icon_click');
      await dumpTabs();
    }
  } else {
    console.log('No rows visible for investor');
    await screenshot('06b_investor_no_rows');
  }
}

// ── STEP 5: Check actual API response for investor's investment records ────────
console.log('\n=== STEP 5: Check API data ===');
if (loggedInAsInvestor) {
  const apiCheck = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/investment-packages/investmentRecord/filter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ page: 0, size: 20, sortBy: 'createdDate', sortDirection: 'DESC' })
      });
      const data = await r.json();
      return JSON.stringify(data?.content?.map(x => ({ id: x.id, status: x.status, investmentPackageId: x.investmentPackageId })));
    } catch (e) { return String(e); }
  });
  console.log('Investor investment records:', apiCheck);
}

console.log('\n=== ERRORS ===');
console.log('Error count:', errors.length);
errors.forEach(e => console.log(e));

await browser.close();
