import { expect, test } from "./fixtures/index";

test.describe("Setup Page Script Selection", () => {
  test("Selecting a script populates characters and updates distribution", async ({
    page,
    loginAsUser,
    createGame,
  }) => {
    test.setTimeout(65000);

    await loginAsUser("storyteller");
    const gameId = await createGame();

    // Navigate to setup
    await page.getByRole("button", { name: /Begin Game Setup/i }).click();
    await expect.poll(() => page.url()).toMatch(/\/setup\//);

    // Wait for script carousel
    await page.waitForSelector('[data-testid="setup-scripts-carousel"]', {
      timeout: 30000,
    });

    // Pick the first script card
    const firstScript = page
      .locator(
        '[data-testid="setup-scripts-carousel"] [data-testid^="script-"]',
      )
      .first();
    await firstScript.click();

    // Distribution should now show numbers (not em-dash for townsfolk)
    const distributionPanel = page.locator(
      '[data-testid="game-setup-info-panel"]',
    );
    await expect(distributionPanel).toBeVisible();
    await expect(
      distributionPanel.locator("text=No Script Selected"),
    ).toHaveCount(0);

    // Characters grid should populate
    await page.waitForSelector('[data-testid="character-grid"] button', {
      timeout: 30000,
    });
    const characterButtons = await page
      .locator('[data-testid="character-grid"] button')
      .count();
    expect(characterButtons).toBeGreaterThan(0);
  });
});
