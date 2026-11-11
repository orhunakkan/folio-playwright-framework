# Architecture decision records

Each record explains one thing the framework leaves out on purpose (the **Skipped** rows of the
[blueprint](../framework-blueprint.md)), or a choice between two tools. A record is short: the context, the decision, and what follows from it.
When a decision changes, its record is marked *Superseded* and a new one explains the change.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-no-third-party-tests-or-stubs.md) | No tests or stubs for third-party services | Accepted |
| [0002](0002-no-mocking-beyond-the-allowed-cases.md) | No HAR replay or other mocks | Accepted |
| [0003](0003-html-report-only-no-allure.md) | Playwright's HTML report only, no Allure | Accepted |
| [0004](0004-no-component-testing.md) | No component tests | Accepted |
| [0005](0005-no-e2e-code-coverage.md) | No code coverage from the e2e run | Accepted |
| [0006](0006-no-database-reset-or-guard.md) | No database reset or guard | Accepted |
| [0007](0007-no-bundle-leak-check.md) | No check for secrets leaking into Folio's bundles | Accepted |
| [0008](0008-no-notifications.md) | No failure notifications | Accepted |
| [0009](0009-bdd-through-playwright-bdd.md) | BDD scenarios through playwright-bdd, not cucumber-js | Accepted |
