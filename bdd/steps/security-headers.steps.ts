import type { DataTable } from 'playwright-bdd';
import { expect, Then, When } from './fixtures.ts';

// `{word}`: a path, e.g. `/` or `/no-such-page`. Redirects aren't followed, so a redirect's own headers are checked.
When('I request {word}', async ({ request, latestResponse }, path: string) => {
  latestResponse.keep(await request.get(path, { maxRedirects: 0 }));
});

// A data table of key/value pairs: header name, then its value.
Then('the response has these headers:', ({ latestResponse }, table: DataTable) => {
  expect(latestResponse.get().headers()).toMatchObject(table.rowsHash());
});

Then('the response tells browsers to use HTTPS only', ({ latestResponse }) => {
  expect(latestResponse.get().headers()['strict-transport-security']).toMatch(/max-age=[1-9]\d*/);
});
