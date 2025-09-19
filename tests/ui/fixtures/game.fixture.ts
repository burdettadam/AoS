export const gameFixture = {
  createGame: async ({ page }, use) => {
    const createGame = async (options: { name?: string; isPublic?: boolean } = {}): Promise<string> => {
      // Navigate to home if not already there
      if (!page.url().includes('localhost:3001')) {
        await page.goto('http://localhost:3001');
      }
      
      // Wait for and click Create Game button
      await page.waitForSelector('button:has-text("Create Game")');
      await page.click('button:has-text("Create Game")');
      
      // Wait for lobby page to load
      await page.waitForURL('**/lobby/**');
      
      // Extract game ID from URL
      const url = page.url();
      const gameIdMatch = url.match(/lobby\/([a-f0-9-]+)/);
      if (!gameIdMatch) {
        throw new Error('Could not extract game ID from URL');
      }
      
      const gameId = gameIdMatch[1];
      
      // Set game options if provided
      if (options.name) {
        await page.fill('[data-testid="game-name-input"]', options.name);
      }
      
      if (options.isPublic !== undefined) {
        const publicToggle = page.locator('[data-testid="public-game-toggle"]');
        if (await publicToggle.isVisible()) {
          const isCurrentlyPublic = await publicToggle.isChecked();
          if (isCurrentlyPublic !== options.isPublic) {
            await publicToggle.click();
          }
        }
      }
      
      return gameId;
    };
    
    await use(createGame);
  },

  joinGame: async ({ page }, use) => {
    const joinGame = async (gameId: string): Promise<void> => {
      await page.goto(`http://localhost:3001/lobby/${gameId}`);
      await page.waitForLoadState('networkidle');
      
      // Look for join button if it exists
      const joinButton = page.locator('button:has-text("Join Game")');
      if (await joinButton.isVisible()) {
        await joinButton.click();
      }
    };
    
    await use(joinGame);
  },

  waitForLobby: async ({ page }, use) => {
    const waitForLobby = async (): Promise<void> => {
      await page.waitForSelector('[data-testid="lobby-container"], .lobby');
      await page.waitForLoadState('networkidle');
    };
    
    await use(waitForLobby);
  },

  selectScript: async ({ page }, use) => {
    const selectScript = async (scriptName: string): Promise<void> => {
      // Wait for script selection area
      await page.waitForSelector('[data-testid="script-selector"], .script-list');
      
      // Try multiple selector strategies for the script
      const scriptSelectors = [
        `[data-testid="script-${scriptName.toLowerCase().replace(/\s+/g, '-')}"]`,
        `button:has-text("${scriptName}")`,
        `.script-item:has-text("${scriptName}")`,
        `[title="${scriptName}"]`
      ];
      
      let clicked = false;
      for (const selector of scriptSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await element.click();
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        throw new Error(`Could not find script "${scriptName}" to select`);
      }
      
      // Wait for selection to take effect
      await page.waitForTimeout(500);
    };
    
    await use(selectScript);
  }
};