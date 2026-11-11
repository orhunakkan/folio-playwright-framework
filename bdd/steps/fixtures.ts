import { mergeTests, type APIResponse } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';
import { TestApi, type TestUser } from '../../src/api/test-api.ts';
import { AccountMenu } from '../../src/components/account-menu.ts';
import { test as frameworkTest } from '../../src/fixtures/test.ts';
import { SignInPage } from '../../src/pages/sign-in-page.ts';
import { forgetUser, recordUser } from '../../src/support/run-ledger.ts';

export { expect } from '../../src/fixtures/test.ts';

/**
 * Folio's latest answer in a scenario, so a `When` that sends a request and the `Then` that checks the answer can
 * be separate sentences. Only `When` steps keep one; `Then` steps read it.
 */
export class LatestResponse {
  #response: APIResponse | undefined;

  keep(response: APIResponse): void {
    this.#response = response;
  }

  get(): APIResponse {
    if (this.#response === undefined) throw new Error('No request was sent yet in this scenario: a When step sends one.');
    return this.#response;
  }
}

/**
 * The framework's `test` (page objects, `testUser`, `folioApi`, the console check, redaction), merged with
 * playwright-bdd's own: `createBdd` only takes a `test` that has playwright-bdd's fixtures. Generated tests import
 * this, so every scenario runs with the same fixtures as the specs.
 */
export const test = mergeTests(bddTest, frameworkTest).extend<{
  /**
   * A fresh test account that is NOT signed in, for the sign-in feature only: signing in is its subject, so it
   * signs in with the form (AGENTS.md). Created and deleted like `testUser`, and recorded in the run's ledger, so
   * the cleanup project catches it if this teardown never runs. Every other scenario uses `testUser`.
   */
  signedOutUser: TestUser;
  signInPage: SignInPage;
  accountMenu: AccountMenu;
  latestResponse: LatestResponse;
}>({
  signedOutUser: [
    async ({ request }, use, testInfo) => {
      const testApi = new TestApi(request);
      const user = await testApi.createUser({ plan: 'free', signedIn: false });
      recordUser(user.username);
      testInfo.annotations.push({ type: 'test user', description: user.username });

      await use(user);

      await testApi.deleteUser(user.username);
      forgetUser(user.username);
    },
    // As for `testUser`: time spent queueing for the test API doesn't count against the scenario.
    { timeout: 60_000 },
  ],

  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },

  accountMenu: async ({ page }, use) => {
    await use(new AccountMenu(page));
  },

  latestResponse: async ({}, use) => {
    await use(new LatestResponse());
  },
});

export const { Given, When, Then, BeforeScenario } = createBdd(test);
