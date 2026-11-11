import { test, type Locator, type Page } from '@playwright/test';

/** The library, at /library: every book, shelved by series, with collections and featured series beside it. */
export class LibraryPage {
  readonly page: Page;
  readonly heading: Locator;
  /** The filter buttons above the shelves, e.g. `All` and `Classic novels`. Pressed when active. */
  readonly filters: Locator;
  /** One region per series on the shelves, named after the series, e.g. `Jane Austen`. */
  readonly series: Locator;
  /** The filters pressed now: `All` until another is pressed. */
  readonly selectedFilters: Locator;
  /** One entry per book on the shelves, each a link to the book's page. */
  readonly books: Locator;
  /**
   * Parts that follow dev's catalogue rather than the page's design: the counts, the collections, the featured
   * series, the filters and the shelves. Visual tests mask them, so adding a book to dev doesn't fail them.
   */
  readonly changingParts: Locator[];

  constructor(page: Page) {
    this.page = page;
    const main = page.getByRole('main');
    const navigation = page.getByRole('complementary', { name: 'Site navigation' });
    this.heading = main.getByRole('heading', { level: 1 });
    this.series = main.getByRole('region');
    this.filters = main.getByRole('group', { name: 'Filter books' }).getByRole('button');
    this.selectedFilters = main.getByRole('group', { name: 'Filter books' }).getByRole('button', { pressed: true });
    this.books = this.series.getByRole('listitem');
    this.changingParts = [
      main.getByRole('complementary', { name: 'Library stats' }),
      main.getByRole('group', { name: 'Filter books' }),
      this.series,
      navigation.getByRole('region', { name: 'Collections' }).getByRole('list'),
      navigation.getByRole('region', { name: 'Featured series' }).getByRole('list'),
    ];
  }

  filter(name: string): Locator {
    return this.filters.filter({ hasText: name });
  }

  async open(): Promise<void> {
    await test.step('open the library', () => this.page.goto('/library'), { box: true });
  }

  /** A book on the shelves, by its title. */
  book(title: string): Locator {
    return this.books.getByRole('link', { name: title });
  }

  /** Opens a book's page from the shelves. */
  async openBook(title: string): Promise<void> {
    await test.step(`open the book ${title}`, () => this.book(title).click(), { box: true });
  }

  async filterBy(name: string): Promise<void> {
    await test.step(`filter the library by ${name}`, () => this.filter(name).click(), { box: true });
  }
}
