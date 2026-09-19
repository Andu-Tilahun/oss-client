import { test, expect } from '@playwright/test';

// Regression tests for the login page on a small phone:
// - the whole card fits one screen (no page scroll) and the canvas is painted dark green
// - one submit sends exactly one login request and shows exactly one error toast
test.describe('Login page on a small phone', () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });

  test('fits on one screen without scrolling', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#username')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    await expect(page.locator('.submit-btn')).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('link', { name: 'Sign up for new account' })).toBeInViewport({ ratio: 1 });
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 65, 41)');
  });

  test('one submit sends one request and shows one error toast', async ({ page }) => {
    const loginRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/login')) {
        loginRequests.push(request.method());
      }
    });

    await page.goto('/login');
    await page.locator('#username').fill('nobody@example.com');
    await page.locator('#password').fill('wrong-password');
    await page.locator('.submit-btn').tap();

    const toastTitles = page.locator('.toast-title');
    await expect(toastTitles).toHaveCount(1);
    await expect(toastTitles.first()).toHaveText('Login Failed');
    expect(loginRequests).toEqual(['POST']);
  });
});
