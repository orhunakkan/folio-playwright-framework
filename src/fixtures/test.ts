import { expect as baseExpect, test as base } from '@playwright/test';
import { FolioApi } from '../api/folio-api.ts';
import { TestApi, type CreateUserOptions, type TestUser } from '../api/test-api.ts';
import { scanAccessibility, type AccessibilityViolation } from '../checks/accessibility.ts';
import { watchConsoleErrors } from '../checks/console-errors.ts';
import { readWebVitals, startWebVitals, type WebVitals } from '../checks/web-vitals.ts';
import { FAKER_SEED } from '../config/run.ts';
import { TestData, testSeed } from '../data/test-data.ts';
import { HighlightsPage } from '../pages/highlights-page.ts';
import { HomePage } from '../pages/home-page.ts';
import { LibraryPage } from '../pages/library-page.ts';
import { horizontalOverflow } from '../checks/layout.ts';
import { ReaderPage } from '../pages/reader-page.ts';
import { redactErrors } from '../support/redact.ts';
import { matchers } from '../support/matchers.ts';
import { forgetUser, recordUser } from '../support/run-ledger.ts';

/**
 * Playwright's `expect`, with the framework's domain matchers (src/support/matchers.ts): `toBeSignedIn()`,
 * `toHaveStatus()`, `toMatchSchema()` and `toBeWithinBudgets()`.
 */
export const expect = baseExpect.extend(matchers);

export type TestUserOptions = Pick<CreateUserOptions, 'plan' | 'starter'>;

interface Fixtures {
  /** Options for `testUser`. Set them per file or per describe with `test.use({ testUserOptions: { … } })`. */
  testUserOptions: TestUserOptions;
  /**
   * A fresh test account, already signed in in this test's browser context, and deleted after the test.
   * A test that only needs the session, not the user's details, requests it as `testUser: _signedIn`.
   */
  testUser: TestUser;

  /**
   * Folio's own JSON endpoints, through this test's browser context: signed in when the test also requests
   * `testUser`. `visitorApi` calls them as a signed-out visitor, with its own cookie jar.
   */
  folioApi: FolioApi;
  visitorApi: FolioApi;

  /** Seeded factories for the data a test types into Folio, each value prefixed with the run ID. */
  testData: TestData;

  homePage: HomePage;
  libraryPage: LibraryPage;
  readerPage: ReaderPage;
  highlightsPage: HighlightsPage;

  /** Scans the page as it is now (WCAG 2.2 AA). Assert `expect(await scanAccessibility()).toEqual([])`. */
  scanAccessibility: () => Promise<AccessibilityViolation[]>;
  /**
   * Web vitals of the page on screen (Chromium only): `start()` once it has loaded, interact, then `read()`, which
   * records them on the test. Assert `expect(vitals).toBeWithinBudgets()`.
   */
  webVitals: { start: () => Promise<void>; read: () => Promise<WebVitals> };
  /** Pixels the page is wider than the viewport. Assert `await expect.poll(horizontalOverflow).toBe(0)`. */
  horizontalOverflow: () => Promise<number>;
}

/** The one module specs import `test` and `expect` from. */
export const test = base.extend<Fixtures>({
  // Playwright's own `context`, extended: a test fails if any of its pages logged a console error or threw an
  // uncaught error. Every test with a page has a context, so every such test is checked; tests that only make
  // HTTP requests (`@http`) don't start a browser for it. On the context, not the page, so popups count too.
  context: [
    async ({ context }, use, testInfo) => {
      // `context.request` (also `page.request`) makes API calls, e.g. to the test API: keep its errors safe to print.
      redactErrors(context.request);
      const unexpectedErrors = watchConsoleErrors(context, testInfo);
      await use(context);
      expect(unexpectedErrors(), 'console errors or page errors').toEqual([]);
    },
    { scope: 'test', title: 'check for console and page errors' },
  ],

  // Playwright's own `request`, with errors that never print dev's credentials or the test API token.
  request: async ({ request }, use) => {
    await use(redactErrors(request));
  },

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

  folioApi: async ({ context }, use) => {
    await use(new FolioApi(context.request));
  },

  visitorApi: async ({ request }, use) => {
    await use(new FolioApi(request));
  },

  testData: async ({}, use, testInfo) => {
    const seed = testSeed(FAKER_SEED, testInfo.testId, testInfo.repeatEachIndex);
    testInfo.annotations.push({ type: 'faker seed', description: `FAKER_SEED=${String(FAKER_SEED)}` });
    await use(new TestData(seed));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  libraryPage: async ({ page }, use) => {
    await use(new LibraryPage(page));
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

  webVitals: async ({ page }, use, testInfo) => {
    await use({ start: () => startWebVitals(page), read: () => readWebVitals(page, testInfo) });
  },

  horizontalOverflow: async ({ page }, use) => {
    await use(() => horizontalOverflow(page));
  },
});
