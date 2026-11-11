# Folio Playwright framework

[![CI](https://github.com/orhunakkan/folio-playwright-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/orhunakkan/folio-playwright-framework/actions/workflows/ci.yml)

An end-to-end test framework built with [Playwright](https://playwright.dev) and TypeScript, written to show
automation best practices on a real app. The app under test is **Folio**, a library and reader web app. Folio's own
source is private and is not part of this repository; the tests drive its dev environment,
<https://dev.agenticlibrary.app/>, and nothing else.

- [docs/framework-blueprint.md](docs/framework-blueprint.md): what the framework aims to be, and what is done.
- [AGENTS.md](AGENTS.md): the rules every test follows (dev only, no third-party testing, limited mocking).
- [CONTRIBUTING.md](CONTRIBUTING.md): how a spec is written, and what to check before a pull request.
- [docs/adr/](docs/adr/): what the framework leaves out on purpose, and why.
- [The latest report](https://orhunakkan.github.io/folio-playwright-framework/): the HTML report of the last run on
  `main` (pushes and the nightly run).

## Quickstart

You need **Node 26** or newer (see [.nvmrc](.nvmrc)), **npm 11** or newer, git, and
[Docker](https://docs.docker.com/get-started/get-docker/) (see [Where tests run](#where-tests-run)).

```sh
git clone https://github.com/orhunakkan/folio-playwright-framework.git
cd folio-playwright-framework
npm run setup          # npm ci, Git hooks, and the pinned Playwright image
cp .env.example .env   # then fill in the three values (see below)
npm test
```

`npm test` runs every spec against dev and ends with a summary such as `49 passed`, with no failures.
`npx playwright show-report` opens the HTML report.

### Credentials

Dev sits behind basic auth, and test users come from a test API on dev that needs a token. `.env` takes three values:

| Variable | What it is |
| --- | --- |
| `DEV_BASIC_USER`, `DEV_BASIC_PASS` | Dev's basic-auth credentials |
| `FOLIO_TEST_API_TOKEN` | The token for Folio's test API on dev |

They are private. To get them, [open an issue](https://github.com/orhunakkan/folio-playwright-framework/issues/new)
and ask; they are shared privately, never in the issue. In CI they come from GitHub Secrets. A missing or empty
value stops the run at once and names the variable.

Without them you can still run `npm run check` (typecheck, lint, format and the config meta-tests), and the
[CI runs](https://github.com/orhunakkan/folio-playwright-framework/actions) show the full suite passing.

### Where tests run

Every run, on any machine and in CI, uses the same pinned image, `mcr.microsoft.com/playwright`, whose tag follows
the installed `@playwright/test`. So the browsers, Node, fonts and system libraries are the same everywhere, and a
run behaves and looks the same on macOS, on any Linux distribution, and in CI. Your machine needs no browsers.

- `npm test` starts the image with your checkout mounted at the same path, and runs Playwright in it. The first run
  (or `npm run setup`) downloads the image, about 2 GB. Results and the report are written to your checkout, owned
  by you. CI's jobs already run in the image, so there `npm test` starts Playwright directly.
- Use `npm test`, not `npx playwright test`: the second runs on your machine, with whatever browsers it has.
- Headed mode and the Playwright Inspector need a screen, which the container doesn't have. `npm run test:ui`
  serves UI mode to your own browser instead, at <http://localhost:9324>, for watching and debugging.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Every spec against dev, in every project (Chromium, Firefox, phone, tablet, and `http`) |
| `npm test -- --grep @smoke` | Only tests tagged `@smoke` (or `@regression`, `@http`, `@api` or `@visual`) |
| `npm test -- --project=phone` | One project only |
| `npm test -- tests/bookmarks.spec.ts --repeat-each=5` | One spec, five times over, to show it isn't flaky |
| `npm test -- --grep @visual --update-snapshots` | Remakes the visual baselines, after a deliberate design change |
| `npm run test:ui` | UI mode, at <http://localhost:9324> |
| `npx playwright show-report` | Opens the last run's HTML report |
| `node scripts/scan-secrets.ts <folder>` | Fails if a secret value is in the folder's files, even inside zips |
| `npm run check` | Typecheck, lint, format check and config meta-tests; needs no credentials |
| `npm run format` | Formats the code with Prettier |

## How it is built

| Folder | What is in it |
| --- | --- |
| `tests/` | Specs, one user journey per file; `*.setup.ts` runs first and `*.teardown.ts` last (test user cleanup) |
| `src/fixtures/test.ts` | The `test` and `expect` every spec imports, with the framework's fixtures |
| `src/pages/`, `src/components/` | Page and component objects: locators and user-intent methods, no assertions |
| `src/api/` | Clients for Folio's test API and its own JSON endpoints, with their zod schemas |
| `src/data/` | Seeded Faker factories for the data tests type into Folio |
| `src/mocking/` | The only place a test may fake anything: the cases AGENTS.md allows |
| `src/support/` | Domain matchers, network helpers, redaction, the run ledger and the secret scan |
| `src/checks/` | The accessibility scan, the horizontal overflow check, and the console error check |
| `src/config/` | The dev URL, the typed (zod) env, the run ID, and the image every run uses |
| `scripts/` | `playwright.ts` runs Playwright in that image (`npm test` uses it); `scan-secrets.ts` checks reports |
| `meta/` | Tests of the Playwright config itself, run with `node --test` |

Some of the choices behind it:

- **Every test gets its own fresh user** from Folio's test API, signed in by cookie, and deleted afterwards. Tests
  never use the sign-up form or real accounts, so they run in any order and in parallel. A cleanup project deletes
  any user a run left behind, so a run leaves nothing on dev.
- **Test data is seeded and traceable.** Text a test types comes from Faker, starts with the run's ID (shown in
  the report), and comes out the same again with `FAKER_SEED=<seed from the report> npm test`.
- **One environment for every run:** the pinned Playwright image, locally and in CI.
- **Desktop, phone and tablet projects.** Page objects handle the layouts, e.g. the reader's side panel, which
  narrow screens open as a dialog.
- **Domain matchers** read like the app: `await expect(page).toBeSignedIn({ as: user })`,
  `expect(saved).toHaveStatus(201)`, `await expect(response).toMatchSchema(Schema)`, each with a failure message in
  Folio's terms.
- **Mocking only where the real app can't oblige**, and only through `src/mocking/` (ESLint enforces it): today, a
  slowed response that pins a Folio bug.
- **Role and label locators only**, enforced by ESLint, so the tests read like a user and catch accessibility gaps.
- **Every journey ends with an axe scan** (WCAG 2.2 AA) and a check that the page doesn't scroll sideways.
- **Every test fails on a console error or an uncaught page error**, checked by the framework's `context` fixture.
- **Visual checks** (`@visual`) compare the home page and the library with baselines in `tests/__screenshots__/`,
  one per project, with the parts that change without a design change masked. Every run is in the same image, so
  a screenshot comes out the same on any machine and in CI.
- **HTTP-level checks** (`@http`), such as security headers and the session cookie, run once in their own project,
  without a browser.
- **An API layer** (`@api`): a typed client for Folio's own JSON endpoints (bookmarks, highlights, reading places,
  the account export), whose responses are checked against zod schemas, and how Folio refuses bad requests. It runs
  once, in the same project as `@http`.
- **No traces in CI, and redacted API errors.** Traces record request headers, which hold dev's credentials, so a
  public CI run records none; and a failed API call's error, which lists those headers, is redacted before any
  reporter prints it.
  Locally, traces are kept on failure: don't share a local report.
- **CI at scale:** the suite runs in two shards, whose reports are merged into one. Every report is scanned for
  secret values, inside its zips too, before it is uploaded or published. One check, `CI passed`, must be green
  before a pull request can merge into `main`. Renovate keeps dependencies current, moving Playwright and its image
  together.
- **Flaky tests are stopped at the door:** a pull request's new or changed specs run five times over in every
  project, with no retries, and one failed repeat blocks the merge.

## License

[MIT](LICENSE)
