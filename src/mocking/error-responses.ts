import { test, type Page } from '@playwright/test';
import { EXPECTED_CONSOLE_ERROR } from '../checks/console-errors.ts';

/**
 * Allowed mocking case "Error states in Folio's UI" (AGENTS.md): the next matching request gets an error from the
 * test instead of reaching dev, so a test can see how Folio tells the user. Later requests reach dev as usual.
 * The browser logs the failed load as a console error; it is expected for this test, and noted on it.
 */
export async function failNextRequest(page: Page, url: string | RegExp, status: 500 | 502 | 503): Promise<void> {
  await test.step(`fail the next request to ${String(url)} with ${String(status)}`, () => page.route(url, (route) => route.fulfill({ status, body: 'Failed on purpose by the test' }), { times: 1 }), { box: true });

  test.info().annotations.push({
    type: EXPECTED_CONSOLE_ERROR,
    description: `Failed to load resource: the server responded with a status of ${String(status)}`,
  });
}
