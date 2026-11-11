# Folio Playwright framework

An end-to-end test framework built with [Playwright](https://playwright.dev) and TypeScript, written to show
automation best practices on a real app. The app under test is **Folio**, a library and reader web app. Folio's own
source is private and is not part of this repository; the tests drive its dev environment,
<https://dev.agenticlibrary.app/>, and nothing else.

- [docs/framework-blueprint.md](docs/framework-blueprint.md): what the framework aims to be, and what is done.
- [AGENTS.md](AGENTS.md): the rules every test follows (dev only, no third-party testing, limited mocking).
- [CONTRIBUTING.md](CONTRIBUTING.md): how a spec is written, and what to check before a pull request.
- [docs/adr/](docs/adr/): what the framework leaves out on purpose, and why.

## Quickstart

You need **Node 26** or newer (see [.nvmrc](.nvmrc)), **npm 11** or newer, and git.

```sh
git clone https://github.com/orhunakkan/folio-playwright-framework.git
cd folio-playwright-framework
npm run setup          # npm ci, Git hooks, and the Playwright browsers
cp .env.example .env   # then fill in the three values (see below)
npm test
```

`npm test` runs every spec against dev and ends with a summary such as `12 passed`, with no failures.
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

### If a browser won't start

- **Debian or Ubuntu:** if a browser reports missing libraries, run `sudo npx playwright install-deps` once.
- **Other Linux distributions** (e.g. Arch): `npm run setup` warns that the OS is not officially supported and that
  libraries are missing. The warning is about WebKit, which can't find the system libraries it was built against;
  Chromium and Firefox run natively, and setup still succeeds.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Every spec against dev |
| `npx playwright test --grep @smoke` | Only tests tagged `@smoke` (also `@regression`) |
| `npx playwright test tests/bookmarks.spec.ts --repeat-each=5` | One spec, five times over, to show it isn't flaky |
| `npm run check` | Typecheck, lint, format check and config meta-tests; needs no credentials |
| `npm run format` | Formats the code with Prettier |

## How it is built

| Folder | What is in it |
| --- | --- |
| `tests/` | Specs, one user journey per file; `*.setup.ts` runs first and `*.teardown.ts` last (test user cleanup) |
| `src/fixtures/test.ts` | The `test` and `expect` every spec imports, with the framework's fixtures |
| `src/pages/`, `src/components/` | Page and component objects: locators and user-intent methods, no assertions |
| `src/api/` | The client for Folio's test API |
| `src/data/` | Seeded Faker factories for the data tests type into Folio |
| `src/checks/` | The accessibility scan, the horizontal overflow check, and the console error check |
| `src/config/` | The dev URL, the typed (zod) env, and the run ID |
| `meta/` | Tests of the Playwright config itself, run with `node --test` |

Some of the choices behind it:

- **Every test gets its own fresh user** from Folio's test API, signed in by cookie, and deleted afterwards. Tests
  never use the sign-up form or real accounts, so they run in any order and in parallel. A cleanup project deletes
  any user a run left behind, so a run leaves nothing on dev.
- **Test data is seeded and traceable.** Text a test types comes from Faker, starts with the run's ID (shown in
  the report), and comes out the same again with `FAKER_SEED=<seed from the report> npm test`.
- **Role and label locators only**, enforced by ESLint, so the tests read like a user and catch accessibility gaps.
- **Every journey ends with an axe scan** (WCAG 2.2 AA) and a check that the page doesn't scroll sideways.
- **Every test fails on a console error or an uncaught page error**, through an automatic fixture.
- **No traces in CI.** Traces record request headers, which hold dev's credentials, so a public CI run records none.
  Locally, traces are kept on failure: don't share a local report.

## License

[MIT](LICENSE)
