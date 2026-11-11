import playwright from '@playwright/test/package.json' with { type: 'json' };

/**
 * The official Playwright image every test run uses, locally and in CI. Its tag follows the installed
 * `@playwright/test`, so the browsers in it always match the library. meta/image.test.ts checks that CI uses it too.
 */
export const IMAGE = `mcr.microsoft.com/playwright:v${playwright.version}-noble`;
