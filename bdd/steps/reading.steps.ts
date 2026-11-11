import type { DataTable } from 'playwright-bdd';
import { expect, Given, Then, When } from './fixtures.ts';
import type { Book, Direction } from './parameter-types.ts';

// The same sentence as a Given and a Then (`matchKeywords` in playwright.bdd.config.ts): the Given opens the
// chapter, the Then checks the reader shows it.
Given('I am reading chapter {int} of {book}', async ({ readerPage }, chapter: number, book: Book) => {
  await readerPage.open(book.slug, chapter);
});

When('I open chapter {int} of {book}', async ({ readerPage }, chapter: number, book: Book) => {
  await readerPage.open(book.slug, chapter);
});

// `{int}`, optional text and a custom parameter type: "I turn 1 page forward", "I turn 3 pages back".
When('I turn {int} page(s) {direction}', async ({ readerPage }, pages: number, direction: Direction) => {
  for (let turned = 0; turned < pages; turned++) {
    await (direction === 'forward' ? readerPage.nextPage() : readerPage.previousPage());
  }
});

When('I open Contents', async ({ readerPage }) => {
  await readerPage.panel.showContents();
});

When('I go to chapter {int} from Contents', async ({ readerPage }, chapter: number) => {
  await readerPage.panel.goToChapter(chapter);
});

Then('I am reading chapter {int} of {book}', async ({ page, readerPage }, chapter: number, book: Book) => {
  await expect(page).toHaveURL(`/read/${book.slug}/chapter-${String(chapter)}`);
  await expect(readerPage.chapterHeading).toHaveText(`Chapter ${String(chapter)}`);
});

Then('I see the first page again', async ({ readerPage }) => {
  await expect(readerPage.pagePosition).toContainText(/Page 1 of \d+$/);
});

// A plain-list data table: one chapter per row, in the order Contents lists them.
Then('the chapters begin:', async ({ readerPage }, table: DataTable) => {
  const expected = table.raw().flat();
  // Each link reads its number, then its title (`02 Chapter 2`); the table names the titles.
  const titles = async () => (await readerPage.panel.chapters.allInnerTexts()).slice(0, expected.length).map((text) => text.replace(/^\d+\s*/, ''));
  await expect.poll(titles).toEqual(expected);
});
