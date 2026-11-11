import { expect, test } from '../src/fixtures/test.ts';

// Baselines live in tests/__screenshots__/ and are made only in the pinned image: `npm test -- --grep @visual
// --update-snapshots`. CI never writes them. Parts that change without a design change are masked; the page
// objects list them.
test.describe('Visual', { tag: ['@regression', '@visual'] }, () => {
  test('the home page looks as it did', async ({ page, homePage }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();

    await expect(page).toHaveScreenshot('home.png', { fullPage: true, mask: homePage.changingParts });
  });

  test('the library looks as it did', async ({ page, libraryPage }) => {
    await libraryPage.open();
    await expect(libraryPage.series).not.toHaveCount(0);

    // The viewport, not the full page: the shelves grow with dev's catalogue, and would change the page's height.
    await expect(page).toHaveScreenshot('library.png', { mask: libraryPage.changingParts });
  });

  test('a change to the design fails the visual check', async ({ page, homePage }, testInfo) => {
    test.skip(['all', 'changed'].includes(testInfo.config.updateSnapshots), 'Updating baselines would save this deliberately wrong screenshot as the home page baseline');
    test.fail(true, 'The heading is recoloured on purpose, so the screenshot must not match the baseline');
    await homePage.open();
    await page.addStyleTag({ content: 'h1 { color: rgb(255, 0, 0) !important; }' });

    await expect(page).toHaveScreenshot('home.png', { fullPage: true, mask: homePage.changingParts });
  });
});
