import { expect, test } from '../src/fixtures/test.ts';

// Baselines live in tests/__screenshots__/ and are made only in the pinned image: `npm test -- --grep @visual
// --update-snapshots`. CI never writes them. Parts that change without a design change are masked; the page
// objects list them.
test.describe('Visual', { tag: ['@regression', '@visual'] }, () => {
  test('the home page looks as it did', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();

    await expect(homePage.page).toHaveScreenshot('home.png', { fullPage: true, mask: homePage.changingParts });
  });

  test('the library looks as it did', async ({ libraryPage }) => {
    await libraryPage.open();
    await expect(libraryPage.series).not.toHaveCount(0);

    // The viewport, not the full page: the shelves grow with dev's catalogue, and would change the page's height.
    await expect(libraryPage.page).toHaveScreenshot('library.png', { mask: libraryPage.changingParts });
  });

  test('a change to the design fails the visual check', async ({ homePage }, testInfo) => {
    test.skip(
      ['all', 'changed'].includes(testInfo.config.updateSnapshots),
      'Updating baselines would save this deliberately wrong screenshot as the home page baseline',
    );
    test.fail(true, 'The heading is recoloured on purpose, so the screenshot must not match the baseline');
    await homePage.open();
    await homePage.page.addStyleTag({ content: 'h1 { color: rgb(255, 0, 0) !important; }' });

    await expect(homePage.page).toHaveScreenshot('home.png', { fullPage: true, mask: homePage.changingParts });
  });
});
