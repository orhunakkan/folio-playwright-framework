import { expect, test } from '../src/fixtures/test.ts';
import { slowDown } from '../src/mocking/slow-responses.ts';

const BOOK = 'pride-and-prejudice';
const QUESTION = 'Do I need an account to read?';

// Web vitals (LCP, CLS, INP) of signed-out pages, each with one interaction, against the budgets in
// src/checks/web-vitals.ts. They run in the `performance` project only (Chromium), which exists when
// PERFORMANCE=true: nightly in CI, or `npm run test:perf`. Each test's metrics are on it in the report.
test.describe('Performance', { tag: ['@regression', '@perf'] }, () => {
  test('the home page is within its web-vitals budgets', async ({ homePage, webVitals }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();
    await webVitals.start();

    await homePage.openQuestion(QUESTION);

    await expect(homePage.question(QUESTION)).toHaveJSProperty('open', true);
    expect(await webVitals.read()).toBeWithinBudgets();
  });

  test('the library is within its web-vitals budgets', async ({ libraryPage, webVitals }) => {
    await libraryPage.open();
    await expect(libraryPage.series).not.toHaveCount(0);
    await webVitals.start();

    await libraryPage.filterBy('Classic novels');

    await expect(libraryPage.filter('Classic novels')).toHaveAttribute('aria-pressed', 'true');
    expect(await webVitals.read()).toBeWithinBudgets();
  });

  test('the reader is within its web-vitals budgets', async ({ page, readerPage, webVitals }) => {
    await readerPage.open(BOOK, 1);
    await expect(readerPage.text).toBeVisible();
    await webVitals.start();

    await readerPage.turnPage();

    await expect(page).toHaveURL(`/read/${BOOK}/chapter-1/2`);
    expect(await webVitals.read()).toBeWithinBudgets();
  });

  test('a page that paints too late fails its budget', async ({ page, libraryPage, webVitals }) => {
    test.fail(true, "The library's page is held back 3 s, so its LCP must break the 2.5 s budget");
    await slowDown(page, /\/library$/, 3_000);
    await libraryPage.open();
    await expect(libraryPage.series).not.toHaveCount(0);
    await webVitals.start();

    expect(await webVitals.read()).toBeWithinBudgets();
  });
});
