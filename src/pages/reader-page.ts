import { test, type Locator, type Page, type Response } from '@playwright/test';
import { BookPanel } from '../components/book-panel.ts';
import { isPostTo } from '../support/network.ts';

/** The reader: one page of a chapter, at /read/<book>/chapter-<n>. */
export class ReaderPage {
  readonly page: Page;
  readonly panel: BookPanel;
  /** Pressed (`aria-pressed="true"`) when the page on screen is bookmarked. */
  readonly bookmarkButton: Locator;
  /** The chapter's text. */
  readonly text: Locator;
  /**
   * In the toolbar that appears over selected text. The same toolbar has Ask about this, Explain and Translate,
   * which call third-party services: tests never press them (see AGENTS.md).
   */
  readonly noteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = new BookPanel(page.getByRole('complementary', { name: 'Book contents panel' }));
    this.bookmarkButton = page.getByRole('button', { name: 'Bookmark this page' });
    this.text = page.getByRole('article');
    this.noteButton = page.getByRole('button', { name: 'Note', exact: true });
  }

  /** A paragraph of the chapter, by text it contains. */
  paragraph(passage: string): Locator {
    return this.text.getByRole('paragraph').filter({ hasText: passage });
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

  /**
   * Selects a whole paragraph, highlights it with a note, and returns Folio's response once the note is saved.
   * Pressing Note saves the highlight first and opens its note box in the panel's Highlights tab.
   */
  async addNote(passage: string, note: string): Promise<Response> {
    return test.step(
      `add a note to "${passage.slice(0, 30)}…"`,
      async () => {
        await this.paragraph(passage).selectText();
        const highlighted = this.page.waitForResponse(isPostTo('/account/highlights/new'));
        await this.noteButton.click();
        await highlighted;
        await this.panel.noteBox.fill(note);
        const saved = this.page.waitForResponse(isPostTo(/^\/account\/highlights\/(?!new$)[^/]+$/));
        await this.panel.saveNoteButton.click();
        return saved;
      },
      { box: true },
    );
  }
}
