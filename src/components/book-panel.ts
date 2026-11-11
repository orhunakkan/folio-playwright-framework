import { test, type Locator, type Response } from '@playwright/test';
import { isPostTo } from '../support/network.ts';

/** The reader's side panel ("Book contents panel"), with its Contents, Highlights and Bookmarks tabs. */
export class BookPanel {
  readonly bookmarksTab: Locator;
  /** One entry per bookmark, in the Bookmarks tab. */
  readonly bookmarks: Locator;

  constructor(root: Locator) {
    this.bookmarksTab = root.getByRole('tab', { name: 'Bookmarks' });
    this.bookmarks = root.getByRole('tabpanel', { name: 'Bookmarks' }).getByRole('listitem');
  }

  /** A bookmark's entry, by the place it marks as the panel shows it, e.g. `Ch. 1 · p. 1`. */
  bookmark(place: string): Locator {
    return this.bookmarks.filter({ hasText: place });
  }

  async showBookmarks(): Promise<void> {
    await test.step('show bookmarks', () => this.bookmarksTab.click(), { box: true });
  }

  async goToBookmark(place: string): Promise<void> {
    await test.step(`go to bookmark ${place}`, () => this.bookmark(place).getByRole('link').click(), { box: true });
  }

  /** Removes a bookmark, and returns Folio's response once the removal is saved. */
  async removeBookmark(place: string): Promise<Response> {
    return test.step(
      `remove bookmark ${place}`,
      async () => {
        const page = this.bookmarksTab.page();
        const saved = page.waitForResponse(isPostTo(/^\/account\/bookmarks\/(?!new$)[^/]+$/));
        await this.bookmark(place).getByRole('button', { name: 'Remove bookmark' }).click();
        return saved;
      },
      { box: true },
    );
  }
}
