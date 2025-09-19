import type { AuthenticatedUser } from './types';

export const authFixture = {
  loginAsUser: async ({ page }, use) => {
    const loginUser = async (username: string): Promise<AuthenticatedUser> => {
      await page.goto('http://localhost:3001');
      
      // Wait for the login button and click it
      await page.waitForSelector('button:has-text("Login")');
      await page.click('button:has-text("Login")');
      
      // Wait for Keycloak login page
      await page.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
      
      // Fill in credentials
      await page.fill('#username', username);
      await page.fill('#password', 'password'); // Default test password
      await page.click('#kc-login');
      
      // Wait for redirect back to app
      await page.waitForURL('http://localhost:3001/**');
      await page.waitForSelector('button:has-text("Create Game")');
      
      return {
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@example.com`
      };
    };
    
    await use(loginUser);
  },

  loginAsStoryteller: async ({ page }, use) => {
    const loginStoryteller = async (): Promise<AuthenticatedUser> => {
      // Use a predefined storyteller account for testing
      const username = 'storyteller';
      await page.goto('http://localhost:3001');
      
      await page.waitForSelector('button:has-text("Login")');
      await page.click('button:has-text("Login")');
      
      await page.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
      
      await page.fill('#username', username);
      await page.fill('#password', 'password');
      await page.click('#kc-login');
      
      await page.waitForURL('http://localhost:3001/**');
      await page.waitForSelector('button:has-text("Create Game")');
      
      return {
        username,
        displayName: 'Storyteller',
        email: `${username}@example.com`
      };
    };
    
    await use(loginStoryteller);
  },

  loginAsPlayer: async ({ page }, use) => {
    const loginPlayer = async (playerNumber: number = 1): Promise<AuthenticatedUser> => {
      const username = `player${playerNumber}`;
      await page.goto('http://localhost:3001');
      
      await page.waitForSelector('button:has-text("Login")');
      await page.click('button:has-text("Login")');
      
      await page.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
      
      await page.fill('#username', username);
      await page.fill('#password', 'password');
      await page.click('#kc-login');
      
      await page.waitForURL('http://localhost:3001/**');
      await page.waitForSelector('button:has-text("Create Game")');
      
      return {
        username,
        displayName: `Player ${playerNumber}`,
        email: `${username}@example.com`
      };
    };
    
    await use(loginPlayer);
  },

  loginMultipleUsers: async ({ browser }, use) => {
    const loginMultipleUsers = async (count: number): Promise<{ users: AuthenticatedUser[]; cleanup: () => Promise<void> }> => {
      const users: AuthenticatedUser[] = [];
      const contexts: any[] = [];
      
      for (let i = 1; i <= count; i++) {
        // Create isolated browser context for each user
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        
        const username = `testuser${i}`;
        
        await page.goto('http://localhost:3001');
        await page.waitForSelector('button:has-text("Login")');
        await page.click('button:has-text("Login")');
        
        await page.waitForURL('**/realms/botct/protocol/openid-connect/auth**');
        
        await page.fill('#username', username);
        await page.fill('#password', 'password');
        await page.click('#kc-login');
        
        await page.waitForURL('http://localhost:3001/**');
        await page.waitForSelector('button:has-text("Create Game")');
        
        users.push({
          username,
          displayName: `Test User ${i}`,
          email: `${username}@example.com`
        });
      }
      
      // Cleanup function to close all contexts
      const cleanup = async () => {
        for (const context of contexts) {
          await context.close();
        }
      };
      
      return { users, cleanup };
    };
    
    await use(loginMultipleUsers);
  },

  logout: async ({ page }, use) => {
    const logout = async (): Promise<void> => {
      // Look for logout button or user menu
      const userMenuSelector = '[data-testid="user-menu"], .user-menu, button:has-text("Logout")';
      
      if (await page.locator(userMenuSelector).isVisible()) {
        await page.click(userMenuSelector);
        
        // If there's a dropdown, click logout
        const logoutSelector = 'button:has-text("Logout"), a:has-text("Logout")';
        if (await page.locator(logoutSelector).isVisible()) {
          await page.click(logoutSelector);
        }
      }
      
      // Wait for redirect to login page or home
      await page.waitForSelector('button:has-text("Login")');
    };
    
    await use(logout);
  }
};