import { test, type Locator, type Page, type Response } from '@playwright/test';
import { BookPanel } from '../components/book-panel.ts';
import { isPostTo } from '../support/network.ts';

/** The reader: one page of a chapter, at /read/<book>/chapter-<n>. */
export class ReaderPage {
  readonly page: Page;
  readonly panel: BookPanel;
  /** Pressed (`aria-pressed="true"`) when the page on screen is bookmarked. */
  readonly bookmarkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = new BookPanel(page.getByRole('complementary', { name: 'Book contents panel' }));
    this.bookmarkButton = page.getByRole('button', { name: 'Bookmark this page' });
  }

  /** Opens the first page of a chapter. `book` is the book's slug, e.g. `pride-and-prejudice`. */
  async open(book: string, chapter: number): Promise<void> {
    await test.step(
      `open ${book}, chapter ${String(chapter)}`,
      () => this.page.goto(`/read/${book}/chapter-${String(chapter)}`),
      {
        box: true,
      },
    );
  }

  /**
   * Bookmarks the page on screen, and returns Folio's response once the bookmark is saved.
   * The button shows pressed before the save finishes, so wait for this before reloading or leaving.
   */
  async bookmarkThisPage(): Promise<Response> {
    return test.step(
      'bookmark this page',
      async () => {
        const saved = this.page.waitForResponse(isPostTo('/account/bookmarks/new'));
        await this.bookmarkButton.click();
        return saved;
      },
      { box: true },
    );
  }
}
