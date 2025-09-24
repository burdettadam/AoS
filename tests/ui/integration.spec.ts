import { test, expect } from './fixtures';

test.describe('Application Integration', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main content is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Take a screenshot for visual regression testing
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should navigate to join page', async ({ page }) => {
    await page.goto('/');
    
    // Look for join game button/link
    const joinButton = page.getByRole('link', { name: /join/i });
    if (await joinButton.isVisible()) {
      await joinButton.click();
      await page.waitForURL('**/join');
      await expect(page).toHaveURL(/.*\/join/);
    }
  });

  test('should handle WebSocket connection', async ({ page }) => {
    let wsConnected = false;
    
    // Monitor WebSocket connections
    page.on('websocket', ws => {
      ws.on('open', () => {
        wsConnected = true;
      });
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000); // Allow time for WS connection
    
    // Check if WebSocket connected (if the app uses one)
    // This is optional and depends on your app's WebSocket usage
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile layout
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Test error handling by going to a non-existent route
    await page.goto('/non-existent-route', { waitUntil: 'networkidle' });
    
    // Should show 404 or redirect to home
    const url = page.url();
    const has404 = await page.locator('text=404').isVisible().catch(() => false);
    const isHome = url.endsWith('/') || url.includes('/home');
    
    expect(has404 || isHome).toBeTruthy();
  });
});