import { test, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from '../support/hydration.ts';

/**
 * The account menu, shown when signed in. Its summary shows the username; opened, it lists Account, My books,
 * Highlights, Flashcards and API keys, then Sign out. Folio renders one in the sidebar and one in the banner and
 * shows the one that fits the screen, so this is the one on screen.
 */
export class AccountMenu {
  readonly page: Page;
  readonly menu: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const signOut = page.getByRole('button', { name: 'Sign out', includeHidden: true });
    this.menu = page.getByRole('group').filter({ has: signOut }).filter({ visible: true });
    this.signOutButton = this.menu.getByRole('button', { name: 'Sign out' });
  }

  async signOut(): Promise<void> {
    await test.step(
      'sign out',
      async () => {
        // Before hydration, a click on the menu is lost, and a sign-out sent then is cut off by the router's first
        // load, which leaves the reader signed in (found 2026-11-11).
        await waitForHydration(this.menu);
        // A closed menu shows only its summary, so a click on the menu opens it.
        await this.menu.click();
        await this.signOutButton.click();
      },
      { box: true },
    );
  }
}
