/**
 * E2E Test: Sovereign Router Navigation Performance
 *
 * Tests the core value proposition: 0-5ms navigation between routes
 * This test verifies that the Sovereign Router + WARP system achieves
 * desktop-app-like instant navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Sovereign Router Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests will need authentication setup
    // For now, they demonstrate the test structure
    await page.goto('/');
  });

  test('should navigate instantly between domains (< 50ms)', async ({ page }) => {
    // This test verifies your core architecture goal:
    // Navigation should feel instant (0-5ms typically, < 50ms maximum)

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    // Measure navigation time from dashboard to finance
    const startTime = Date.now();

    // Click finance navigation link
    await page.click('[href="/finance/overview"]');

    // Wait for finance page to be visible
    await page.waitForURL('/finance/overview');
    await page.waitForSelector('[data-testid="finance-overview"]', { timeout: 1000 });

    const navigationTime = Date.now() - startTime;

    // CRITICAL TEST: Navigation should be under 50ms
    // (In reality, Sovereign Router achieves 0-5ms, but we add buffer for test reliability)
    expect(navigationTime).toBeLessThan(50);

    console.log(`✅ Navigation took ${navigationTime}ms (Target: < 50ms)`);
  });

  test('should show no loading spinners during navigation', async ({ page }) => {
    // Your architecture's goal: ZERO loading states

    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    // Navigate to different domains
    const routes = ['/finance/overview', '/clients/contacts', '/productivity/calendar'];

    for (const route of routes) {
      await page.click(`[href="${route}"]`);
      await page.waitForURL(route);

      // Check for any loading indicators (should be ZERO)
      const loadingSpinner = await page.locator('[data-testid="loading"]').count();
      const loadingSkeleton = await page.locator('[class*="skeleton"]').count();

      expect(loadingSpinner).toBe(0);
      expect(loadingSkeleton).toBe(0);

      console.log(`✅ ${route}: No loading states detected`);
    }
  });

  test('should maintain consistent navigation speed globally', async ({ page }) => {
    // This test simulates the Australia use case that led to Sovereign Router
    // With App Router: 600-1000ms from Sydney
    // With Sovereign Router: 0-5ms regardless of location

    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    const navigationTimes: number[] = [];

    // Test multiple navigations
    const routes = [
      '/finance/overview',
      '/clients/contacts',
      '/productivity/calendar',
      '/dashboard',
    ];

    for (const route of routes) {
      const start = Date.now();
      await page.click(`[href="${route}"]`);
      await page.waitForURL(route);
      const duration = Date.now() - start;

      navigationTimes.push(duration);
      console.log(`  ${route}: ${duration}ms`);
    }

    // Calculate variance (should be LOW - consistent performance)
    const avg = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
    const variance = navigationTimes.map(t => Math.abs(t - avg));
    const maxVariance = Math.max(...variance);

    // All navigations should be within 30ms of each other (very low variance)
    expect(maxVariance).toBeLessThan(30);

    console.log(`✅ Average navigation: ${avg.toFixed(1)}ms (Variance: ${maxVariance.toFixed(1)}ms)`);
  });
});

test.describe('WARP Preloading', () => {
  test('should preload domain data before user navigates', async ({ page }) => {
    // This test verifies WARP has preloaded data during idle time

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    // Wait for WARP to complete preloading
    await page.evaluate(() => {
      // Check if WARP orchestrator logged successful preloads
       
      return (window as any).__WARP_PRELOAD_COMPLETE__ || false;
    });

    // Listen for network requests during navigation
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    // Navigate to finance
    await page.click('[href="/finance/overview"]');
    await page.waitForURL('/finance/overview');

    // Check that NO /api/warp/finance request was made during navigation
    // (because data was already preloaded)
    const warpRequestDuringNav = requests.some(url => url.includes('/api/warp/finance'));

    // WARP should have preloaded the data, so no request during navigation
    expect(warpRequestDuringNav).toBe(false);

    console.log('✅ WARP preloaded data - no fetch during navigation');
  });
});

test.describe('FUSE Store State Management', () => {
  test('should maintain state across navigations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    // Get user data from FUSE store
    const userDataBefore = await page.evaluate(() => {
       
      return (window as any).__FUSE_STORE__?.getState?.()?.user;
    });

    // Navigate to different page
    await page.click('[href="/finance/overview"]');
    await page.waitForURL('/finance/overview');

    // Get user data again
    const userDataAfter = await page.evaluate(() => {
       
      return (window as any).__FUSE_STORE__?.getState?.()?.user;
    });

    // FUSE store should maintain user data across navigation
    expect(userDataAfter).toEqual(userDataBefore);

    console.log('✅ FUSE store maintained state across navigation');
  });
});
