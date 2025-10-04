// Example of how to refactor existing tests to use fixtures
import { expect, test as originalTest } from "@playwright/test";
import { test } from "./fixtures/index";

// Original approach - verbose and repetitive
originalTest.describe("Lobby UX (Original)", () => {
  originalTest.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");

    // Manual login process
    await page.waitForSelector('button:has-text("Login")');
    await page.click('button:has-text("Login")');
    await page.waitForURL("**/realms/botct/protocol/openid-connect/auth**");
    await page.fill("#username", "testuser");
    await page.fill("#password", "password");
    await page.click("#kc-login");
    await page.waitForURL("http://localhost:5173/**");

    // Manual game creation
    await page.waitForSelector('button:has-text("Create Game")');
    await page.click('button:has-text("Create Game")');
    await page.waitForURL("**/lobby/**");
  });

  originalTest("should allow script selection", async ({ page }) => {
    // Test implementation...
    await expect(
      page.locator('button:has-text("Trouble Brewing")'),
    ).toBeVisible();
  });
});

// Refactored approach - clean and reusable
test.describe("Lobby UX (With Fixtures)", () => {
  test.beforeEach(async ({ loginAsUser, createGame }) => {
    await loginAsUser("testuser");
    await createGame({ name: "Test Game" });
  });

  test("should allow script selection using fixtures", async ({
    page,
    selectScript,
  }) => {
    // Much cleaner test implementation
    await selectScript("Trouble Brewing");
    await expect(
      page.locator('.script-selected:has-text("Trouble Brewing")'),
    ).toBeVisible();
  });

  test("should handle multiple script changes", async ({
    page,
    selectScript,
  }) => {
    await selectScript("Trouble Brewing");
    await selectScript("Sects & Violets");
    await selectScript("Bad Moon Rising");

    // Verify final selection
    await expect(
      page.locator('.script-selected:has-text("Bad Moon Rising")'),
    ).toBeVisible();
  });
});

// Multi-user scenario example
test.describe("Multi-User Lobby Scenarios", () => {
  test("storyteller and player workflow", async ({
    browser,
    loginAsUser,
    createGame,
    goToLobby,
  }) => {
    // Storyteller context
    const storytellerContext = await browser.newContext();
    const storytellerPage = await storytellerContext.newPage();

    // Player context
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    try {
      // Storyteller logs in and creates game
      await storytellerPage.goto("http://localhost:3001");
      await storytellerPage.waitForSelector('button:has-text("Login")');
      await storytellerPage.click('button:has-text("Login")');
      await storytellerPage.waitForURL(
        "**/realms/botct/protocol/openid-connect/auth**",
      );
      await storytellerPage.fill("#username", "storyteller");
      await storytellerPage.fill("#password", "password");
      await storytellerPage.click("#kc-login");
      await storytellerPage.waitForURL("http://localhost:3001/**");

      await storytellerPage.click('button:has-text("Create Game")');
      await storytellerPage.waitForURL("**/lobby/**");

      const gameUrl = storytellerPage.url();
      const gameId = gameUrl.match(/lobby\/([a-f0-9-]+)/)?.[1];

      // Player logs in and joins
      await playerPage.goto("http://localhost:3001");
      await playerPage.waitForSelector('button:has-text("Login")');
      await playerPage.click('button:has-text("Login")');
      await playerPage.waitForURL(
        "**/realms/botct/protocol/openid-connect/auth**",
      );
      await playerPage.fill("#username", "player1");
      await playerPage.fill("#password", "password");
      await playerPage.click("#kc-login");
      await playerPage.waitForURL("http://localhost:3001/**");

      await playerPage.goto(`http://localhost:3001/lobby/${gameId}`);

      // Verify both users are in the same game
      await expect(storytellerPage.locator("h1, .lobby-title")).toBeVisible();
      await expect(playerPage.locator("h1, .lobby-title")).toBeVisible();
    } finally {
      await storytellerContext.close();
      await playerContext.close();
    }
  });
});
