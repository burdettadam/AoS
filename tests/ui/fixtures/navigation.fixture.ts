export const navigationFixture = {
  goToHome: async ({ page }, use) => {
    const goToHome = async (): Promise<void> => {
      await page.goto('http://localhost:3001');
      await page.waitForLoadState('networkidle');
    };
    
    await use(goToHome);
  },

  goToLobby: async ({ page }, use) => {
    const goToLobby = async (gameId?: string): Promise<void> => {
      if (gameId) {
        await page.goto(`http://localhost:3001/lobby/${gameId}`);
      } else {
        // Navigate from home page
        await page.waitForSelector('button:has-text("Create Game")');
        await page.click('button:has-text("Create Game")');
      }
      await page.waitForLoadState('networkidle');
    };
    
    await use(goToLobby);
  },

  goToGame: async ({ page }, use) => {
    const goToGame = async (gameId: string): Promise<void> => {
      await page.goto(`http://localhost:3001/game/${gameId}`);
      await page.waitForLoadState('networkidle');
    };
    
    await use(goToGame);
  },

  waitForPageLoad: async ({ page }, use) => {
    const waitForPageLoad = async (): Promise<void> => {
      await page.waitForLoadState('networkidle');
      // Also wait for any React components to mount
      await page.waitForTimeout(500);
    };
    
    await use(waitForPageLoad);
  }
};