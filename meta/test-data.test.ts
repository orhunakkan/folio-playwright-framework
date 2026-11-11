// Checks the Faker factories, with Node's test runner: `npm run test:meta`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Placeholders, set before the modules load (they read the env). Real values in .env never override them.
process.env.DEV_BASIC_USER = 'placeholder-user';
process.env.DEV_BASIC_PASS = 'placeholder-pass';
process.env.FOLIO_TEST_API_TOKEN = 'placeholder-token';
process.env.FOLIO_RUN_ID = 'local-meta-test';

const { TestData, testSeed } = await import('../src/data/test-data.ts');

test('the same base seed gives a test the same data again', () => {
  const seed = testSeed(42, 'some-test-id', 0);
  assert.equal(testSeed(42, 'some-test-id', 0), seed);
  assert.equal(new TestData(seed).note(), new TestData(seed).note());
});

test('each test, and each repeat of it, gets its own data', () => {
  const seeds = new Set([testSeed(42, 'test-a', 0), testSeed(42, 'test-b', 0), testSeed(42, 'test-a', 1)]);
  assert.equal(seeds.size, 3);
  assert.notEqual(new TestData(testSeed(42, 'test-a', 0)).note(), new TestData(testSeed(42, 'test-b', 0)).note());
});

test('every note starts with the run ID', () => {
  assert.match(new TestData(1).note(), /^\[local-meta-test\] \S/);
});
