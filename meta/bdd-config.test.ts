// Checks the BDD config (playwright.bdd.config.ts), with Node's test runner: `npm run test:meta`. It reuses the main
// config, and these tests make sure it keeps every guard in meta/config.test.ts and the same projects.
// Each test file runs in its own process, so setting env vars before the import is safe.
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Placeholders, set before the configs load. Real values in .env never override variables already set.
process.env.CI = 'true';
process.env.DEV_BASIC_USER = 'placeholder-user';
process.env.DEV_BASIC_PASS = 'placeholder-pass';
process.env.FOLIO_TEST_API_TOKEN = 'placeholder-token';

const { default: main } = await import('../playwright.config.ts');
const { default: bdd } = await import('../playwright.bdd.config.ts');

test('the BDD run keeps the main config: no CI traces, forbidOnly, credentials only to dev, no CI baselines', () => {
  assert.equal(bdd.use?.trace, 'off');
  assert.equal(bdd.forbidOnly, true);
  assert.deepEqual(bdd.use.httpCredentials, main.use?.httpCredentials);
  assert.equal(bdd.use.baseURL, main.use?.baseURL);
  assert.equal(bdd.updateSnapshots, 'none');
  assert.deepEqual(bdd.reporter, main.reporter);
  assert.equal(bdd.retries, main.retries);
  assert.equal(bdd.timeout, main.timeout);
});

test('the BDD run tests the generated scenarios, not tests/', () => {
  assert.match(String(bdd.testDir), /\.features-gen$/);
});

test('the BDD run has the same projects, with their grep, so @api and @http scenarios run once', () => {
  const projects = bdd.projects ?? [];
  assert.deepEqual(
    projects.map(({ name }) => name),
    (main.projects ?? []).map(({ name }) => name),
  );
  for (const project of projects) {
    const original = (main.projects ?? []).find(({ name }) => name === project.name);
    assert.deepEqual(project.grep, original?.grep, `project "${project.name ?? ''}" keeps its grep`);
    assert.deepEqual(project.grepInvert, original?.grepInvert, `project "${project.name ?? ''}" keeps its grepInvert`);
    assert.equal(project.use?.trace, undefined, `project "${project.name ?? ''}" must not turn tracing back on`);
  }
});

test('setup and cleanup still run from tests/, before and after the scenarios', () => {
  for (const name of ['setup', 'cleanup']) {
    const project = bdd.projects?.find((candidate) => candidate.name === name);
    assert.equal(project?.testDir, './tests', `the ${name} project runs from tests/`);
  }
});
