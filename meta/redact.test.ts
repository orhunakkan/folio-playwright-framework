// Checks that API errors are redacted before they reach a reporter, with Node's test runner: `npm run test:meta`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Placeholders, set before the modules load (they read the env). Real values in .env never override them.
process.env.DEV_BASIC_USER = 'placeholder-user';
process.env.DEV_BASIC_PASS = 'placeholder-pass';
process.env.FOLIO_TEST_API_TOKEN = 'placeholder-token';

const { redact } = await import('../src/support/redact.ts');

const basicAuth = Buffer.from('placeholder-user:placeholder-pass').toString('base64');

// Shaped like the call log of a Playwright API request that timed out.
const timeoutError = `TimeoutError: apiRequestContext.get: Timeout 40ms exceeded.
Call log:
  - → GET https://dev.agenticlibrary.app/library
    - user-agent: Playwright/1.65.0
    - X-Folio-Test-Token: placeholder-token
    - authorization: Basic ${basicAuth}
    - cookie: __Host-session=abc123`;

test('a timed-out API call prints no credential header values', () => {
  const redacted = redact(timeoutError);
  for (const secret of [basicAuth, 'placeholder-token', 'placeholder-pass', 'abc123']) {
    assert.ok(!redacted.includes(secret), `"${secret}" must be redacted`);
  }
  assert.match(redacted, /- authorization: \[redacted\]$/m);
  assert.match(redacted, /GET https:\/\/dev\.agenticlibrary\.app\/library/, 'the rest of the error stays readable');
});

test('a secret anywhere in an error is redacted, not only in headers', () => {
  assert.equal(redact('token placeholder-token in a URL'), 'token [redacted] in a URL');
});
