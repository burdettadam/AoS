import { expect, test } from "./fixtures/index";

test.describe("Multi-User Authentication", () => {
  test("should allow multiple users to login simultaneously", async ({
    loginMultipleUsers,
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

  test("should handle storyteller creating game and players joining", async ({
    browser,
  }) => {
    // Create separate contexts for storyteller and player
    const storytellerContext = await browser.newContext();
    const storytellerPage = await storytellerContext.newPage();

    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    try {
      // Set player names in localStorage
      await storytellerContext.addInitScript(() => {
        localStorage.setItem("ashes-of-salem-player-name", "Storyteller");
      });
      await playerContext.addInitScript(() => {
        localStorage.setItem("ashes-of-salem-player-name", "Player 1");
      });

      // Login storyteller
      await storytellerPage.goto("http://localhost:5173/");
      await storytellerPage.waitForLoadState("networkidle");

      // Wait for automatic redirect to Keycloak
      await storytellerPage.waitForURL(
        "**/realms/botct/protocol/openid-connect/auth**",
        {
          timeout: 15000,
        },
      );

      // Fill login form
      await storytellerPage.fill("#username", "storyteller");
      await storytellerPage.fill("#password", "password");
      await storytellerPage.click("#kc-login");

      // Wait for redirect back to app
      await storytellerPage.waitForURL("http://localhost:5173/**", {
        timeout: 30000,
      });

      // Wait for Create Game button to be visible
      await storytellerPage.waitForSelector('button:has-text("Create Game")', {
        timeout: 30000,
      });

      // Check if button is enabled (not disabled due to missing player name)
      const createButton = storytellerPage.locator(
        'button:has-text("Create Game")',
      );
      const isDisabled = await createButton.getAttribute("disabled");
      console.log("Create Game button disabled attribute:", isDisabled);

      // Check player name in localStorage
      const playerName = await storytellerPage.evaluate(() => {
        return localStorage.getItem("ashes-of-salem-player-name");
      });
      console.log("Player name in localStorage:", playerName);

      // Storyteller creates a game
      const [response] = await Promise.all([
        storytellerPage.waitForResponse(
          (resp) =>
            resp.url().includes("/api/games") &&
            resp.request().method() === "POST",
        ),
        storytellerPage.click('button:has-text("Create Game")'),
      ]);

      console.log("API response status:", response.status());
      console.log("API response body:", await response.text());

      await storytellerPage.waitForURL("**/lobby/**");

      const gameUrl = storytellerPage.url();
      const gameId = gameUrl.match(/lobby\/([a-f0-9-]+)/)?.[1];
      expect(gameId).toBeTruthy();

      // Login player
      await playerPage.goto("http://localhost:5173/");
      await playerPage.waitForLoadState("networkidle");

      // Wait for automatic redirect to Keycloak
      await playerPage.waitForURL(
        "**/realms/botct/protocol/openid-connect/auth**",
        {
          timeout: 15000,
        },
      );

      // Fill login form
      await playerPage.fill("#username", "player1");
      await playerPage.fill("#password", "password");
      await playerPage.click("#kc-login");

      // Wait for redirect back to app
      await playerPage.waitForURL("http://localhost:5173/**", {
        timeout: 30000,
      });

      // Player joins the game
      await playerPage.goto(`http://localhost:5173/lobby/${gameId}`);
      await playerPage.waitForLoadState("networkidle");

      // Verify both users are in the lobby
      await expect(
        storytellerPage.locator('[data-testid="lobby-container"]'),
      ).toBeVisible();
      await expect(
        playerPage.locator('[data-testid="lobby-container"]'),
      ).toBeVisible();
    } finally {
      await storytellerContext.close();
      await playerContext.close();
    }
  });
});
