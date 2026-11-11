import { expect, test as base } from '@playwright/test';
import { TestApi, type CreateUserOptions, type TestUser } from '../api/test-api.ts';
import { scanAccessibility, type AccessibilityViolation } from '../checks/accessibility.ts';
import { watchConsoleErrors } from '../checks/console-errors.ts';
import { FAKER_SEED } from '../config/run.ts';
import { TestData, testSeed } from '../data/test-data.ts';
import { HighlightsPage } from '../pages/highlights-page.ts';
import { horizontalOverflow } from '../checks/layout.ts';
import { ReaderPage } from '../pages/reader-page.ts';
import { forgetUser, recordUser } from '../support/run-ledger.ts';

export { expect } from '@playwright/test';

export type TestUserOptions = Pick<CreateUserOptions, 'plan' | 'starter'>;

interface Fixtures {
  /** Options for `testUser`. Set them per file or per describe with `test.use({ testUserOptions: { … } })`. */
  testUserOptions: TestUserOptions;
  /**
   * A fresh test account, already signed in in this test's browser context, and deleted after the test.
   * A test that only needs the session, not the user's details, requests it as `testUser: _signedIn`.
   */
  testUser: TestUser;

  /** Seeded factories for the data a test types into Folio, each value prefixed with the run ID. */
  testData: TestData;

  readerPage: ReaderPage;
  highlightsPage: HighlightsPage;

  /** Scans the page as it is now (WCAG 2.2 AA). Assert `expect(await scanAccessibility()).toEqual([])`. */
  scanAccessibility: () => Promise<AccessibilityViolation[]>;
  /** Pixels the page is wider than the viewport. Assert `await expect.poll(horizontalOverflow).toBe(0)`. */
  horizontalOverflow: () => Promise<number>;

  /** Automatic: fails the test if any page logged a console error or threw an uncaught error. */
  noConsoleErrors: undefined;
}

/** The one module specs import `test` and `expect` from. */
export const test = base.extend<Fixtures>({
  testUserOptions: [{}, { option: true }],

  testUser: [
    async ({ context, testUserOptions }, use, testInfo) => {
      // `context.request` shares the browser context's cookie jar, so the session cookie that
      // `signedIn: true` sets lands straight in the browser: the user is signed in without the form.
      const testApi = new TestApi(context.request);
      // Dev makes Pro users when no plan is given. Default to Free, so a test that needs Pro says so.
      const user = await testApi.createUser({ plan: 'free', ...testUserOptions, signedIn: true });
      // In the run's ledger until it is deleted, so the cleanup project can catch it if this teardown never runs.
      recordUser(user.username);
      testInfo.annotations.push({ type: 'test user', description: user.username });

      await use(user);

      // Runs whether the test passed or failed.
      await testApi.deleteUser(user.username);
      forgetUser(user.username);
    },
    // Its own timeout, so time spent queueing for the test API doesn't count against the test's 30 s.
    { timeout: 60_000 },
  ],

  testData: async ({}, use, testInfo) => {
    const seed = testSeed(FAKER_SEED, testInfo.testId, testInfo.repeatEachIndex);
    testInfo.annotations.push({ type: 'faker seed', description: `FAKER_SEED=${String(FAKER_SEED)}` });
    await use(new TestData(seed));
  },

  readerPage: async ({ page }, use) => {
    await use(new ReaderPage(page));
  },

  highlightsPage: async ({ page }, use) => {
    await use(new HighlightsPage(page));
  },

  scanAccessibility: async ({ page }, use, testInfo) => {
    await use(() => scanAccessibility(page, testInfo));
  },

  horizontalOverflow: async ({ page }, use) => {
    await use(() => horizontalOverflow(page));
  },

  noConsoleErrors: [
    async ({ context }, use, testInfo) => {
      // On the context, not the page, so popups and extra pages are watched too.
      const unexpectedErrors = watchConsoleErrors(context, testInfo);
      await use(undefined);
      expect(unexpectedErrors(), 'console errors or page errors').toEqual([]);
    },
    { auto: true, title: 'check for console and page errors' },
  ],
});
