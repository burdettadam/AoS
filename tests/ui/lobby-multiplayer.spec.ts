import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import type { TestFixtures } from './fixtures';

const APP_URL = 'http://localhost:5173';
const STORYTELLER_NAME = 'Storyteller';
const PLAYER_ONE_NAME = 'Player One';
const PLAYER_TWO_NAME = 'Player Two';

interface LobbySetup {
  storytellerPage: Page;
  playerPages: Page[];
  cleanup: () => Promise<void>;
  gameId: string;
}

async function bootstrapLobby(
  loginMultipleUsers: TestFixtures['loginMultipleUsers'],
  { mockPTT = false }: { mockPTT?: boolean } = {}
): Promise<LobbySetup> {
  const multiUser = await loginMultipleUsers(3, {
    playerNames: [STORYTELLER_NAME, PLAYER_ONE_NAME, PLAYER_TWO_NAME],
    grantMicrophone: mockPTT,
    mockPTT
  });

  const [storytellerPage, playerOnePage, playerTwoPage] = multiUser.pages;

  await storytellerPage.waitForSelector('button:has-text("Create Game")', { timeout: 15000 });
  await storytellerPage.click('button:has-text("Create Game")');
  await storytellerPage.waitForURL('**/lobby/**', { timeout: 15000 });
  await storytellerPage.waitForLoadState('networkidle');
  await storytellerPage.waitForSelector('text=Voice Chat', { timeout: 15000 });

  const gameUrl = storytellerPage.url();
  const gameIdMatch = gameUrl.match(/lobby\/([a-f0-9-]+)/i);
  if (!gameIdMatch) {
    throw new Error('Failed to extract game id from lobby url');
  }
  const gameId = gameIdMatch[1];

  const playerPages = [playerOnePage, playerTwoPage];

  for (const page of playerPages) {
    await page.goto(`${APP_URL}/lobby/${gameId}`);
    await page.waitForLoadState('networkidle');

    const joinButton = page.locator('button:has-text("Join Game")');
    if (await joinButton.isVisible()) {
      await joinButton.click();
    }

    await page.waitForSelector('text=Voice Chat', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Game Lobby');
  }

  for (const name of [PLAYER_ONE_NAME, PLAYER_TWO_NAME]) {
    await expect(storytellerPage.getByText(name)).toBeVisible({ timeout: 15000 });
  }

  return {
    storytellerPage,
    playerPages,
    cleanup: multiUser.cleanup,
    gameId
  };
}

test.describe('Lobby Multiplayer Scenarios', () => {
  test('players join storyteller lobby and are listed for everyone', async ({ loginMultipleUsers }) => {
    const setup = await bootstrapLobby(loginMultipleUsers);
    const { storytellerPage, playerPages, cleanup } = setup;

    try {
      await expect(storytellerPage.locator('text=Players (2)')).toBeVisible({ timeout: 10000 });
      await expect(storytellerPage.getByText(STORYTELLER_NAME)).toBeVisible();

      for (const playerName of [PLAYER_ONE_NAME, PLAYER_TWO_NAME]) {
        await expect(storytellerPage.getByText(playerName)).toBeVisible();
      }

      for (const page of playerPages) {
        await expect(page.locator('text=Players (2)')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Storyteller')).toBeVisible();
        await expect(page.locator('text=Voice Chat')).toBeVisible();
      }
    } finally {
      await cleanup();
    }
  });

  test('storyteller can delegate the storyteller role to another player', async ({ loginMultipleUsers }) => {
    const setup = await bootstrapLobby(loginMultipleUsers);
    const { storytellerPage, playerPages, cleanup } = setup;

    try {
      const targetRow = storytellerPage.locator('.card', { hasText: PLAYER_ONE_NAME }).first();
      await targetRow.locator('button[title="Make Storyteller"]').click();

      await expect(storytellerPage.locator('.card', { hasText: 'Storyteller' })).toContainText(PLAYER_ONE_NAME, { timeout: 15000 });
      await expect(playerPages[0].locator('.card', { hasText: 'Storyteller' })).toContainText(PLAYER_ONE_NAME, { timeout: 15000 });
    } finally {
      await cleanup();
    }
  });

  test('players can propose and vote on shared scripts', async ({ loginMultipleUsers }) => {
    const setup = await bootstrapLobby(loginMultipleUsers);
    const { storytellerPage, playerPages, cleanup } = setup;
    const [playerOnePage, playerTwoPage] = playerPages;

    try {
      await storytellerPage.waitForSelector('[data-testid^="all-script-"]', { timeout: 15000 });
      const scriptButton = storytellerPage.locator('[data-testid^="all-script-"]').first();
      const scriptTestId = await scriptButton.getAttribute('data-testid');
      if (!scriptTestId) throw new Error('No storyteller script found');
      const scriptId = scriptTestId.replace('all-script-', '');
      const scriptName = await scriptButton.evaluate((node) => {
        const label = node.querySelector('div');
        return label?.textContent?.trim() || '';
      });
      const scriptLabel = scriptName || scriptId;

      await storytellerPage.locator(`[data-testid="master-toggle-${scriptId}"]`).click();
      await expect(storytellerPage.locator(`[data-testid="shared-script-${scriptId}"]`)).toBeVisible({ timeout: 15000 });

      for (const page of playerPages) {
        await expect(page.locator(`[data-testid="shared-script-${scriptId}"]`)).toBeVisible({ timeout: 15000 });
      }

      const proposerToggle = playerOnePage.locator(`[data-testid="proposal-toggle-${scriptId}"]`);
      await proposerToggle.click();
      await expect(proposerToggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });

      const playerOneProposalCard = playerOnePage.locator('[data-testid^="proposal-card-"]').filter({ hasText: scriptLabel }).first();
      await expect(playerOneProposalCard).toBeVisible({ timeout: 15000 });
      await expect(playerOneProposalCard.locator('text=You proposed')).toBeVisible();

      const playerTwoProposalCard = playerTwoPage.locator('[data-testid^="proposal-card-"]').filter({ hasText: scriptLabel }).first();
      await expect(playerTwoProposalCard).toBeVisible({ timeout: 15000 });

      const storyProposalCard = storytellerPage.locator('[data-testid^="proposal-card-"]').filter({ hasText: scriptLabel }).first();
      await expect(storyProposalCard).toBeVisible({ timeout: 15000 });

      const playerTwoVoteUp = playerTwoProposalCard.locator('[data-testid^="vote-up-"]').first();
      await playerTwoVoteUp.click();
      await expect(playerTwoVoteUp).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });
      await expect(playerTwoProposalCard.locator('text=Popularity score: 1')).toBeVisible({ timeout: 10000 });

      await expect(playerOneProposalCard.locator('text=Popularity score: 1')).toBeVisible({ timeout: 10000 });
      await expect(storyProposalCard.locator('text=Popularity score: 1')).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  test('press-to-talk storyteller speaking suppresses other microphones', async ({ loginMultipleUsers }) => {
    const setup = await bootstrapLobby(loginMultipleUsers, { mockPTT: true });
    const { storytellerPage, playerPages, cleanup } = setup;
    const [playerOnePage] = playerPages;

    try {
      const storytellerMicButton = storytellerPage
        .locator('div:has-text("Voice Chat")')
        .locator('button')
        .first();
      await storytellerMicButton.click();
      await expect(storytellerMicButton).toHaveAttribute('title', /stop speaking/i, { timeout: 5000 });
      await expect(storytellerMicButton).toHaveClass(/bg-red-500/);

      const playerMicButton = playerOnePage
        .locator('div:has-text("Voice Chat")')
        .locator('button')
        .first();
      await playerMicButton.click();
      await expect(playerMicButton).toHaveAttribute('title', /start speaking/i);

      await storytellerMicButton.click();
      await expect(storytellerMicButton).toHaveAttribute('title', /start speaking/i, { timeout: 5000 });
      await storytellerPage.waitForTimeout(600);

      await playerMicButton.click();
      await expect(playerMicButton).toHaveAttribute('title', /stop speaking/i, { timeout: 5000 });
      await expect(playerMicButton).toHaveClass(/bg-red-500/);

      await playerMicButton.click();
      await playerOnePage.waitForTimeout(600);
    } finally {
      await cleanup();
    }
  });
});
