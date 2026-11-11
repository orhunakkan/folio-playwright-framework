import { expect, test } from '../src/fixtures/test.ts';

// Written from specs/highlights.md, the plan Playwright's planner agent made (docs/test-agents.md).
const BOOK = 'pride-and-prejudice';
const FIRST = 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.';
const SECOND = 'Mr. Bennet replied that he had not.';

test.describe('Highlights', { tag: '@regression' }, () => {
  test('highlight a passage and find it in the reader and in your account', async ({ readerPage, highlightsPage, testUser: _signedIn }) => {
    await readerPage.open(BOOK, 1);

    const saved = await readerPage.highlight(FIRST);

    expect(saved).toHaveStatus(201);

    await readerPage.panel.showHighlights();

    await expect(readerPage.panel.highlightsTab).toHaveText('Highlights 1');
    // The reader offers one colour, yellow; it is read out to screen readers before the passage.
    await expect(readerPage.panel.highlight(FIRST)).toContainText(`Yellow highlight: ${FIRST}`);

    await highlightsPage.open(BOOK);

    await expect(highlightsPage.highlights).toHaveCount(1);
    await expect(highlightsPage.highlight(FIRST)).toBeVisible();
  });

  test('delete a highlight', async ({ page, readerPage, testUser: _signedIn }) => {
    // Two highlights, so that after the reload one is still listed: proof the list has loaded.
    await readerPage.open(BOOK, 1);
    await readerPage.highlight(FIRST);
    await readerPage.highlight(SECOND);
    await readerPage.panel.showHighlights();
    await expect(readerPage.panel.highlights).toHaveCount(2);

    const deleted = await readerPage.panel.deleteHighlight(FIRST);

    expect(deleted).toHaveStatus(200);
    await expect(readerPage.panel.highlight(FIRST)).toHaveCount(0);

    await page.reload();
    await readerPage.panel.showHighlights();

    await expect(readerPage.panel.highlights).toHaveCount(1);
    await expect(readerPage.panel.highlight(SECOND)).toBeVisible();
  });

  test('the reader with a highlight is accessible and fits the screen', async ({ readerPage, scanAccessibility, horizontalOverflow, testUser: _signedIn }) => {
    await readerPage.open(BOOK, 1);
    await readerPage.highlight(FIRST);
    await readerPage.panel.showHighlights();
    await expect(readerPage.panel.highlights).toHaveCount(1);

    expect(await scanAccessibility()).toEqual([]);
    await expect.poll(horizontalOverflow).toBe(0);
  });
});
