import { defineConfig } from '@playwright/test';

// Config for `playwright merge-reports` in CI's report job, which merges the shards' blob reports into one HTML
// report. It only needs the reporter and the test folder. It isn't playwright.config.ts, which loads the secrets.
export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never', title: 'Folio e2e tests on dev' }]],
});
