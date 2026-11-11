import { defineConfig, devices } from '@playwright/test';
import { DEV_URL, env } from './src/config/env.ts';
import { RUN_ID } from './src/config/run.ts';

/**
 * Every browser spec runs in each of these. Phone and tablet are narrow enough that the reader hides its side panel
 * behind the Contents button. No WebKit for now: in Playwright 1.65 it never answers dev's basic-auth challenge
 * while `httpCredentials.origin` is set, and that guard stays (see the blueprint's "Decided: devices and browsers").
 */
const BROWSER_PROJECTS: { name: string; device: keyof typeof devices }[] = [
  { name: 'chromium', device: 'Desktop Chrome' },
  { name: 'firefox', device: 'Desktop Firefox' },
  { name: 'phone', device: 'Pixel 7' },
  { name: 'tablet', device: 'Galaxy Tab S9' },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.CI,
  retries: env.CI ? 2 : 0,
  // In CI, `github` turns failures into annotations on the pull request.
  reporter: env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  // Explicit timeouts, so behaviour doesn't drift with Playwright's defaults.
  timeout: 30_000,
  globalTimeout: env.CI ? 20 * 60_000 : 0,
  expect: { timeout: 5_000 },

  // Shown in the HTML report, so the data a run made on dev can be traced to it.
  metadata: { runId: RUN_ID },

  use: {
    baseURL: DEV_URL,
    // Dev sits behind basic auth. `origin` keeps the credentials from being sent to any other host.
    httpCredentials: {
      username: env.DEV_BASIC_USER,
      password: env.DEV_BASIC_PASS,
      origin: DEV_URL,
      // Up front, not after a 401 challenge: under parallel load the retry after the challenge sometimes hung
      // until it timed out. `origin` still limits them to dev.
      send: 'always',
    },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Traces record request headers, including dev's basic-auth header and the test API token, and Playwright
    // can't redact them. CI artifacts of a public repository are downloadable by anyone, so CI records none.
    // Screenshots, video and error context still explain a CI failure. meta/config.test.ts guards this.
    trace: env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Runs first: clears test users that earlier runs left behind. Its teardown, `cleanup`, runs last.
    { name: 'setup', testMatch: /\.setup\.ts$/, teardown: 'cleanup' },
    // Deletes any test user this run created and didn't delete, e.g. after a fixture teardown timed out.
    { name: 'cleanup', testMatch: /\.teardown\.ts$/ },
    // HTTP-level checks (`@http`), such as security headers. They don't depend on the browser or the screen,
    // so they run once, here, and the browser projects leave them out.
    { name: 'http', grep: /@http/, dependencies: ['setup'] },
    ...BROWSER_PROJECTS.map(({ name, device }) => ({
      name,
      use: { ...devices[device] },
      grepInvert: /@http/,
      dependencies: ['setup'],
    })),
  ],
});
