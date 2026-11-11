import { goOffline } from '../../src/mocking/offline.ts';
import { expect, Given, Then, When } from './fixtures.ts';
import type { Book } from './parameter-types.ts';

Given('I have downloaded {book} for offline', async ({ bookPage }, book: Book) => {
  await bookPage.open(book.path);
  await bookPage.downloadForOffline();
});

// AGENTS.md's "Offline and flaky network" case, through src/mocking/.
When('I lose my connection', async ({ context, page }) => {
  await goOffline(context, page);
});

When('I remove the download', async ({ bookPage }) => {
  await bookPage.removeDownload();
});

Then('I can download it for offline again', async ({ bookPage }) => {
  await expect(bookPage.downloadButton).toBeVisible();
  await expect(bookPage.removeDownloadButton).toBeHidden();
});
