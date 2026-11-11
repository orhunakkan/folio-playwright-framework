import { test, type Locator, type Page, type Response } from '@playwright/test';
import { BookPanel } from '../components/book-panel.ts';
import { ReadAloudPlayer } from '../components/read-aloud-player.ts';
import { isPostTo } from '../support/network.ts';

/** The Folio bug `addNote` works around, as it is noted on a test that hits it. */
export const NOTE_BOX_RACE = 'Pressing Note while the highlights are still loading saves the highlight but never opens its note box (found 2026-11-11).';

/** The reader: one page of a chapter, at /read/<book>/chapter-<n>. */
export class ReaderPage {
  readonly page: Page;
  readonly panel: BookPanel;
  readonly player: ReadAloudPlayer;
  /** Pressed (`aria-pressed="true"`) when the page on screen is bookmarked. */
  readonly bookmarkButton: Locator;
  /** The chapter's text. */
  readonly text: Locator;
  /** The chapter's title, e.g. `Chapter 1`. */
  readonly chapterHeading: Locator;
  /** Messages the reader announces, e.g. `Couldn’t save that. Try again.` */
  readonly notices: Locator;
  /** Turns to the next page of the book. */
  readonly nextPageButton: Locator;
  /**
   * The bar under the text, on every screen size: where the reader is, the chapter's pages, and Next page and
   * Previous page links. Wide screens also have Next page and Previous page buttons beside the text; narrow ones
   * only these links.
   */
  readonly pageNavigation: Locator;
  /** Where the reader is, e.g. `Chapter 1 · Page 1 of 2`. */
  readonly pagePosition: Locator;
  /**
   * Links in the page navigation. On a chapter's last page Next page gives way to the next chapter, and on its first
   * page Previous page to the chapter before (the book's first page has a disabled Start of book instead).
   */
  readonly nextPageLink: Locator;
  readonly previousPageLink: Locator;
  /**
   * In the toolbar that appears over selected text. The same toolbar has Ask about this, Explain and Translate,
   * which call third-party services: tests never press them (see AGENTS.md).
   */
  readonly noteButton: Locator;
  /** In the same toolbar: highlights the selection in yellow, the only colour the reader offers. */
  readonly highlightButton: Locator;
  /** Starts reading the page aloud, with the device's voice. */
  readonly readAloudButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = new BookPanel(page);
    this.player = new ReadAloudPlayer(page);
    this.bookmarkButton = page.getByRole('button', { name: 'Bookmark this page' });
    this.text = page.getByRole('article');
    this.chapterHeading = this.text.getByRole('heading', { level: 1 });
    this.notices = page.getByRole('status');
    this.nextPageButton = page.getByRole('button', { name: 'Next page' });
    this.pageNavigation = page.getByRole('navigation', { name: 'Page navigation' });
    this.pagePosition = this.pageNavigation.getByRole('paragraph');
    this.nextPageLink = this.pageNavigation.getByRole('link', { name: 'Next page' });
    this.previousPageLink = this.pageNavigation.getByRole('link', { name: 'Previous page' });
    this.noteButton = page.getByRole('button', { name: 'Note', exact: true });
    this.highlightButton = page.getByRole('button', { name: 'Highlight', exact: true });
    this.readAloudButton = page.getByRole('button', { name: 'Read aloud', exact: true });
  }

  /** A paragraph of the chapter, by text it contains. */
  paragraph(passage: string): Locator {
    return this.text.getByRole('paragraph').filter({ hasText: passage });
  }

  /** Opens the first page of a chapter. `book` is the book's slug, e.g. `pride-and-prejudice`. */
  async open(book: string, chapter: number): Promise<void> {
    await test.step(`open ${book}, chapter ${String(chapter)}`, () => this.page.goto(`/read/${book}/chapter-${String(chapter)}`), { box: true });
  }

  async turnPage(): Promise<void> {
    await test.step('turn to the next page', () => this.nextPageButton.click(), { box: true });
  }

  /** Turns to the next page with the page navigation, which every screen size has (`turnPage` needs a wide one). */
  async nextPage(): Promise<void> {
    await test.step('go to the next page', () => this.nextPageLink.click(), { box: true });
  }

  /** Turns back a page within the chapter, with the page navigation. */
  async previousPage(): Promise<void> {
    await test.step('go back a page', () => this.previousPageLink.click(), { box: true });
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

  /** Selects a whole paragraph and highlights it, and returns Folio's response once the highlight is saved. */
  async highlight(passage: string): Promise<Response> {
    return test.step(
      `highlight "${passage.slice(0, 30)}…"`,
      async () => {
        await this.paragraph(passage).selectText();
        const saved = this.page.waitForResponse(isPostTo('/account/highlights/new'));
        await this.highlightButton.click();
        return saved;
      },
      { box: true },
    );
  }

  async readAloud(): Promise<void> {
    await test.step('read the page aloud', () => this.readAloudButton.click(), { box: true });
  }

  /**
   * Selects a whole paragraph and presses Note, and returns Folio's response once the highlight is saved. Pressing
   * Note opens the highlight's note box in the panel's Highlights tab (on narrow screens, in the panel's dialog).
   */
  async startNote(passage: string): Promise<Response> {
    return test.step(
      `start a note on "${passage.slice(0, 30)}…"`,
      async () => {
        await this.paragraph(passage).selectText();
        const highlighted = this.page.waitForResponse(isPostTo('/account/highlights/new'));
        await this.noteButton.click();
        return highlighted;
      },
      { box: true },
    );
  }

  /**
   * Highlights a whole paragraph with a note, and returns Folio's response once the note is saved.
   *
   * Works around a Folio bug: when the reader's highlights are still loading as Note is pressed, the note box
   * never opens and the highlight shows "Add note" instead. Then this presses Add note, and notes the bug on the
   * test. `tests/notes.spec.ts` pins the bug; remove this workaround when that test starts to pass.
   */
  async addNote(passage: string, note: string): Promise<Response> {
    return test.step(
      `add a note to "${passage.slice(0, 30)}…"`,
      async () => {
        await this.startNote(passage);
        const addNoteButton = this.panel.highlight(passage).getByRole('button', { name: 'Add note' });
        await this.panel.noteBox.or(addNoteButton).waitFor();
        if (await addNoteButton.isVisible()) {
          test.info().annotations.push({ type: 'known Folio bug', description: NOTE_BOX_RACE });
          await addNoteButton.click();
        }
        await this.panel.noteBox.fill(note);
        const saved = this.page.waitForResponse(isPostTo(/^\/account\/highlights\/(?!new$)[^/]+$/));
        await this.panel.saveNoteButton.click();
        return saved;
      },
      { box: true },
    );
  }
}
