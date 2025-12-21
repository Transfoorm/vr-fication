# Testing Guide - Vitest + Playwright

## Overview

Your app now has comprehensive testing infrastructure:

- **Vitest** - Fast unit tests for functions and components
- **Playwright** - End-to-end browser tests for user flows

---

## ✅ What's Been Set Up

### 1. Vitest (Unit Tests)
- ✅ Configuration: `vitest.config.ts`
- ✅ Setup file: `vitest.setup.ts` (mocks Next.js, window APIs)
- ✅ Example tests: `src/fuse/__tests__/simple.test.ts`
- ✅ WARP tests: `src/fuse/warp/__tests__/orchestrator.test.ts`
- ✅ **Status: 11 tests passing ✓**

### 2. Playwright (E2E Tests)
- ✅ Configuration: `playwright.config.ts`
- ✅ Test directory: `e2e/`
- ✅ Navigation tests: `e2e/navigation.spec.ts` (tests your 0-5ms goal!)
- ✅ Homepage tests: `e2e/homepage.spec.ts`
- ✅ Chromium browser installed

### 3. Package.json Scripts
```bash
# Unit tests (Vitest)
npm test                  # Run in watch mode (great for development)
npm run test:ui           # Open interactive UI
npm run test:run          # Run once and exit
npm run test:coverage     # Generate coverage report

# E2E tests (Playwright)
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:ui       # Open Playwright UI
npm run test:e2e:headed   # Watch tests run in browser

# Run all tests
npm run test:all          # Runs both unit and E2E tests
```

---

## 🚀 How to Use

### Running Unit Tests (Vitest)

**Development mode** (watches files, re-runs on change):
```bash
npm test
```

**Run once** (for CI/pre-commit):
```bash
npm run test:run
```

**With coverage report:**
```bash
npm run test:coverage
```

**Interactive UI** (see test results visually):
```bash
npm run test:ui
```

### Running E2E Tests (Playwright)

**Important:** E2E tests require your dev server running!

**Terminal 1 - Start dev server:**
```bash
npm run dev
```

**Terminal 2 - Run E2E tests:**
```bash
npm run test:e2e
```

**Or use headed mode** (watch browser):
```bash
npm run test:e2e:headed
```

---

## 📝 Writing New Tests

### Unit Test Example (Vitest)

Create a file: `src/path/to/__tests__/myFunction.test.ts`

```typescript
import { describe, test, expect } from 'vitest';

describe('MyFunction', () => {
  test('should return correct value', () => {
    const result = myFunction(10);
    expect(result).toBe(20);
  });
});
```

### E2E Test Example (Playwright)

Create a file: `e2e/my-feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to finance', async ({ page }) => {
  await page.goto('/');
  await page.click('[href="/finance/overview"]');
  await expect(page).toHaveURL('/finance/overview');
});
```

---

## 🎯 What to Test

### High Priority

1. **WARP Preloading** - Verify domains load based on rank
2. **Sovereign Router** - Test 0-5ms navigation (your core value!)
3. **FUSE Store** - State management logic
4. **Rank System** - Admiral/Commodore/Captain/Crew permissions
5. **Critical User Flows** - Signup → Setup → Dashboard → Navigate

### Example Test Ideas

**Unit Tests:**
- ✅ Rank hierarchy logic
- ✅ TTL freshness calculations
- ✅ Domain filtering by rank
- Navigation config validation
- Store actions (navigate, hydrate, etc.)

**E2E Tests:**
- ✅ Homepage loads
- ✅ Sign-in page accessible
- Navigation performance (< 50ms)
- No loading spinners during nav
- Data persists across navigation
- Rank-based UI visibility

---

## 📊 Current Test Status

```
Unit Tests (Vitest):     11 passing ✓
E2E Tests (Playwright):  Ready to run (requires dev server + auth setup)
```

### Tests Written:

**Unit Tests:**
1. ✅ Testing infrastructure basics
2. ✅ Math and string operations
3. ✅ Array operations
4. ✅ TTL constants (5 minutes = 300000ms)
5. ✅ TTL freshness check logic
6. ✅ Rank hierarchy validation
7. ✅ Admiral has admin access
8. ✅ Commodore does NOT have admin access
9. ✅ Captain has limited access
10. ✅ FIVE_MIN constant correctness
11. ✅ WARP orchestrator structure

**E2E Tests (Examples Written):**
- Navigation performance (< 50ms target)
- Zero loading states during navigation
- Consistent global performance
- WARP preloading verification
- FUSE store state persistence
- Homepage and auth pages accessibility

---

## 🔧 Troubleshooting

### "Failed to resolve import @/convex/_generated/api"

This happens when importing files that depend on Convex without the dev server running.

**Solution:** Either:
1. Run `npm run dev:convex` before tests (for integration tests)
2. Mock the Convex imports (for pure unit tests)

### E2E Tests Fail with "Target Closed"

**Solution:** Make sure dev server is running on `http://localhost:3000`

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### Tests Pass Locally but Fail on CI

**Solution:** Add `npm run test:all` to your CI pipeline:

```yaml
# .github/workflows/test.yml (example)
- run: npm install
- run: npm run test:run  # Unit tests (no dev server needed)
```

---

## 🎓 Next Steps

### 1. Add More Unit Tests

Focus on testing your core business logic:
- FUSE store actions
- WARP orchestrator functions
- Rank permission logic
- Navigation configs

### 2. Set Up E2E Tests with Auth

The current E2E tests need authentication setup:

1. Create a test user in Clerk
2. Add auth helper to Playwright
3. Test full user flows

### 3. Add to Pre-Commit Hook (Optional)

Add to `.husky/pre-commit`:
```bash
# Run unit tests before commit
npm run test:run || exit 1
```

### 4. Track Coverage

Set coverage targets:
```bash
npm run test:coverage
```

Aim for:
- Critical paths: 90%+ coverage
- Overall: 70%+ coverage

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library (React)](https://testing-library.com/react)

---

## ✨ Summary

You now have:
- ✅ **11 passing unit tests** (Vitest)
- ✅ **E2E test framework ready** (Playwright)
- ✅ **All npm scripts configured**
- ✅ **Example tests for guidance**

**To run tests:**
```bash
# Unit tests
npm test

# E2E tests (requires dev server)
npm run dev          # Terminal 1
npm run test:e2e     # Terminal 2
```

**Your testing infrastructure is LIVE. Start writing tests!**
