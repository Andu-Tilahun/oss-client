import { test, expect } from '@playwright/test';

// Regression tests for the mobile hamburger drawer on the public page.
// The drawer and its overlay are position:fixed and must be anchored to the viewport,
// not to the floating header pill (which happens if the pill carries transform/filter).
test.describe('Public header mobile navigation', () => {
  const viewport = { width: 375, height: 812 };
  test.use({ viewport, isMobile: true, hasTouch: true });

  test('hamburger opens a full-height drawer with every link reachable', async ({ page }) => {
    await page.goto('/public');

    const menu = page.locator('nav.menu');
    const overlay = page.locator('label.menu-overlay');
    await expect(menu).toBeHidden();

    await page.locator('label.hamburger').click();
    await expect(menu).toBeVisible();

    // Drawer settles flush with the top and right edges of the viewport (poll: slide-in transition).
    await expect
      .poll(async () => {
        const box = await menu.boundingBox();
        return box ? { top: Math.round(box.y), right: Math.round(box.x + box.width) } : null;
      })
      .toEqual({ top: 0, right: viewport.width });

    // Overlay covers the whole viewport, not just the header pill.
    await expect
      .poll(async () => {
        const box = await overlay.boundingBox();
        return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
      })
      .toEqual({ width: viewport.width, height: viewport.height });

    for (const name of ['Home', 'News', 'Gallery', 'About Us', 'Contact', 'Sign in']) {
      await expect(menu.getByRole('link', { name, exact: true })).toBeInViewport();
    }

    // No horizontal overflow while the drawer is open.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);
  });

  test('tapping a link closes the drawer and unlocks page scroll', async ({ page }) => {
    await page.goto('/public');
    await page.locator('label.hamburger').click();
    const menu = page.locator('nav.menu');
    await expect(menu).toBeVisible();

    await menu.getByRole('link', { name: 'Gallery', exact: true }).click();
    await expect(page).toHaveURL(/#gallery$/);
    await expect(menu).toBeHidden();
    await expect(page.locator('html')).toHaveCSS('overflow', 'visible');
  });

  test('tapping the overlay closes the drawer', async ({ page }) => {
    await page.goto('/public');
    await page.locator('label.hamburger').click();
    const menu = page.locator('nav.menu');
    await expect(menu).toBeVisible();

    await page.locator('label.menu-overlay').click({ position: { x: 20, y: 400 } });
    await expect(menu).toBeHidden();
  });
});
