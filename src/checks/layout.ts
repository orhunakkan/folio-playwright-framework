import type { Page } from '@playwright/test';

/** How many pixels the page is wider than the viewport. 0 means it doesn't scroll sideways. */
export function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
