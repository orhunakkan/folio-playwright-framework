import { test, type Locator, type Page } from '@playwright/test';

/** A book's page in the library, at /library/<series>/<book>: its details, and what you can do with it. */
export class BookPage {
  readonly page: Page;
  readonly heading: Locator;
  /** Saves the whole book on this device, to read offline. */
  readonly downloadButton: Locator;
  /** Shown instead of Download for offline once the book is on the device. */
  readonly removeDownloadButton: Locator;
  /** Opens the book's first chapter in the reader. */
  readonly startReadingLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('main').getByRole('heading', { level: 1 });
    this.downloadButton = page.getByRole('button', { name: 'Download for offline' });
    this.removeDownloadButton = page.getByRole('button', { name: 'Remove download' });
    this.startReadingLink = page.getByRole('link', { name: 'Start reading' });
  }

  /** `path` is the book's place in the library, e.g. `jane-austen/pride-and-prejudice`. */
  async open(path: string): Promise<void> {
    await test.step(`open the book page ${path}`, () => this.page.goto(`/library/${path}`), { box: true });
  }

  async startReading(): Promise<void> {
    await test.step('start reading', () => this.startReadingLink.click(), { box: true });
  }

  /** Removes the book from the device. Folio asks for no confirmation; Download for offline comes back. */
  async removeDownload(): Promise<void> {
    await test.step('remove the offline download', () => this.removeDownloadButton.click(), { box: true });
  }

  /** Downloads the book for offline reading, and waits until it is on the device. */
  async downloadForOffline(): Promise<void> {
    await test.step(
      'download the book for offline reading',
      async () => {
        await this.downloadButton.click();
        await this.removeDownloadButton.waitFor({ timeout: 30_000 });
      },
      { box: true },
    );
  }
}
