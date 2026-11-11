import { test, type Locator, type Page } from '@playwright/test';

/** The home page, at /: what Folio is, its pricing and questions. Signed out. */
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  /**
   * Parts that change without a change to the page's design: how many founding-member places are left, and the
   * copyright year. Visual tests mask them.
   */
  readonly changingParts: Locator[];

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.changingParts = [
      page.getByRole('paragraph').filter({ hasText: /^Founding members:/ }),
      page.getByRole('contentinfo').getByRole('paragraph').filter({ hasText: /^©/ }),
    ];
  }

  async open(): Promise<void> {
    await test.step('open the home page', () => this.page.goto('/'), { box: true });
  }
}
