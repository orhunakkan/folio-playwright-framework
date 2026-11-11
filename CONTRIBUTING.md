# Contributing

Thanks for helping. Start with [AGENTS.md](AGENTS.md): its rules apply to every change. Set up with the
[README quickstart](README.md#quickstart).

## Writing a spec

[tests/bookmarks.spec.ts](tests/bookmarks.spec.ts) is the model. A new spec follows its patterns:

- **Import `test` and `expect` from `src/fixtures/test.ts`**, never from `@playwright/test`.
- **One journey per file**, named after what the user does. Tag the describe or test `@smoke` or `@regression`;
  checks that need no browser (headers, cookies, status codes) are `@http`, and run in the `http` project only.
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
  returns the save's `Response` and the spec asserts its status.
- **Prove a list has loaded before asserting what it lacks**, by checking an item that must be there.
- **End each journey with the accessibility and overflow checks**, once, at its richest state:
  `expect(await scanAccessibility()).toEqual([])` and `await expect.poll(horizontalOverflow).toBe(0)`. A real
  Folio accessibility bug goes in `KNOWN_ISSUES` in `src/checks/accessibility.ts`, as narrowly as possible.
- **Every test fails on a console error or an uncaught page error.** The framework's `context` fixture checks it.
  An error Folio really logs goes in `KNOWN_CONSOLE_ERRORS` in `src/checks/console-errors.ts`, as narrowly as
  possible.
- **Skip only with a condition and a reason**: `test.skip(condition, 'why')`. ESLint rejects a bare `test.skip`.

Explore the real dev site before writing a selector or an assertion. Don't guess text or behaviour.

## Out of bounds

- **Third-party features** (Ask the book, quizzes, flashcards, voices, word lookup, cover search, billing, email):
  no tests, and no stubs. Stop a journey before it reaches one.
- **Mocking** only for the five cases in [AGENTS.md](AGENTS.md#mocking-is-limited-to-these-cases).
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
- **CI must pass.** Pull requests from forks get no secrets, so their e2e job is skipped; a maintainer runs it.
- **A new decision** that leaves something out on purpose gets an ADR in [docs/adr/](docs/adr/).
- **Dependencies:** npm only, and commit `package-lock.json`. The Playwright image tag in
  [.github/workflows/ci.yml](.github/workflows/ci.yml) must match `@playwright/test`; `npm run check` fails if not.
