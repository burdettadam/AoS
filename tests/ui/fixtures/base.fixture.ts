import type { BrowserContext } from "@playwright/test";
import { test as baseTest, Page } from "@playwright/test";

export interface AuthenticatedUser {
  username: string;
  displayName: string;
  email: string;
}

export interface TestFixtures {
  loginAsUser: (username: string) => Promise<AuthenticatedUser>;
  createGame: (options?: {
    name?: string;
    isPublic?: boolean;
  }) => Promise<string>;
  goToLobby: (gameId?: string) => Promise<void>;
  selectScript: (scriptName: string) => Promise<void>;
  loginMultipleUsers: (
    count: number,
    options?: MultiUserOptions,
  ) => Promise<{
    users: AuthenticatedUser[];
    contexts: BrowserContext[];
    pages: Page[];
    cleanup: () => Promise<void>;
  }>;
}

interface MultiUserOptions {
  playerNames?: string[];
  grantMicrophone?: boolean;
  mockPTT?: boolean;
}

const injectPTTMocks = () => {
  if (typeof window === "undefined") return;

  class FakeMediaRecorder {
    private readonly stream: MediaStream;
    public ondataavailable:
      | ((event: { data: Blob; size: number }) => void)
      | null;

    constructor(stream: MediaStream) {
      this.stream = stream;
      this.ondataavailable = null;
    }

    start(): void {
      setTimeout(() => {
        this.ondataavailable?.({
          data: new Blob([new Uint8Array([0])], { type: "audio/webm" }),
          size: 1,
        });
      }, 10);
    }

    stop(): void {
      this.ondataavailable?.({
        data: new Blob([new Uint8Array([0])], { type: "audio/webm" }),
        size: 1,
      });
    }

    addEventListener() {}
    removeEventListener() {}
  }

  (window as any).MediaRecorder = FakeMediaRecorder;

  if (!navigator.mediaDevices) {
    (navigator as any).mediaDevices = {};
  }

  navigator.mediaDevices.getUserMedia = async () => new MediaStream();
};

async function performLogin(
  page: Page,
  username: string,
): Promise<AuthenticatedUser> {
  await page.goto("http://localhost:5173/");

  // Wait for page to fully load and check if already authenticated
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // If already logged in, return immediately
  if (await page.locator('button:has-text("Create Game")').isVisible()) {
    return {
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      email: `${username}@example.com`,
    };
  }

  // Wait for redirect to Keycloak or find login button
  try {
    await page.waitForURL("**/realms/aos/protocol/openid-connect/auth**", {
      timeout: 10000,
    });
  } catch {
    // If not redirected to Keycloak, look for login button
    await page.waitForSelector('button:has-text("Login")', { timeout: 15000 });
    await page.click('button:has-text("Login")');
    await page.waitForURL("**/realms/aos/protocol/openid-connect/auth**", {
      timeout: 30000,
    });
  }

  console.log(`Attempting login for user: ${username}`);
  console.log(`Current URL: ${page.url()}`);

  // Wait for the login form to be visible
  await page.waitForSelector("#username", { timeout: 15000 });
  await page.waitForSelector("#password", { timeout: 15000 });

  // Clear and fill the form
  await page.fill("#username", "");
  await page.fill("#username", username);
  await page.fill("#password", "");
  await page.fill("#password", "password");

  console.log(`Filled credentials for ${username}`);

  // Find and click the submit button
  const submitButton = page
    .locator('input[type="submit"], button[type="submit"], #kc-login')
    .first();
  await submitButton.waitFor({ timeout: 10000 });

  console.log("Clicking submit button...");

  // Wait for navigation after clicking submit
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes("login-actions/authenticate"),
      { timeout: 30000 },
    ),
    submitButton.click(),
  ]);

  console.log(`Submit response status: ${response.status()}`);
  console.log(`Current URL after submit: ${page.url()}`);

  // Wait for redirect back to the app - be more flexible with the URL pattern
  try {
    await page.waitForURL(
      (url) =>
        url.toString().includes("localhost:5173") &&
        !url.toString().includes("keycloak"),
      { timeout: 45000 },
    );
  } catch (error) {
    console.log(`Failed to redirect back to app. Current URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);

    // Check if there's an error on the page
    const errorElement = page.locator(
      ".alert-error, .kc-feedback-text, #input-error",
    );
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log(`Login error: ${errorText}`);
    }

    throw error;
  }

  console.log(`Successfully redirected to: ${page.url()}`);

  // Wait for the app to fully load
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.waitForSelector('button:has-text("Create Game")', {
    timeout: 30000,
  });

  console.log(`Login completed successfully for ${username}`);

  return {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    email: `${username}@example.com`,
  };
}

export const test = baseTest.extend<TestFixtures>({
  loginAsUser: async ({ page }, use) => {
    const loginUser = async (username: string): Promise<AuthenticatedUser> => {
      return await performLogin(page, username);
    };
    await use(loginUser);
  },

  createGame: async ({ page }, use) => {
    const createGame = async (
      options: { name?: string; isPublic?: boolean } = {},
    ): Promise<string> => {
      if (!page.url().includes("localhost:5173")) {
        await page.goto("http://localhost:5173/");
      }

      await page.waitForSelector('button:has-text("Create Game")');
      await page.click('button:has-text("Create Game")');
      await page.waitForURL("**/lobby/**");

      const url = page.url();
      const gameIdMatch = url.match(/lobby\/([a-f0-9-]+)/);
      if (!gameIdMatch) {
        throw new Error("Could not extract game ID from URL");
      }

      return gameIdMatch[1];
    };
    await use(createGame);
  },

  goToLobby: async ({ page }, use) => {
    const goToLobby = async (gameId?: string): Promise<void> => {
      if (gameId) {
        await page.goto(`http://localhost:5173/lobby/${gameId}`);
      } else {
        await page.waitForSelector('button:has-text("Create Game")');
        await page.click('button:has-text("Create Game")');
      }
      await page.waitForLoadState("networkidle");
    };
    await use(goToLobby);
  },

  selectScript: async ({ page }, use) => {
    const selectScript = async (scriptName: string): Promise<void> => {
      const scriptSelectors = [
        `button:has-text("${scriptName}")`,
        `.script-item:has-text("${scriptName}")`,
        `[title="${scriptName}"]`,
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

      await page.waitForTimeout(500);
    };
    await use(selectScript);
  },

  loginMultipleUsers: async ({ browser }, use) => {
    const loginMultipleUsers = async (
      count: number,
      options: MultiUserOptions = {},
    ) => {
      const users: AuthenticatedUser[] = [];
      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];
      const playerNames = options.playerNames ?? [];

      for (let i = 1; i <= count; i++) {
        const context = await browser.newContext();

        if (options.mockPTT) {
          await context.addInitScript(injectPTTMocks);
        }

        const playerName = playerNames[i - 1] ?? `Test User ${i}`;
        await context.addInitScript((name: string) => {
          try {
            localStorage.setItem("ashes-of-salem-player-name", name);
          } catch {
            // ignore storage issues in tests
          }
        }, playerName);

        if (options.grantMicrophone) {
          await context.grantPermissions(["microphone"], {
            origin: "http://localhost:3001",
          });
        }

        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);

        const username = `testuser${i}`;
        const user = await performLogin(page, username);
        users.push(user);
      }

      const cleanup = async () => {
        for (const context of contexts) {
          await context.close();
        }
      };

      return { users, contexts, pages, cleanup };
    };

    await use(loginMultipleUsers);
  },
});

export { expect } from "@playwright/test";
