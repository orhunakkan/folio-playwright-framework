import { expect, test } from '../src/fixtures/test.ts';

test('a test user is signed in by cookie and sees their account', { tag: '@smoke' }, async ({ page, testUser }) => {
  await expect(page).toBeSignedIn({ as: testUser.username });

  await page.goto('/account');

  // Signed out, /account sends you to the sign-in page instead.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(testUser.username);
});
