// Checks the Playwright config itself, with Node's test runner: `npm run test:meta`.
// Each test file runs in its own process, so setting env vars before the import is safe.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Placeholders, set before the config loads. Real values in .env never override variables already set.
process.env.CI = 'true';
process.env.DEV_BASIC_USER = 'placeholder-user';
process.env.DEV_BASIC_PASS = 'placeholder-pass';
process.env.FOLIO_TEST_API_TOKEN = 'placeholder-token';

const { default: config } = await import('../playwright.config.ts');
const { DEV_URL } = await import('../src/config/env.ts');

test('CI records no traces, because they would publish secrets in public artifacts', () => {
  assert.equal(config.use?.trace, 'off');
  for (const project of config.projects ?? []) {
    assert.equal(project.use?.trace, undefined, `project "${project.name ?? ''}" must not turn tracing back on`);
  }
});

test('CI fails on a committed test.only', () => {
  assert.equal(config.forbidOnly, true);
});

test('basic-auth credentials are only ever sent to dev', () => {
  assert.equal(config.use?.baseURL, DEV_URL);
  const credentials = [config.use.httpCredentials ?? []].flat();
  assert.ok(credentials.length > 0, 'httpCredentials must be set');
  for (const { origin } of credentials) assert.equal(origin, DEV_URL);
});

test('CI never writes visual baselines: they are made in the pinned image, and a missing one fails', () => {
  assert.equal(config.updateSnapshots, 'none');
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(workflow, /update-snapshots|-u\b/);
});
