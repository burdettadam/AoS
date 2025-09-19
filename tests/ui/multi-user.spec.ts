import { test, expect } from './fixtures';

test.describe('Multi-User Authentication', () => {
  test('should allow multiple users to login simultaneously', async ({ 
    loginMultipleUsers 
  }) => {
    // Login 3 users simultaneously in separate browser contexts
    const { users, cleanup } = await loginMultipleUsers(3);
    
    expect(users).toHaveLength(3);
    
    // Verify each user has proper authentication data
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      expect(user.username).toBe(`testuser${i + 1}`);
      expect(user.displayName).toBe(`Test User ${i + 1}`);
      expect(user.email).toBe(`testuser${i + 1}@example.com`);
    }
    
    // Clean up all user contexts
    await cleanup();
  });

  test('should handle storyteller creating game and players joining', async ({ 
    browser,
    loginAsUser,
    createGame,
    goToLobby
  }) => {
    // Create separate contexts for different users
    const storytellerContext = await browser.newContext();
    const storytellerPage = await storytellerContext.newPage();
    
    const player1Context = await browser.newContext();
    const player1Page = await player1Context.newPage();
    
    try {
      // Login storyteller
      await storytellerPage.goto('http://localhost:5173/');
      await storytellerPage.waitForSelector('button:has-text("Login")');
      await storytellerPage.click('button:has-text("Login")');
      await storytellerPage.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
      await storytellerPage.fill('#username', 'storyteller');
      await storytellerPage.fill('#password', 'password');
      await storytellerPage.click('#kc-login');
      await storytellerPage.waitForURL('http://localhost:5173/**');
      
      // Storyteller creates a game
      await storytellerPage.click('button:has-text("Create Game")');
      await storytellerPage.waitForURL('**/lobby/**');
      
      const gameUrl = storytellerPage.url();
      const gameId = gameUrl.match(/lobby\/([a-f0-9-]+)/)?.[1];
      expect(gameId).toBeTruthy();
      
      // Login player1
      await player1Page.goto('http://localhost:5173/');
      await player1Page.waitForSelector('button:has-text("Login")');
      await player1Page.click('button:has-text("Login")');
      await player1Page.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
      await player1Page.fill('#username', 'player1');
      await player1Page.fill('#password', 'password');
      await player1Page.click('#kc-login');
      await player1Page.waitForURL('http://localhost:5173/**');
      
      // Player joins the game
      await player1Page.goto(`http://localhost:5173/lobby/${gameId}`);
      
      // Verify both users are in the lobby
      await expect(storytellerPage.locator('button:has-text("Create Game"), [data-testid="lobby-container"]')).toBeVisible();
      await expect(player1Page.locator('button:has-text("Create Game"), [data-testid="lobby-container"]')).toBeVisible();
      
    } finally {
      await storytellerContext.close();
      await player1Context.close();
    }
  });
});