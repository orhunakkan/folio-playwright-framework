// `CI passed` is the one required check (see the blueprint's "Decided: CI at scale"), so every job that can fail a
// change must feed it. A new job left out of its `needs` could go red while the pull request still merges.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

/** Jobs that `CI passed` doesn't wait for, and why. */
const NOT_REQUIRED: Record<string, string> = {
  'ci-passed': 'the check itself',
  pages: 'publishes the report after main has its result; it never runs for a pull request',
};

test('`CI passed` needs every job of the workflow', () => {
  const jobsSection = workflow.slice(workflow.indexOf('\njobs:\n'));
  const jobs = [...jobsSection.matchAll(/^ {2}([a-z][a-z0-9-]*):\s*$/gm)].map((match) => match[1] ?? '');
  assert.ok(jobs.includes('ci-passed'), 'ci.yml must have the `ci-passed` job');

  const ciPassed = jobsSection.slice(jobsSection.indexOf('\n  ci-passed:'));
  const needs =
    /^ {4}needs: \[([^\]]*)\]/m
      .exec(ciPassed)?.[1]
      ?.split(',')
      .map((name) => name.trim()) ?? [];

  for (const job of jobs) {
    if (job in NOT_REQUIRED) continue;
    assert.ok(needs.includes(job), `\`ci-passed\` must need \`${job}\``);
  }
});
