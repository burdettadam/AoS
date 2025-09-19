import { test, expect } from '@playwright/test';

test.describe('CarouselScroller UI diagnosis', () => {
  test('login, create game, and diagnose slider', async ({ page }) => {
    // 1. Go to app - will automatically redirect to Keycloak login
    await page.goto('http://localhost:5173/');

    // 2. Wait for Keycloak login page and authenticate
    await page.waitForURL(/localhost:8080\/realms\/botct\/protocol\/openid-connect\/auth/);
    
    // 3. Login with Keycloak testuser
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('input[type="submit"]');

    // 4. Wait for redirect back to app and create game
    await page.waitForURL('http://localhost:5173/');
    await expect(page.locator('button:has-text("Create Game")')).toBeVisible();
    await page.click('button:has-text("Create Game")');

    // 5. Wait for game page and see slider
    await page.waitForSelector('.keen-slider');
    await expect(page.locator('.keen-slider')).toBeVisible();

    // 6. Diagnose slider: click left/right and log selected index
    const leftButton = page.locator('button[aria-label="Scroll left"]');
    const rightButton = page.locator('button[aria-label="Scroll right"]');
    await expect(leftButton).toBeVisible();
    await expect(rightButton).toBeVisible();

    // Click left and right, check slider state
    await leftButton.click();
    await rightButton.click();
    // Optionally, add more assertions or screenshots
    await page.screenshot({ path: 'diagnose-slider.png' });
  });
});
