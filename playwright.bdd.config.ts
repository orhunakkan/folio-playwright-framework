import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import config from './playwright.config.ts';

/**
 * The BDD run (bdd/README.md): the main config, with the tests that `bddgen` generates from `bdd/features/` as its
 * test folder. Everything else comes from playwright.config.ts unchanged: basic auth, timeouts, `trace` off in CI,
 * the reporters, `forbidOnly`, and the projects with their `grep`, so `@api` and `@http` scenarios run once, in the
 * `http` project, and the rest in every browser project.
 */
const testDir = defineBddConfig({
  features: 'bdd/features',
  steps: 'bdd/steps',
  // Generated tests mirror bdd/features/, e.g. .features-gen/home.feature.spec.js.
  featuresRoot: 'bdd/features',
  // A sentence with no step fails `bddgen`, which prints a ready-made snippet for it.
  missingSteps: 'fail-on-gen',
  // A step's keyword counts when matching, so one sentence can be a Given that sets a state up and a Then that
  // checks it: "Given I am reading chapter 1 of …" opens it, "Then I am reading chapter 1 of …" checks it.
  matchKeywords: true,
});

/** Projects that run the framework's own files from tests/, not the generated scenarios. */
const FROM_TESTS = new Set(['setup', 'cleanup', 'agents']);

export default defineConfig({
  ...config,
  testDir,
  projects: (config.projects ?? []).map((project) => (FROM_TESTS.has(project.name ?? '') ? { ...project, testDir: './tests' } : project)),
});
