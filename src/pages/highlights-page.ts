import { test, type Locator, type Page } from '@playwright/test';

/** Account → Highlights for one book, at /account/highlights?book=<book>: every highlight and note, by chapter. */
export class HighlightsPage {
  readonly page: Page;
  /** The book's title. */
  readonly heading: Locator;
  /** One entry per highlight. */
  readonly highlights: Locator;

  constructor(page: Page) {
    this.page = page;
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1 });
    this.highlights = main.getByRole('listitem');
  }

  /** A highlight's entry, by the passage it highlights. */
  highlight(passage: string): Locator {
    return this.highlights.filter({ has: this.page.getByRole('blockquote').filter({ hasText: passage }) });
  }

  /** A highlight's note, shown as `Note: <text>`. */
  note(passage: string): Locator {
    return this.highlight(passage)
      .getByRole('paragraph')
      .filter({ hasText: /^Note: / });
  }

  /** Opens the highlights of one book. `book` is the book's slug, e.g. `pride-and-prejudice`. */
  async open(book: string): Promise<void> {
    await test.step(`open highlights of ${book}`, () => this.page.goto(`/account/highlights?book=${book}`), {
      box: true,
    });
  }
}
