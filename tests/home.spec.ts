import { expect, test } from '../src/fixtures/test.ts';

// Burn-in proof (throwaway pull request, never merged).

test('home page opens through basic auth and shows its heading', { tag: '@smoke' }, async ({ page }) => {
  const response = await page.goto('/');

  // A 401 here means dev's basic-auth credentials are missing or wrong.
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Read it. Hear it. Ask it.');
});
