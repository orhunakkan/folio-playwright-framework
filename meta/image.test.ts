// Every run uses the same pinned image (see scripts/playwright.ts): `npm test` locally, and CI's jobs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { IMAGE } from '../src/config/image.ts';

test("CI's jobs run in the same image as local runs, matching the installed Playwright", () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const images = [...workflow.matchAll(/^\s*image:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  assert.ok(images.length > 0, 'ci.yml must run its jobs in a container');
  for (const image of images) assert.equal(image, IMAGE);
});
