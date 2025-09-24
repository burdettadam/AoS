import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/ui',
  snapshotPathTemplate: '{testDir}/__screenshots__/baseline/{arg}{ext}',
  reporter: [['list']],
  // Reduce workers to avoid race conditions with authentication state
  workers: 1,
  // Add retry for flaky tests  
  retries: 2,
  // Increase timeout for stability
  timeout: 60000,
  // Configure global test timeout
  globalTimeout: 5 * 60 * 1000,
  use: {
    // Base URL for tests (Docker Compose client)
    baseURL: 'http://localhost:5173',
    // Add navigation timeout
    navigationTimeout: 15000,
    // Add action timeout  
    actionTimeout: 10000,
    // Screenshots on failure
    screenshot: 'only-on-failure',
    // Video capture on failure
    video: 'retain-on-failure'
  },
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Global setup and teardown for Docker Compose
  globalSetup: require.resolve('./tests/ui/global-setup.ts'),
  globalTeardown: require.resolve('./tests/ui/global-teardown.ts'),
});