import { test, type Page } from '@playwright/test';

/**
 * Allowed mocking case "Slow responses" (AGENTS.md): makes matching requests wait before they go to dev, so a test
 * can see what Folio does while something is still loading. The request still reaches dev, and the real answer
 * comes back; only its timing changes.
 */
export async function slowDown(page: Page, url: string | RegExp, delayMs: number): Promise<void> {
  await test.step(
    `slow down ${String(url)} by ${String(delayMs)} ms`,
    () =>
      page.route(url, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        await route.fallback();
      }),
    { box: true },
  );
}

/**
 * The reader's own data loads (bookmarks, highlights, reading place), which come from Folio's server functions.
 * Their names are build hashes, so they are matched as a group.
 */
export const SERVER_FUNCTIONS = /\/_serverFn\//;
