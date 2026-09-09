import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'], headless: false, slowMo: 150 });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

// Capture all API calls
const apiCalls = [];
page.on('request', req => {
  if (req.url().includes('/api/')) {
    apiCalls.push({ method: req.method(), url: req.url() });
  }
});
page.on('response', async resp => {
  if (resp.url().includes('investmentRecord') || resp.url().includes('leaderboard')) {
    const body = await resp.text().catch(() => '');
    console.log(`\n📡 ${resp.status()} ${resp.url()}`);
    console.log('  Body:', body.slice(0, 600));
  }
});

async function screenshot(name) {
  const path = `/tmp/cfd_${name}_${Date.now()}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
  return path;
}

async function dumpTabs() {
  await page.waitForTimeout(400);
  const tabs = await page.locator('app-tabs button').allTextContents();
  const clean = tabs.map(t => t.trim()).filter(t => t.length > 0 && t.length < 50);
  console.log('TABS:', JSON.stringify(clean));
  return clean;
}

// Login as investor
console.log('\n=== LOGIN ===');
await page.goto('http://localhost:4200/login', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.fill('input[placeholder="Enter your username"]', 'natiinvestor58');
await page.fill('input[placeholder="Enter your password"]', 'admin123');
await page.click('button:has-text("Sign In")');
await page.waitForTimeout(2000);

// Navigate to crowdfunding
console.log('\n=== CROWDFUNDING PAGE ===');
apiCalls.length = 0;
await page.goto('http://localhost:4200/investment-package-types/crowdfunding', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

console.log('\nAPI calls made:');
apiCalls.forEach(c => console.log(' ', c.method, c.url));

await dumpTabs();
await screenshot('01_investor_crowdfunding');

// Click the row
console.log('\n=== CLICK ROW ===');
apiCalls.length = 0;
const row = page.locator('table tbody tr').first();
await row.click();
await page.waitForTimeout(3500);

console.log('\nAPI calls after row click:');
apiCalls.forEach(c => console.log(' ', c.method, c.url));

const tabs = await dumpTabs();
await screenshot('02_row_selected');

// Check action column
const actionCols = await page.locator('table tbody tr td:last-child').all();
console.log('\nLast column cells:', actionCols.length);
for (const td of actionCols) {
  const html = await td.innerHTML();
  console.log('  Last td HTML:', html.slice(0, 300));
}

// Check if table has [showActionColumn]
const tableHtml = await page.locator('app-data-table').innerHTML().catch(() => 'not found');
console.log('\nData table action column visible:', tableHtml.includes('action') ? 'maybe' : 'no action class');

// Now directly call the API to get the investor's record for this package
console.log('\n=== DIRECT API CALL ===');
const investorRecords = await page.evaluate(async () => {
  // Get the package ID from the page state via Angular
  const records = await fetch('/api/farm/investment-packages/investmentRecord/filter', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ page: 0, size: 20, sortBy: 'createdDate', sortDirection: 'DESC' })
  });
  const data = await records.json();
  return { status: records.status, content: data?.content?.map(r => ({
    id: r.id,
    status: r.status,
    paymentStatus: r.paymentStatus,
    investmentPackageId: r.investmentPackageId,
    amount: r.amount,
    investorId: r.investorId
  })) };
});
console.log('Investor investment records:', JSON.stringify(investorRecords, null, 2));

// Also get the crowdfunding package details
const cfFilter = await page.evaluate(async () => {
  const r = await fetch('/api/farm/investment-packages/filter', {
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
  return { status: r.status, packages: data?.content?.map(p => ({
    id: p.id,
    title: p.title,
    fundingStatus: p.fundingStatus,
    investorIdList: p.investorIdList,
    paymentStatus: p.paymentStatus,
    status: p.status
  })) };
});
console.log('CF packages:', JSON.stringify(cfFilter, null, 2));

// Now click the investor tab and wait for API calls
console.log('\n=== CLICK INVESTOR TAB ===');
apiCalls.length = 0;
const investorTabBtn = page.locator('app-tabs button').filter({ hasText: /^Investor$/ });
const invCount = await investorTabBtn.count();
console.log('Investor tab button count:', invCount);
if (invCount > 0) {
  await investorTabBtn.first().click();
  await page.waitForTimeout(3000);
  console.log('\nAPI calls after Investor tab:');
  apiCalls.forEach(c => console.log(' ', c.method, c.url));
  await screenshot('03_investor_tab');
  const content = await page.locator('app-investment-package-detail-panel').textContent().catch(() => '');
  console.log('Investor tab content:', content?.slice(0, 400));
}

await browser.close();
console.log('\nDone.');
