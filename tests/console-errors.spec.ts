import { expect, test } from '../src/fixtures/test.ts';

// Proves the automatic `noConsoleErrors` fixture works. Each page here is broken on purpose, so each test must fail;
// `test.fail` turns that expected failure into a pass. If the fixture ever stops catching errors, these tests
// "unexpectedly pass" and the run goes red. The pages are local (`setContent`), so nothing on dev is touched.
test.describe('Console error check', { tag: '@regression' }, () => {
  test('fails a test whose page logs a console error', async ({ page }) => {
    test.fail(true, 'The page logs a console error, so the noConsoleErrors fixture must fail this test');
    const logged = page.waitForEvent('console');

    await page.setContent('<script>console.error("deliberate console error")</script>');

    expect((await logged).text()).toBe('deliberate console error');
  });

  test('fails a test whose page throws an uncaught error', async ({ page }) => {
    test.fail(true, 'The page throws an uncaught error, so the noConsoleErrors fixture must fail this test');
    const thrown = page.waitForEvent('pageerror');

    await page.setContent('<script>throw new Error("deliberate page error")</script>');

    expect((await thrown).message).toBe('deliberate page error');
  });
});
