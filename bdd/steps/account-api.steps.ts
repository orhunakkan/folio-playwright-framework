import type { DataTable } from 'playwright-bdd';
import { readJson } from '../../src/api/folio-api.ts';
import { AccountExportSchema, ErrorSchema } from '../../src/api/schemas.ts';
import { expect, Given, Then, When } from './fixtures.ts';
import type { Book } from './parameter-types.ts';

/** The first words of Pride and Prejudice, chapter 1, page 1, which highlights are made from. */
const FIRST_WORDS = 'It is a tr';

// Folio's own JSON endpoints, through src/api/folio-api.ts. Never attach or print an account export: it holds IP
// addresses.

Given('I have an account and am signed in', async ({ testUser: _signedIn }) => {
  // The fixture creates a test user, signed in by cookie, and deletes it afterwards.
});

// A data table with a header row: one bookmark per row.
When('I save these bookmarks in {book}:', async ({ folioApi, latestResponse }, book: Book, table: DataTable) => {
  for (const { chapter, page } of table.hashes()) {
    latestResponse.keep(await folioApi.createBookmark(book.slug, { chapter: `chapter-${chapter ?? ''}`, page: Number(page) }));
  }
});

// `{word}`: Folio's colours, and ones it doesn't have, so the body is sent as it is rather than typed.
When('I save a {word} highlight', async ({ folioApi, latestResponse }, colour: string) => {
  const highlight = { book: 'pride-and-prejudice', position: { chapter: 'chapter-1', page: 1 }, text: FIRST_WORDS, start: 0, end: FIRST_WORDS.length, color: colour };
  latestResponse.keep(await folioApi.post('/account/highlights/new', highlight));
});

// A doc string with a media type: the body is JSON.
When('I send a new bookmark with this body:', async ({ folioApi, latestResponse }, body: string) => {
  latestResponse.keep(await folioApi.post('/account/bookmarks/new', JSON.parse(body)));
});

Then('my export lists {int} bookmark(s)', async ({ folioApi }, count: number) => {
  const exported = await readJson(await folioApi.exportAccount(), AccountExportSchema);
  expect(exported.bookmarks).toHaveLength(count);
});

Then('Folio answers {int}', ({ latestResponse }, status: number) => {
  expect(latestResponse.get()).toHaveStatus(status);
});

Then('Folio answers {int} with the error {string}', async ({ latestResponse }, status: number, error: string) => {
  const response = latestResponse.get();
  expect(response).toHaveStatus(status);
  expect(await readJson(response, ErrorSchema)).toEqual({ error });
});
