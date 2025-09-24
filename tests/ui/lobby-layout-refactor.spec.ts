import { test, expect } from './fixtures';

test.describe('Lobby Layout Refactor - UI Changes', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(60000);
    
    await page.goto('http://localhost:5173');

    // Handle Keycloak login if redirected
    if (page.url().includes('localhost:8080')) {
      await page.locator('input[name="username"], input[type="text"]').first().fill('storyteller');
      await page.locator('input[name="password"], input[type="password"]').first().fill('password');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('http://localhost:5173/', { timeout: 30000 });
    }

    // Clean up any existing games
    const leaveGameButton = page.getByRole('button', { name: 'Leave Game' });
    if (await leaveGameButton.count()) {
      await leaveGameButton.click();
      await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
    }

    // Wait for auto-generation and create game with more robust waiting
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    // Wait for the main heading to appear with longer timeout
    try {
      await page.waitForSelector('h1:has-text("Blood on the Clocktower")', { timeout: 30000 });
    } catch (error) {
      console.log('Page content:', await page.content());
      throw error;
    }
    
    const createGameButton = page.locator('button', { hasText: 'Create Game' }).first();
    await createGameButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(createGameButton).not.toBeDisabled({ timeout: 30000 });
    await createGameButton.click();
    
    // Wait for lobby to load
    await page.waitForFunction(() => window.location.pathname.includes('/lobby/'), { timeout: 30000 });
    await page.waitForSelector('[data-testid="all-scripts-carousel"]', { timeout: 30000 });
  });

  test('Storyteller sees two carousels: All Scripts and Storyteller Shared Scripts', async ({ page }) => {
    // Storyteller should see both "All Scripts" and "Storyteller Shared Scripts" sections
    await expect(page.getByText('All Scripts (Storyteller Only)')).toBeVisible();
    await expect(page.getByText('Storyteller Shared Scripts')).toBeVisible();
    
    // Verify the all-scripts-carousel is visible
    await expect(page.locator('[data-testid="all-scripts-carousel"]')).toBeVisible();
    
    // Verify the shared-scripts-carousel is visible
    await expect(page.locator('[data-testid="shared-scripts-carousel"]')).toBeVisible();
    
    // Verify storyteller doesn't see player-games-carousel
    await expect(page.locator('[data-testid="player-games-carousel"]')).not.toBeVisible();
  });

  test('Character grid has 4 rows instead of 3', async ({ page }) => {
    // First, select a script to see characters
    const firstScript = page.locator('[data-testid^="all-script-"]').first();
    await firstScript.click();
    
    // Share the script to ensure characters are loaded
    const scriptId = await firstScript.getAttribute('data-testid');
    const scriptSlug = scriptId?.replace('all-script-', '');
    if (scriptSlug) {
      await page.locator(`[data-testid="master-toggle-${scriptSlug}"]`).click();
    }
    
    // Wait for characters to load
    await page.waitForSelector('[data-testid="character-grid"]', { timeout: 10000 });
    
    const characterGrid = page.locator('[data-testid="character-grid"]');
    await expect(characterGrid).toBeVisible();
    
    // Check that grid has grid-rows-4 class
    await expect(characterGrid).toHaveClass(/grid-rows-4/);
  });

  test('Player voting carousel is positioned at bottom', async ({ page }) => {
    // First, select and share a script
    const firstScript = page.locator('[data-testid^="all-script-"]').first();
    await firstScript.click();
    
    const scriptId = await firstScript.getAttribute('data-testid');
    const scriptSlug = scriptId?.replace('all-script-', '');
    if (scriptSlug) {
      await page.locator(`[data-testid="master-toggle-${scriptSlug}"]`).click();
      
      // Wait for the shared script to appear
      await page.waitForSelector(`[data-testid="shared-script-${scriptSlug}"]`, { timeout: 5000 });
      
      // Propose the script to create voting section
      await page.locator(`[data-testid="proposal-toggle-${scriptSlug}"]`).click();
      
      // Wait for proposal carousel to appear at bottom
      await page.waitForSelector('[data-testid="proposal-carousel"]', { timeout: 5000 });
      
      // Check that Player Voting section exists
      const playerVotingSection = page.getByText('Player Voting');
      await expect(playerVotingSection).toBeVisible();
      
      // Verify it's in a grid layout with game modifiers
      const votingContainer = page.locator('.grid.grid-cols-12').filter({ hasText: 'Player Voting' });
      await expect(votingContainer).toBeVisible();
      
      // Check that modifiers section exists next to it
      const modifiersSection = page.getByText('Game Modifiers');
      await expect(modifiersSection).toBeVisible();
    }
  });
});

test.describe('Player View Tests', () => {
  test('Player sees one carousel spanning full width: Available Games', async ({ page }) => {
    // Login as player1
    await page.goto('http://localhost:5173');

    if (page.url().includes('localhost:8080')) {
      await page.locator('input[name="username"], input[type="text"]').first().fill('player1');
      await page.locator('input[name="password"], input[type="password"]').first().fill('password');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
    }

    // Clean up any existing games
    const leaveGameButton = page.getByRole('button', { name: 'Leave Game' });
    if (await leaveGameButton.count()) {
      await leaveGameButton.click();
      await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    }

    // Wait for auto-generation and create game
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Blood on the Clocktower")', { timeout: 15000 });
    
    const createGameButton = page.locator('button', { hasText: 'Create Game' }).first();
    await createGameButton.waitFor({ state: 'visible', timeout: 15000 });
    await expect(createGameButton).not.toBeDisabled({ timeout: 15000 });
    await createGameButton.click();
    
    // Wait for lobby to load
    await page.waitForFunction(() => window.location.pathname.includes('/lobby/'), { timeout: 15000 });

    // Player should see "Available Games" section spanning full width
    await expect(page.getByText('Available Games')).toBeVisible();
    
    // Verify the player-games-carousel is visible
    await expect(page.locator('[data-testid="player-games-carousel"]')).toBeVisible();
    
    // Verify player doesn't see storyteller-only sections
    await expect(page.getByText('All Scripts (Storyteller Only)')).not.toBeVisible();
    await expect(page.locator('[data-testid="all-scripts-carousel"]')).not.toBeVisible();
    
    // Player should still see shared scripts section
    await expect(page.getByText('Storyteller Shared Scripts')).toBeVisible();
  });
});