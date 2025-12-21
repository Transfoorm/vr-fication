/**
 * E2E Test: Homepage / Authentication
 *
 * Basic smoke tests to verify the app loads and auth pages are accessible
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage and Auth', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Should either show dashboard (if logged in) or redirect to sign-in
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isValidPage = url.includes('/dashboard') || url.includes('/sign-in');

    expect(isValidPage).toBe(true);
  });

  test('should navigate to sign-in page', async ({ page }) => {
    await page.goto('/sign-in');

    // Should show sign-in form
    await expect(page).toHaveURL(/\/sign-in/);

    // Check for email input field
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/sign-up');

    // Should show sign-up form
    await expect(page).toHaveURL(/\/sign-up/);

    // Check for email input field
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();

    // Should have a meaningful title (not just "Page")
    expect(title.length).toBeGreaterThan(0);
  });
});
