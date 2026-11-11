import { readJson } from '../src/api/folio-api.ts';
import {
  AccountExportSchema,
  BookmarkCreatedSchema,
  ErrorSchema,
  HighlightSavedSchema,
  ManifestSchema,
  OkSchema,
  SyncedSchema,
} from '../src/api/schemas.ts';
import { expect, test } from '../src/fixtures/test.ts';

const BOOK = 'pride-and-prejudice';
const FIRST_SENTENCE =
  'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.';

// Folio's own JSON endpoints, the ones the reader calls, checked against their schemas (src/api/schemas.ts).
// Never attach or print an account export: it holds IP addresses.
test.describe('Account API', { tag: ['@regression', '@api'] }, () => {
  test('the health check and app manifest answer', async ({ visitorApi }) => {
    const health = await visitorApi.health();
    const manifest = await visitorApi.manifest();

    expect(health.status()).toBe(200);
    expect(await health.text()).toBe('ok');
    expect(manifest.status()).toBe(200);
    expect(manifest.headers()['content-type']).toContain('application/manifest+json');
    await readJson(manifest, ManifestSchema);
  });

  test('a bookmark is saved, exported and removed', async ({ folioApi, testUser: _signedIn }) => {
    const created = await folioApi.createBookmark(BOOK, { chapter: 'chapter-1', page: 1 });

    expect(created.status()).toBe(201);
    const { bookmark } = await readJson(created, BookmarkCreatedSchema);
    expect(bookmark.place).toMatchObject({ chapter: 'chapter-1', page: 1, label: 'Ch. 1 · p. 1' });

    const exported = await readJson(await folioApi.exportAccount(), AccountExportSchema);
    expect(exported.bookmarks).toEqual([
      expect.objectContaining({ book: { slug: BOOK, title: 'Pride and Prejudice' }, chapter: 'chapter-1', page: 1 }),
    ]);

    const removed = await folioApi.deleteBookmark(bookmark.id);

    expect(removed.status()).toBe(200);
    await readJson(removed, OkSchema);
    expect((await readJson(await folioApi.exportAccount(), AccountExportSchema)).bookmarks).toEqual([]);
  });

  test('a highlight is saved, noted, exported and removed', async ({ folioApi, testData, testUser: _signedIn }) => {
    const note = testData.note();
    const created = await folioApi.createHighlight({
      book: BOOK,
      position: { chapter: 'chapter-1', page: 1 },
      text: FIRST_SENTENCE,
      start: 0,
      end: FIRST_SENTENCE.length,
      color: 'green',
    });

    expect(created.status()).toBe(201);
    const { highlight } = await readJson(created, HighlightSavedSchema);
    expect(highlight).toMatchObject({ color: 'green', note: null, text: FIRST_SENTENCE });

    const noted = await folioApi.noteHighlight(highlight.id, note);

    expect(noted.status()).toBe(200);
    expect((await readJson(noted, HighlightSavedSchema)).highlight).toMatchObject({ id: highlight.id, note });
    const exported = await readJson(await folioApi.exportAccount(), AccountExportSchema);
    expect(exported.highlights).toEqual([expect.objectContaining({ text: FIRST_SENTENCE, color: 'green', note })]);

    const removed = await folioApi.deleteHighlight(highlight.id);

    expect(removed.status()).toBe(200);
    await readJson(removed, OkSchema);
    expect((await readJson(await folioApi.exportAccount(), AccountExportSchema)).highlights).toEqual([]);
  });

  test('the reading place is synced and exported', async ({ folioApi, testUser: _signedIn }) => {
    const synced = await folioApi.syncReadingPlace(BOOK, { chapter: 'chapter-2', page: 1 }, Date.now());

    expect(synced.status()).toBe(200);
    expect(await readJson(synced, SyncedSchema)).toEqual({ ok: true, skipped: 0 });
    const exported = await readJson(await folioApi.exportAccount(), AccountExportSchema);
    expect(exported.readingPlaces).toEqual([expect.objectContaining({ chapter: 'chapter-2', page: 1 })]);
  });

  test('a new account exports as the test user, with nothing saved', async ({ folioApi, testUser }) => {
    const response = await folioApi.exportAccount();

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    const exported = await readJson(response, AccountExportSchema);
    expect(exported.account.username).toBe(testUser.username);
    expect(exported).toMatchObject({ bookmarks: [], highlights: [], readingPlaces: [] });
  });

  test.describe('refuses', () => {
    const bookmark = { book: BOOK, position: { chapter: 'chapter-1', page: 1 } };

    test('a signed-out visitor', async ({ visitorApi }) => {
      const write = await visitorApi.post('/account/bookmarks/new', bookmark);
      const exported = await visitorApi.exportAccount();

      expect(write.status()).toBe(401);
      expect(await readJson(write, ErrorSchema)).toEqual({ error: 'signed_out' });
      expect(exported.status()).toBe(302);
    });

    test('a write from another origin', async ({ folioApi, testUser: _signedIn }) => {
      const response = await folioApi.post('/account/bookmarks/new', bookmark, { sameOrigin: false });

      expect(response.status()).toBe(403);
    });

    test('a malformed body', async ({ folioApi, testUser: _signedIn }) => {
      const response = await folioApi.post('/account/bookmarks/new', { chapter: 1 });

      expect(response.status()).toBe(400);
      expect(await readJson(response, ErrorSchema)).toEqual({ error: 'invalid' });
    });

    test('a book that does not exist', async ({ folioApi, testUser: _signedIn }) => {
      const response = await folioApi.post('/account/bookmarks/new', { ...bookmark, book: 'no-such-book' });

      expect(response.status()).toBe(404);
      expect(await readJson(response, ErrorSchema)).toEqual({ error: 'not_found' });
    });

    test('a highlight colour Folio does not have', async ({ folioApi, testUser: _signedIn }) => {
      const response = await folioApi.post('/account/highlights/new', {
        ...bookmark,
        text: 'It is a tr',
        start: 0,
        end: 10,
        color: 'red',
      });

      expect(response.status()).toBe(400);
      expect(await readJson(response, ErrorSchema)).toEqual({ error: 'invalid' });
    });
  });
});
