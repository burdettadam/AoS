import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Lobby UX improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    if (page.url().includes('localhost:8080')) {
      await page.locator('input[name="username"], input[type="text"]').first().fill('testuser');
      await page.locator('input[name="password"], input[type="password"]').first().fill('password');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    }

    const leaveGameButton = page.getByRole('button', { name: 'Leave Game' });
    if (await leaveGameButton.count()) {
      await leaveGameButton.click();
      await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    }

    // Wait for auto-generation of player/game names to complete
    await page.waitForTimeout(5000);
    
    // Ensure we're on the right page and wait for it to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Blood on the Clocktower")', { timeout: 10000 });
    
    // Wait specifically for the Create Game button to be both visible and enabled
    const createGameButton = page.locator('button', { hasText: 'Create Game' }).first();
    await createGameButton.waitFor({ state: 'visible', timeout: 15000 });
    await expect(createGameButton).not.toBeDisabled({ timeout: 15000 });
    
    await createGameButton.click();
    
    // Wait for navigation to lobby
    await page.waitForFunction(() => window.location.pathname.includes('/lobby/'), { timeout: 15000 });
    await page.waitForSelector('[data-testid="all-scripts-carousel"]', { timeout: 15000 });
  });

  const getFirstScriptId = async (page: Page) => {
    const first = page.locator('[data-testid^="all-script-"]').first();
    const dataId = await first.getAttribute('data-testid');
    if (!dataId) throw new Error('No storyteller script found');
    return dataId.replace('all-script-', '');
  };

  test('Arrow keys cycle storyteller scripts and update summary', async ({ page }) => {
    const carousel = page.locator('[data-testid="all-scripts-carousel"]');
    const bottomInfo = page.locator('[data-testid="bottom-bar-script"]');

    const initialScript = await bottomInfo.textContent();
    const initialScroll = await carousel.evaluate((node: HTMLElement) => node.scrollLeft);

    await carousel.click();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    const updatedScript = await bottomInfo.textContent();
    const updatedScroll = await carousel.evaluate((node: HTMLElement) => node.scrollLeft);

    expect(updatedScript).not.toEqual(initialScript);
    expect(updatedScroll).not.toEqual(initialScroll);
  });

  test('Sharing a script exposes it to players and allows proposing', async ({ page }) => {
    const scriptId = await getFirstScriptId(page);
    await page.locator(`[data-testid="master-toggle-${scriptId}"]`).click();
    const sharedCard = page.locator(`[data-testid="shared-script-${scriptId}"]`);
    await expect(sharedCard).toBeVisible();

    await page.locator(`[data-testid="proposal-toggle-${scriptId}"]`).click();

    const proposalCard = page.locator(`[data-testid^="proposal-card-"]`).first();
    await expect(proposalCard).toBeVisible();
    await expect(proposalCard.getByText('You proposed')).toBeVisible();

    const upVote = proposalCard.locator('[data-testid^="vote-up-"]');
    await expect(upVote).toHaveAttribute('aria-pressed', 'true');

    await proposalCard.locator('[data-testid^="vote-down-"]').click();
    await expect(upVote).toHaveAttribute('aria-pressed', 'false');
    await expect(proposalCard.locator('[data-testid^="vote-down-"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(proposalCard.getByText('Popularity score: -1')).toBeVisible();

    await proposalCard.locator('[data-testid^="vote-down-"]').click();
    await expect(proposalCard.locator('[data-testid^="vote-down-"]')).toHaveAttribute('aria-pressed', 'false');
  });

  test('Character grid renders in three rows', async ({ page }) => {
    const characterGrid = page.locator('[data-testid="character-grid"]');
    await expect(characterGrid).toBeVisible();

    const offsets = await characterGrid.evaluate((node: HTMLElement) => {
      const tops = Array.from(node.querySelectorAll('button'))
        .slice(0, 6)
        .map((el) => (el as HTMLElement).offsetTop);
      return Array.from(new Set(tops));
    });

    expect(offsets.length).toBeLessThanOrEqual(3);
  });

  test('Preview panel stacks art above description with scrollable text', async ({ page }) => {
    const artBox = await page.locator('[data-testid="preview-art"]').boundingBox();
    const descriptionBox = await page.locator('[data-testid="preview-description"]').boundingBox();
    expect(artBox && descriptionBox && artBox.y < descriptionBox.y).toBeTruthy();

    // Check the actual scrollable text element inside the preview-description container
    const scrollableText = page.locator('[data-testid="preview-description"] > div:last-child');
    const overflow = await scrollableText.evaluate((node: HTMLElement) => getComputedStyle(node).overflowY);
    expect(overflow === 'auto' || overflow === 'scroll').toBeTruthy();
  });
});
