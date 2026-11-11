# 0009. BDD through playwright-bdd, not cucumber-js

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

The framework adds Gherkin feature files beside its specs, to show the BDD style on real Folio journeys
([bdd/README.md](../../bdd/README.md), [the plan](../bdd-plan.md)). There are two common ways to run Gherkin with
Playwright: [playwright-bdd](https://vitalets.github.io/playwright-bdd/), which turns feature files into ordinary
Playwright tests, and `@cucumber/cucumber` (cucumber-js), which runs them with its own runner and uses Playwright as
a library.

## Decision

The scenarios run through playwright-bdd 9.2.1, pinned exactly, in a top-level `bdd/` folder with its own config
(`playwright.bdd.config.ts`) that reuses the main config.

## Consequences

- The scenarios get everything the specs have without rebuilding it: the fixtures (page objects, `testUser`,
  the console check, redaction), the projects and their `grep`, `setup` and `cleanup`, the pinned image, retries
  and timeouts, `trace: off` in CI, sharding, and the one HTML report with its secret scan.
  `meta/bdd-config.test.ts` checks that the BDD config keeps the main config's guards.
- cucumber-js would have needed all of that rebuilt in Cucumber's World and hooks, and a second reporter, which
  [ADR 0003](0003-html-report-only-no-allure.md) rules out.
- A build step, `bddgen`, comes before every run; its output (`.features-gen/`) is generated, gitignored and never
  edited. A sentence with no step fails it.
- playwright-bdd's API follows Playwright's, and its 10.0 is in pre-release; Renovate brings updates like every
  other dependency.
