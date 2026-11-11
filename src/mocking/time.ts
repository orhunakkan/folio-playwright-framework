import { test, type Page } from '@playwright/test';

/**
 * Allowed mocking case "Time" (AGENTS.md): the page's clock, so a test can let minutes of read-aloud pass in
 * moments. Install it before the page loads; time still flows on its own until a test moves it.
 */
export async function installClock(page: Page): Promise<void> {
  await test.step('take control of the page clock', () => page.clock.install(), { box: true });
}

/**
 * Lets `ms` of page time pass, ten seconds at a time, with a moment between for the page's promises and requests,
 * which a single long jump would starve.
 */
export async function letTimePass(page: Page, ms: number): Promise<void> {
  await test.step(
    `let ${String(ms / 1000)} s pass`,
    async () => {
      for (let passed = 0; passed < ms; passed += 10_000) {
        await page.clock.runFor(Math.min(10_000, ms - passed));
        // A real pause, on the test's side: the page's own timers and animation frames are the fake clock's.
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    },
    { box: true },
  );
}
