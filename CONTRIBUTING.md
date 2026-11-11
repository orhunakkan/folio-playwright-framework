# Contributing

Thanks for helping. Start with [AGENTS.md](AGENTS.md): its rules apply to every change. Set up with the
[README quickstart](README.md#quickstart).

## Writing a spec

[tests/bookmarks.spec.ts](tests/bookmarks.spec.ts) is the model. A new spec follows its patterns:

- **Import `test` and `expect` from `src/fixtures/test.ts`**, never from `@playwright/test`.
- **One journey per file**, named after what the user does. Tag the describe or test `@smoke` or `@regression`;
  checks that need no browser (headers, cookies, status codes) are `@http`, and tests of Folio's JSON endpoints are
  `@api`. Both run in the `http` project only.
- **API tests use `folioApi`** (signed in, with `testUser`) **or `visitorApi`** (signed out), from
  `src/api/folio-api.ts`. Each method returns Folio's response: assert its status, then read the body with
  `readJson(response, Schema)` and a schema from `src/api/schemas.ts`. Never attach or print a raw body; the account
  export holds IP addresses.
- **Get a user from the `testUser` fixture.** It creates a fresh account through the test API, signs it in by
  cookie, and deletes it after the test. A test that only needs the session writes `testUser: _signedIn`. A test
  that needs Pro says `test.use({ testUserOptions: { plan: 'pro' } })`. Drive the sign-in form only in a test whose
  subject is signing in.
- **Get text to type from the `testData` fixture** (`src/data/test-data.ts`), never a literal: it is seeded, and
  starts with the run ID so it can be traced on dev. Add a factory method when a journey needs a new kind of value.
- **Put locators and actions in page objects** (`src/pages/`) **and component objects** (`src/components/`), and
  inject them as fixtures in `src/fixtures/test.ts`. Methods say what the user does (`bookmarkThisPage()`), are
  wrapped in `test.step(…, { box: true })`, and never assert.
- **One spec for every screen.** Each spec runs on desktop, phone and tablet. Where the layouts differ, the page
  object handles it (e.g. `BookPanel` opens the reader's panel on narrow screens), so specs never branch on the
  project. A modal dialog hides the rest of the page from role locators until it closes, so check the page behind it
  before opening one.
- **Use role and label locators.** ESLint rejects CSS, XPath, test IDs, text and placeholder locators.
- **Assert what the user sees, and the save.** Folio updates the UI before a save finishes, so a method that saves
  returns the save's `Response` and the spec asserts it: `expect(saved).toHaveStatus(201)`.
- **Use the domain matchers** from `src/fixtures/test.ts`: `toBeSignedIn({ as })` (on a page, context or request
  context), `toHaveStatus(code)`, `toMatchSchema(Schema)` and `toBeWithinBudgets()`. A new one goes in `src/support/matchers.ts`, with a
  failure message in Folio's terms that never prints a response body, and a check of that message in
  `tests/matchers.spec.ts`.
- **Prove a list has loaded before asserting what it lacks**, by checking an item that must be there.
- **End each journey with the accessibility and overflow checks**, once, at its richest state:
  `expect(await scanAccessibility()).toEqual([])` and `await expect.poll(horizontalOverflow).toBe(0)`. A real
  Folio accessibility bug goes in `KNOWN_ISSUES` in `src/checks/accessibility.ts`, as narrowly as possible.
- **Every test fails on a console error or an uncaught page error.** The framework's `context` fixture checks it.
  An error Folio really logs goes in `KNOWN_CONSOLE_ERRORS` in `src/checks/console-errors.ts`, as narrowly as
  possible.
- **Visual baselines are made in the pinned image only**: `npm test -- --grep @visual --update-snapshots`, never
  `npx playwright test`, whose browsers and fonts differ. Remake them only for a deliberate design change, look at
  every changed image before committing it, and mask anything that changes without a design change (the page
  object's `changingParts`). CI never writes a baseline; a missing one fails there.
- **Performance tests are `@perf`** and run only in the `performance` project (`npm run test:perf`; nightly in
  CI). Measure with the `webVitals` fixture: open the page, `start()`, do one real interaction, then
  `expect(await webVitals.read()).toBeWithinBudgets()`. Budgets are in `src/checks/web-vitals.ts`.
- **Skip only with a condition and a reason**: `test.skip(condition, 'why')`. ESLint rejects a bare `test.skip`.

Explore the real dev site before writing a selector or an assertion. Don't guess text or behaviour.

## Out of bounds

- **Third-party features** (Ask the book, quizzes, flashcards, voices, word lookup, cover search, billing, email):
  no tests, and no stubs. Stop a journey before it reaches one.
- **Mocking** only for the five cases in [AGENTS.md](AGENTS.md#mocking-is-limited-to-these-cases), and only through
  helpers in `src/mocking/`: ESLint rejects `route`, `setOffline`, `addInitScript` and `clock` anywhere else.
- **Secrets** stay in `.env` and GitHub Secrets. Never commit, log or paste them, and never share a local report:
  its traces hold them. Make API calls with the `request` fixture or `context.request` from `src/fixtures/test.ts`,
  whose errors are redacted; a request context made any other way prints the credentials when a call fails.

## Before a pull request

```sh
npm run check                                                 # typecheck, lint, format, meta-tests
npm test                                                      # the whole suite against dev, in every project
npm test -- tests/<your-spec>.spec.ts --repeat-each=5         # a new or changed spec, to show it isn't flaky
```

- **Small commits** in [Conventional Commits](https://www.conventionalcommits.org/) style, e.g.
  `test: highlights journey` or `docs: ADR for Allure`. A Git hook lints and formats staged files.
- **CI must pass.** `main` requires the `CI passed` check, which is green only when every job is. Pull requests
  from forks get no secrets, so their e2e job is skipped; a maintainer runs the suite before merging.
- **New and changed specs are burned in.** On a pull request, CI runs every spec it adds or changes five times in
  every project, with no retries (`burn-in` job). One failed repeat fails `CI passed`. Fix the flakiness; don't
  add a retry.
- **Reports are scanned for secrets** in CI, before they are uploaded or published. If the scan fails, don't work
  around it: find what wrote the secret and redact it there.
- **A new decision** that leaves something out on purpose gets an ADR in [docs/adr/](docs/adr/).
- **Dependencies:** npm only, and commit `package-lock.json`. The Playwright image tag in
  [.github/workflows/ci.yml](.github/workflows/ci.yml) must match `@playwright/test`; `npm run check` fails if not.
  Renovate opens update PRs on Mondays, with `@playwright/test` and the image in one PR.
