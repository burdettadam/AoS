import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Extend basic test with authentication fixture
export const test = base.extend<{
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  // Create authenticated context that can be reused
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      // Disable security for testing
      ignoreHTTPSErrors: true,
    });
    
    await use(context);
    await context.close();
  },

  // Create authenticated page
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    
    // Mock authentication if needed
    await page.addInitScript(() => {
      // Mock localStorage with auth token
      localStorage.setItem('auth-token', 'mock-token');
    });
    
    await use(page);
  },
});

export { expect };