import { expect, test } from '../src/fixtures/test.ts';
import { goOffline } from '../src/mocking/offline.ts';

const BOOK = 'pride-and-prejudice';

test.describe('Offline reading', { tag: '@regression' }, () => {
  test('a book downloaded for offline can be read without a connection', async ({
    context,
    page,
    bookPage,
    readerPage,
    browserName,
  }) => {
    test.skip(
      browserName === 'firefox',
      'In Playwright Firefox the download stays at 0% with no error; unconfirmed whether Folio or the test setup ' +
        "(dev's basic auth on service-worker requests) is the cause. See the blueprint's step 18 notes.",
    );
    await bookPage.open(`jane-austen/${BOOK}`);
    await bookPage.downloadForOffline();

    await expect(bookPage.removeDownloadButton).toBeVisible();

    await goOffline(context, page);
    await readerPage.open(BOOK, 2);

    await expect(readerPage.chapterHeading).toHaveText('Chapter 2');
    await expect(readerPage.paragraph('“I hope Mr. Bingley will like it, Lizzy.”')).toBeVisible();
  });
});
