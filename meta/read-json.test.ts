// `readJson` (src/api/folio-api.ts) reports where a response breaks its schema, never the values: the account
// export holds IP addresses, and a failure message reaches the public report.
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DEV_BASIC_USER = 'placeholder-user';
process.env.DEV_BASIC_PASS = 'placeholder-pass';
process.env.FOLIO_TEST_API_TOKEN = 'placeholder-token';

const { readJson } = await import('../src/api/folio-api.ts');
const { AccountExportSchema } = await import('../src/api/schemas.ts');

const IP = '203.0.113.9';

function fakeResponse(body: unknown): Parameters<typeof readJson>[0] {
  return {
    json: () => Promise.resolve(body),
    url: () => 'https://dev.agenticlibrary.app/account/export',
    status: () => 200,
  } as unknown as Parameters<typeof readJson>[0];
}

test('a body that breaks its schema is reported by path, without its values', async () => {
  const body = { format: IP, version: 1, exportedAt: IP, sessions: [{ device: 7, ip: IP }] };

  await assert.rejects(readJson(fakeResponse(body), AccountExportSchema), (error: Error) => {
    assert.match(error.message, /doesn't match the schema/);
    assert.match(error.message, /^ {2}format: /m);
    assert.match(error.message, /^ {2}sessions\.0\.device: /m);
    assert.ok(!error.message.includes(IP), 'the message must not contain a value from the body');
    return true;
  });
});
