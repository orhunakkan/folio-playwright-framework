import { defineParameterType } from 'playwright-bdd';

/** A book as the page objects open it: its slug in the reader, and its place in the library. */
export interface Book {
  title: string;
  /** e.g. `pride-and-prejudice`, as in /read/pride-and-prejudice/chapter-1 */
  slug: string;
  /** e.g. `jane-austen/pride-and-prejudice`, as in /library/jane-austen/pride-and-prejudice */
  path: string;
}

/**
 * The books the features name, by title, with the series each is shelved in. A title's slug is the title in lower
 * case with dashes; the series isn't in the title, so a new book is added here.
 */
const SERIES: Record<string, string> = {
  'Pride and Prejudice': 'jane-austen',
};

function bookCalled(title: string): Book {
  const series = SERIES[title];
  if (series === undefined) throw new Error(`No book called "${title}" in bdd/steps/parameter-types.ts. Known: ${Object.keys(SERIES).join(', ')}.`);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { title, slug, path: `${series}/${slug}` };
}

/** `{book}`: a book's title in double quotes, e.g. `"Pride and Prejudice"`, turned into the book. */
defineParameterType({ name: 'book', regexp: /"([^"]+)"/, transformer: bookCalled });

export type Direction = 'forward' | 'back';

/** `{direction}`: `forward` or `back`, and nothing else. */
defineParameterType({ name: 'direction', regexp: /forward|back/, transformer: (word): Direction => (word === 'forward' ? 'forward' : 'back') });
