/**
 * The one module specs import `test` and `expect` from. It only re-exports Playwright's for now;
 * custom fixtures (test users, page objects) are added here, so specs keep the same import.
 */
export { expect, test } from '@playwright/test';
