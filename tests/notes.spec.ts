import { expect, test } from '../src/fixtures/test.ts';

const BOOK = 'pride-and-prejudice';
const PASSAGE = 'It is a truth universally acknowledged, that a single man in possession of a good fortune';

test.describe('Notes', { tag: '@regression' }, () => {
  test('add a note to a passage and find it again in your highlights', async ({
    page,
    readerPage,
    highlightsPage,
    testData,
    testUser: _signedIn,
  }) => {
    const note = testData.note();

    await readerPage.open(BOOK, 1);
    const saved = await readerPage.addNote(PASSAGE, note);

    expect(saved.status()).toBe(200);
    await expect(readerPage.panel.highlightsTab).toHaveText('Highlights 1');
    await expect(readerPage.panel.note(PASSAGE)).toHaveText(`Note: ${note}`);

    await page.reload();
    await readerPage.panel.showHighlights();

    await expect(readerPage.panel.note(PASSAGE)).toHaveText(`Note: ${note}`);

    await highlightsPage.open(BOOK);

    await expect(highlightsPage.heading).toHaveText('Pride and Prejudice');
    await expect(highlightsPage.highlights).toHaveCount(1);
    await expect(highlightsPage.note(PASSAGE)).toHaveText(`Note: ${note}`);
  });

  test('your highlights with a note are accessible and fit the screen', async ({
    readerPage,
    highlightsPage,
    testData,
    scanAccessibility,
    horizontalOverflow,
    testUser: _signedIn,
  }) => {
    await readerPage.open(BOOK, 1);
    await readerPage.addNote(PASSAGE, testData.note());
    await highlightsPage.open(BOOK);
    await expect(highlightsPage.highlights).toHaveCount(1);

    expect(await scanAccessibility()).toEqual([]);
    await expect.poll(horizontalOverflow).toBe(0);
  });
});
