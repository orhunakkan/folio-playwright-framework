import { test, type Locator, type Page, type Response } from '@playwright/test';
import { isPostTo } from '../support/network.ts';

/**
 * The reader's book contents panel, with its Contents, Highlights and Bookmarks tabs. On wide screens it sits beside
 * the text. On narrower ones (phones, tablets) it is hidden, and the Contents button opens it as a dialog; the
 * `show…` methods open it first when it's hidden.
 */
export class BookPanel {
  readonly page: Page;
  /** The panel as it is on screen: beside the text, or the dialog. */
  readonly root: Locator;
  /** Only on screens too narrow for the panel: opens it as a dialog. */
  readonly openButton: Locator;
  readonly bookmarksTab: Locator;
  /** One entry per bookmark, in the Bookmarks tab. */
  readonly bookmarks: Locator;
  /** Named `Highlights <count>` once there are highlights, e.g. `Highlights 1`. */
  readonly highlightsTab: Locator;
  /**
   * One entry per highlight on the page on screen, in the Highlights tab. Each starts with its colour, e.g.
   * `Yellow highlight:`, read out to screen readers.
   */
  readonly highlights: Locator;
  /** The note box of the highlight being noted, and its Save button. */
  readonly noteBox: Locator;
  readonly saveNoteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole('complementary', { name: 'Book contents panel' }).or(page.getByRole('dialog', { name: 'Contents' }));
    this.openButton = page.getByRole('button', { name: 'Contents', exact: true });
    this.bookmarksTab = this.root.getByRole('tab', { name: 'Bookmarks' });
    this.bookmarks = this.root.getByRole('tabpanel', { name: 'Bookmarks' }).getByRole('listitem');
    this.highlightsTab = this.root.getByRole('tab', { name: /^Highlights/ });
    const highlightsPanel = this.root.getByRole('tabpanel', { name: /^Highlights/ });
    this.highlights = highlightsPanel.getByRole('listitem');
    this.noteBox = highlightsPanel.getByRole('textbox', { name: 'Note' });
    this.saveNoteButton = highlightsPanel.getByRole('button', { name: 'Save' });
  }

  /** A highlight's entry, by the passage it highlights. */
  highlight(passage: string): Locator {
    return this.highlights.filter({ hasText: passage });
  }

  /** A highlight's note, shown as `Note: <text>`. */
  note(passage: string): Locator {
    return this.highlight(passage)
      .getByRole('paragraph')
      .filter({ hasText: /^Note: / });
  }

  /** A bookmark's entry, by the place it marks as the panel shows it, e.g. `Ch. 1 · p. 1`. */
  bookmark(place: string): Locator {
    return this.bookmarks.filter({ hasText: place });
  }

  /**
   * Opens the panel if the screen is too narrow to show it. Which layout the reader uses is decided by CSS, so it is
   * settled once the reader has rendered. A no-op on wide screens, and when the dialog is already open (pressing
   * Note opens it).
   */
  async open(): Promise<void> {
    // Wait for the reader to show one layout or the other: right after a reload, neither may be on screen yet.
    await this.page.getByRole('complementary', { name: 'Book contents panel' }).or(this.openButton).filter({ visible: true }).waitFor();
    if (!(await this.openButton.isVisible())) return;
    if ((await this.openButton.getAttribute('aria-expanded')) === 'true') return;

    await test.step('open the book contents panel', () => this.openButton.click(), { box: true });
  }

  async showBookmarks(): Promise<void> {
    await test.step(
      'show bookmarks',
      async () => {
        await this.open();
        await this.bookmarksTab.click();
      },
      { box: true },
    );
  }

  async showHighlights(): Promise<void> {
    await test.step(
      'show highlights',
      async () => {
        await this.open();
        await this.highlightsTab.click();
      },
      { box: true },
    );
  }

  async goToBookmark(place: string): Promise<void> {
    await test.step(`go to bookmark ${place}`, () => this.bookmark(place).getByRole('link').click(), { box: true });
  }

  /** Deletes a highlight from the Highlights tab, and returns Folio's response once the deletion is saved. */
  async deleteHighlight(passage: string): Promise<Response> {
    return test.step(
      `delete the highlight "${passage.slice(0, 30)}…"`,
      async () => {
        const saved = this.page.waitForResponse(isPostTo(/^\/account\/highlights\/(?!new$)[^/]+$/));
        await this.highlight(passage).getByRole('button', { name: 'Delete' }).click();
        return saved;
      },
      { box: true },
    );
  }

  /** Removes a bookmark, and returns Folio's response once the removal is saved. */
  async removeBookmark(place: string): Promise<Response> {
    return test.step(
      `remove bookmark ${place}`,
      async () => {
        const saved = this.page.waitForResponse(isPostTo(/^\/account\/bookmarks\/(?!new$)[^/]+$/));
        await this.bookmark(place).getByRole('button', { name: 'Remove bookmark' }).click();
        return saved;
      },
      { box: true },
    );
  }
}
