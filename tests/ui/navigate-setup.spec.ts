import { expect, test } from "./fixtures/index";

// Test: Storyteller can click Begin Game Setup and land on /setup/:gameId with Game Setup UI
// Uses shared fixtures for login & game creation to reduce duplication.

test.describe("Game Setup Navigation", () => {
  test("Storyteller navigates to setup page", async ({
    page,
    loginAsUser,
    createGame,
  }) => {
    test.setTimeout(60000);

    // Login as storyteller user (uses existing Keycloak flow in fixture)
    await loginAsUser("storyteller");

    // Create a new game (fixture returns gameId)
    const gameId = await createGame();

    // We should now be in the lobby route
    await expect.poll(async () => page.url()).toContain(`/lobby/`);
    await expect(page).toHaveURL(new RegExp(`/lobby/${gameId}`));

    // Precondition: Scripts carousel present (ensures lobby finished loading)
    await page.waitForSelector('[data-testid="all-scripts-carousel"]', {
      timeout: 30000,
    });

    // Click Begin Game Setup
    const beginSetupBtn = page.getByRole("button", {
      name: /Begin Game Setup/i,
    });
    await beginSetupBtn.waitFor({ state: "visible", timeout: 30000 });
    await expect(beginSetupBtn).toBeEnabled();
    await beginSetupBtn.click();

    // Expect navigation to /setup/:id and auto-enter logic to keep us there
    await expect
      .poll(async () => page.url(), { timeout: 30000 })
      .toMatch(/\/setup\//);

    // Allow phase transition to complete (auto enter may be async)
    await page.waitForSelector('[data-testid="game-setup-info-panel"]', {
      timeout: 30000,
    });

    // Heading could be either storyteller or fallback; assert canonical storyteller heading
    await expect(
      page.getByRole("heading", { name: "Game Setup" }),
    ).toBeVisible();

    // Confirm panels present
    await expect(
      page.locator('[data-testid="game-setup-info-panel"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
  });
});
