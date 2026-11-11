import { test as base } from '@playwright/test';
import { TestApi, type CreateUserOptions, type TestUser } from '../api/test-api.ts';

export { expect } from '@playwright/test';

export type TestUserOptions = Pick<CreateUserOptions, 'plan' | 'starter'>;

interface Fixtures {
  /** Options for `testUser`. Set them per file or per describe with `test.use({ testUserOptions: { … } })`. */
  testUserOptions: TestUserOptions;
  /** A fresh test account, already signed in in this test's browser context, and deleted after the test. */
  testUser: TestUser;
}

/** The one module specs import `test` and `expect` from. */
export const test = base.extend<Fixtures>({
  testUserOptions: [{}, { option: true }],

  testUser: async ({ context, testUserOptions }, use, testInfo) => {
    // `context.request` shares the browser context's cookie jar, so the session cookie that
    // `signedIn: true` sets lands straight in the browser: the user is signed in without the form.
    const testApi = new TestApi(context.request);
    // Dev makes Pro users when no plan is given. Default to Free, so a test that needs Pro says so.
    const user = await testApi.createUser({ plan: 'free', ...testUserOptions, signedIn: true });
    testInfo.annotations.push({ type: 'test user', description: user.username });

    await use(user);

    // Runs whether the test passed or failed.
    await testApi.deleteUser(user.username);
  },
});
