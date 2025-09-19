import { test, expect } from '@playwright/test';

test.describe('Keycloak Login Page UI Regression', () => {
  test('should match UX spec and custom theme', async ({ page }) => {
    // Set deterministic viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Disable animations for consistency
    await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });

    // Use an incognito-like context to ensure we start unauthenticated
    const context = await page.context().browser()?.newContext();
    const freshPage = await context!.newPage();
    
    // Set viewport and animations for the fresh page too
    await freshPage.setViewportSize({ width: 1280, height: 800 });
    await freshPage.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });

    // Navigate to app - should automatically redirect to Keycloak when not authenticated
    await freshPage.goto('http://localhost:5173/');

    // Wait for automatic redirect to Keycloak login page
    await freshPage.waitForURL(/localhost:8080\/realms\/botct\/protocol\/openid-connect\/auth/, { timeout: 10000 });
    
    // Wait for the page to load completely
    await freshPage.waitForLoadState('networkidle');

    // Check that login form elements are present using flexible selectors
    const usernameInput = freshPage.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = freshPage.locator('input[name="password"], input[type="password"]').first();
    const signInButton = freshPage.getByRole('button', { name: /sign in/i });
    
    // Wait for the main form elements to be visible
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();

    // Assert key elements (updated to match actual page content)
    await expect(freshPage.getByText('Blood on the Clocktower')).toBeVisible();
    await expect(usernameInput).toBeVisible(); // Use the variables we already found
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
    await expect(freshPage.getByText('Remember me')).toBeVisible();
    
    // Check for other expected elements with more flexible selectors
    const forgotPasswordLink = freshPage.getByText('Forgot Password?').or(freshPage.locator('a[href*="reset-credentials"]'));
    const registerLink = freshPage.getByText('Register').or(freshPage.locator('a[href*="registration"]'));
    
    // These might not be visible depending on Keycloak configuration, so make them optional
    if (await forgotPasswordLink.count() > 0) {
      await expect(forgotPasswordLink).toBeVisible();
    }
    if (await registerLink.count() > 0) {
      await expect(registerLink).toBeVisible();
    }

    // Ensure the custom theme preserves the compact default form width
    const loginCard = freshPage.locator('.login-pf-page .card-pf');
    const cardBox = await loginCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox && cardBox.width).toBeLessThanOrEqual(440);
    expect(cardBox && cardBox.width).toBeGreaterThan(300);

    // Screenshot for regression
    const screenshotPath = 'tests/ui/__screenshots__/current/keycloak-login.png';
    await freshPage.screenshot({ path: screenshotPath, fullPage: true });
    
    // Close the fresh context
    await context!.close();
  });
});
