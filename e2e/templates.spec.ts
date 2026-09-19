import { test, expect, Page } from '@playwright/test';

// Helper: log in as admin and persist session
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[formControlName="username"], input[name="username"], input[type="text"]', 'admin');
  await page.fill('input[formControlName="password"], input[name="password"], input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  // Wait until we land on an authenticated page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe('Templates section', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // --- Navigation ---

  test('navigates to Email Templates page', async ({ page }) => {
    await page.goto('/templates/email');
    await expect(page.getByRole('heading', { name: 'Email Templates' })).toBeVisible();
  });

  test('navigates to SMS Templates page', async ({ page }) => {
    await page.goto('/templates/sms');
    await expect(page.getByRole('heading', { name: 'SMS Templates' })).toBeVisible();
  });

  test('navigates to Contract Templates page', async ({ page }) => {
    await page.goto('/templates/contract');
    await expect(page.getByRole('heading', { name: 'Contract Templates' })).toBeVisible();
  });

  test('/templates redirects to /templates/email', async ({ page }) => {
    await page.goto('/templates');
    await expect(page).toHaveURL(/\/templates\/email/);
    await expect(page.getByRole('heading', { name: 'Email Templates' })).toBeVisible();
  });

  // --- "New Template" modal ---

  test('opens New Template modal on Email page', async ({ page }) => {
    await page.goto('/templates/email');
    await page.getByRole('button', { name: 'New Template' }).click();
    await expect(page.getByRole('heading', { name: 'New Email Template' })).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/templates/email');
    await page.getByRole('button', { name: 'New Template' }).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('closes modal on Cancel', async ({ page }) => {
    await page.goto('/templates/email');
    await page.getByRole('button', { name: 'New Template' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'New Email Template' })).not.toBeVisible();
  });

  // --- SMS modal ---

  test('opens New Template modal on SMS page', async ({ page }) => {
    await page.goto('/templates/sms');
    await page.getByRole('button', { name: 'New Template' }).click();
    await expect(page.getByRole('heading', { name: 'New SMS Template' })).toBeVisible();
  });

  // --- Contract modal ---

  test('opens New Template modal on Contract page', async ({ page }) => {
    await page.goto('/templates/contract');
    await page.getByRole('button', { name: 'New Template' }).click();
    await expect(page.getByRole('heading', { name: 'New Contract Template' })).toBeVisible();
  });

  // --- Sidebar navigation ---

  test('Templates section visible in sidebar for admin', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByText('Templates')).toBeVisible();
  });

  test('sidebar Templates children visible after expanding', async ({ page }) => {
    await page.goto('/templates/email');
    // Sidebar should show active Templates section with children
    await expect(page.getByRole('link', { name: 'Email' }).or(page.getByText('Email')).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'SMS' }).or(page.getByText('SMS')).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contract' }).or(page.getByText('Contract')).first()).toBeVisible();
  });
});
