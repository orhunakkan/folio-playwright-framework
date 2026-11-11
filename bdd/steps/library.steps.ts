import { expect, Given, Then, When } from './fixtures.ts';
import type { Book } from './parameter-types.ts';

Given('I am in the library', async ({ libraryPage }) => {
  await libraryPage.open();
});

When('I filter by {string}', async ({ libraryPage }, filter: string) => {
  await libraryPage.filterBy(filter);
});

When('I open {book}', async ({ libraryPage }, book: Book) => {
  await libraryPage.openBook(book.title);
});

When('I start reading', async ({ bookPage }) => {
  await bookPage.startReading();
});

Then('{string} is the only filter selected', async ({ libraryPage }, filter: string) => {
  await expect(libraryPage.selectedFilters).toHaveText([filter]);
});

Then('the library shows at least one book', async ({ libraryPage }) => {
  await expect(libraryPage.books).not.toHaveCount(0);
});
