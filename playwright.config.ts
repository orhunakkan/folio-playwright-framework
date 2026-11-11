import { defineConfig, devices } from '@playwright/test';
import { DEV_URL, env } from './src/config/env.ts';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.CI,
  retries: env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  // Explicit timeouts, so behaviour doesn't drift with Playwright's defaults.
  timeout: 30_000,
  globalTimeout: env.CI ? 20 * 60_000 : 0,
  expect: { timeout: 5_000 },

  use: {
    baseURL: DEV_URL,
    // Dev sits behind basic auth. `origin` keeps the credentials from being sent to any other host.
    httpCredentials: {
      username: env.DEV_BASIC_USER,
      password: env.DEV_BASIC_PASS,
      origin: DEV_URL,
    },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
