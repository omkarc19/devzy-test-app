const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.SANDBOX_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // Record video for every test. Devzy picks the demo-flow recording for the
    // PR preview; other recordings are harmless leftovers in test-results/.
    video: {
      mode: 'on',
      size: { width: 800, height: 600 },
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 800, height: 600 } } },
  ],
});
