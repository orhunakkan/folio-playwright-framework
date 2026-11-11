import { expect, test } from '../src/fixtures/test.ts';

const BOOK = 'pride-and-prejudice';

test.describe('Bookmarks', { tag: '@regression' }, () => {
  test('bookmark a page and come back to it from the bookmarks list', async ({
    page,
    readerPage,
    testUser: _signedIn,
  }) => {
    await readerPage.open(BOOK, 1);
    const saved = await readerPage.bookmarkThisPage();

    expect(saved.status()).toBe(201);
    await expect(readerPage.bookmarkButton).toHaveAttribute('aria-pressed', 'true');

    await readerPage.open(BOOK, 3);
    await readerPage.panel.showBookmarks();

    await expect(readerPage.panel.bookmarks).toHaveCount(1);
    await expect(readerPage.panel.bookmark('Ch. 1 · p. 1')).toBeVisible();
    await expect(readerPage.bookmarkButton).toHaveAttribute('aria-pressed', 'false');

    await readerPage.panel.goToBookmark('Ch. 1 · p. 1');

    await expect(page).toHaveURL(`/read/${BOOK}/chapter-1`);
    await expect(readerPage.bookmarkButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('remove a bookmark', async ({ page, readerPage, testUser: _signedIn }) => {
    // Two bookmarks, so that after the reload one is still listed: proof the list has loaded.
    await readerPage.open(BOOK, 1);
    await readerPage.bookmarkThisPage();
    await readerPage.open(BOOK, 2);
    await readerPage.bookmarkThisPage();
    await readerPage.panel.showBookmarks();

    const removed = await readerPage.panel.removeBookmark('Ch. 1 · p. 1');

    expect(removed.status()).toBe(200);
    await expect(readerPage.panel.bookmark('Ch. 1 · p. 1')).toHaveCount(0);

    await page.reload();
    await readerPage.panel.showBookmarks();

    await expect(readerPage.panel.bookmarks).toHaveCount(1);
    await expect(readerPage.panel.bookmark('Ch. 2 · p. 1')).toBeVisible();
  });

  test('the reader with its bookmarks open is accessible and fits the screen', async ({
    readerPage,
    scanAccessibility,
    horizontalOverflow,
    testUser: _signedIn,
  }) => {
    await readerPage.open(BOOK, 1);
    await readerPage.bookmarkThisPage();
    await readerPage.panel.showBookmarks();
    await expect(readerPage.panel.bookmarks).toHaveCount(1);

    expect(await scanAccessibility()).toEqual([]);
    await expect.poll(horizontalOverflow).toBe(0);
  });
});
