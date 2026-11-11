import { test, type BrowserContext, type Page } from '@playwright/test';
import { EXPECTED_CONSOLE_ERROR, WENT_OFFLINE } from '../checks/console-errors.ts';

/**
 * Allowed mocking case "Offline and flaky network" (AGENTS.md): the browser context loses its connection, as a
 * device does, once the page's service worker is ready. Pages it then loads come from what Folio stored on the device, or fail. The browser logs each request
 * that can't go out as a console error; those are expected for this test, and noted on it.
 */
export async function goOffline(context: BrowserContext, page: Page): Promise<void> {
  await test.step(
    'go offline',
    async () => {
      // A device that has visited Folio has its service worker, which is what answers once offline.
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
      await context.setOffline(true);
    },
    { box: true },
  );

  test.info().annotations.push({ type: WENT_OFFLINE });
  test.info().annotations.push({
    type: EXPECTED_CONSOLE_ERROR,
    description: 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED',
  });
}

export async function goOnline(context: BrowserContext): Promise<void> {
  await test.step('go back online', () => context.setOffline(false), { box: true });
}
