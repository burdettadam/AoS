import { defineConfig } from '@playwright/test';


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
use: {
  // Add navigation timeout
  navigationTimeout: 15000,
  // Add action timeout  
  actionTimeout: 10000
}
});