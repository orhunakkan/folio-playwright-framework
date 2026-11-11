import type { Locator } from '@playwright/test';

/**
 * Waits until React has hydrated an element that the server rendered. Until then it looks ready but isn't: a click
 * can be lost (found on dev, 2026-11-11, with the account menu). Nothing on screen shows when hydration is done;
 * React keeps its props on each element it has hydrated, so this waits for those.
 */
export async function waitForHydration(element: Locator): Promise<void> {
  await element.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (Object.keys(node).some((key) => key.startsWith('__reactProps'))) resolve();
          else requestAnimationFrame(check);
        };
        check();
      }),
  );
}
