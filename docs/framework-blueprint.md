# Framework blueprint

What this framework aims to be, written within the rules in [AGENTS.md](../AGENTS.md): dev environment only, no
third-party testing, limited mocking, public repository.

- **Core**: must-haves, done well.
- **Showcase**: a deliberate, smaller set of extras.
- **Skipped**: left out on purpose, each with a short reason in an ADR.
- **Outcomes**: qualities the repository should have overall, beyond individual practices.
- **Done**: ✓ when the repository has everything in the row. A row that is only partly there stays blank, and
  Outcomes, which are ongoing, are never ticked.

| Tier | Area | What the framework has | Why | Done |
| --- | --- | --- | --- | --- |
| **Core** | Structure | Page objects + component objects, user-intent methods, no assertions inside | Readable, maintainable specs | ✓ |
| | Fixtures | Custom `test`/`expect`, page objects injected as fixtures | One import, less boilerplate | ✓ |
| | Fixtures | Auto fixture that fails a test on console errors or page errors | Catches hidden JS bugs on every test | |
| | Locators | Role and label locators only, enforced by lint | Resilient, accessible by design | ✓ |
| | Assertions | Web-first, ARIA state, response status | Assertions retry on their own and check the user's view and the network | ✓ |
| | Isolation | Each test owns its data; `fullyParallel` | Runs in any order, retries safely | ✓ |
| | Setup | Users and data created over HTTP; the UI is driven only for the feature under test | Fast, focused tests | ✓ |
| | Test data | Faker factories with a seed, plus a run ID prefix on created data | Realistic, reproducible, traceable on dev | |
| | Cleanup | A teardown project deletes what the run created | Keeps the shared dev site clean | |
| | Config | Typed env (zod), explicit timeouts, dev URL in one place | Fails fast and stays predictable | ✓ |
| | Mocking | One small folder with only the five allowed cases | Follows AGENTS.md, nothing more | |
| | Accessibility | Axe scan per journey | A11y is part of "done" | ✓ |
| | Responsive | Desktop, phone and tablet projects; horizontal overflow check | Proves layouts hold up | |
| | Cross-browser | Chromium, Firefox and WebKit on desktop | Wider coverage than Folio's own suite | |
| | Tags & skips | `@smoke`, `@regression`, `@http`; conditional skips with reasons | Targeted runs, honest skips | |
| | Reporting in tests | `test.step()` in page objects | Reports and traces read like a story | ✓ |
| | Guards | `forbidOnly`, plus a meta-test that checks the config | The suite can't silently rot | ✓ |
| | Debugging | Screenshot and video on failure; traces locally only (they hold secrets) | Any failure is diagnosable | ✓ |
| | CI | GitHub-hosted runners, pinned image, sharding + merged report, PR gate, nightly run | Public, fast, trustworthy | |
| | Reporting | HTML report published to GitHub Pages | Visitors can see real results | |
| | Code quality | Strict TS, ESLint + `eslint-plugin-playwright`, Prettier, Husky, Renovate | Clean code and a current Playwright | |
| | Docs | README quickstart, CONTRIBUTING, ADRs | Shows judgment, not just code | ✓ |
| **Showcase** | Visual | Screenshot tests on stable pages (home, catalogue) with masking | Catches visual regressions | |
| | API layer | Typed API client + zod response schemas | Shows API testing alongside UI | |
| | Assertions | A few custom matchers (`toBeSignedIn()`) | Domain-language tests | |
| | Performance | Web-vitals budgets, nightly | Covers more than functional testing | |
| | Security | Header checks (`@http`) | Cheap, meaningful checks | |
| | Flakiness | Burn-in (`--repeat-each`) on changed specs in PRs | Stops flaky tests at the door | |
| | AI | Playwright test agents (planner, healer) with docs | Fits an "agentic" story | |
| **Skipped (with ADR)** | Third parties | No tests, no stubs | AGENTS.md rule | ✓ |
| | Other mocking | No HAR replay or extra mocks | AGENTS.md rule | ✓ |
| | Allure | HTML report only | One good reporter beats two | ✓ |
| | Component testing | Not included | No access to Folio's source here | ✓ |
| | E2E coverage | Not included | The dev site isn't an instrumented build | ✓ |
| | DB reset or guard | Not included | It's a shared deployed environment | ✓ |
| | Bundle leak check | Not included | Belongs in Folio's own repo | ✓ |
| | Notifications | Not included | No team to notify | ✓ |
| **Outcomes** | CI health | Always green, no flaky tests | A red badge undoes everything | |
| | Speed | Full run in about 10 minutes or less | People actually run it | |
| | First run | Clone → `npm run setup` → `npm test` → passing | Easy to evaluate | |
| | Consistency | The same patterns in every spec | This matters more than having many patterns | |
| | History | Small, meaningful commits | Shows how it was built | |

## Dependencies

The package manager is npm (see [AGENTS.md](../AGENTS.md)). Everything is a `devDependency`: a test framework ships
no runtime code. Versions were current on npm on 2026-11-10.

```json
{
  "name": "folio-playwright-framework",
  "private": true,
  "license": "MIT",
  "type": "module",
  "engines": {
    "node": ">=26",
    "npm": ">=11"
  },
  "scripts": {
    "setup": "npm ci && husky && playwright install chromium firefox webkit"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.14.0",
    "@eslint/js": "^10.0.1",
    "@faker-js/faker": "^10.6.0",
    "@playwright/test": "^1.65.0",
    "@types/node": "^26.6.6",
    "eslint": "^10.14.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-playwright": "^2.12.2",
    "husky": "^9.1.7",
    "lint-staged": "^17.6.0",
    "prettier": "^3.9.10",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.72.2",
    "zod": "^4.6.7"
  }
}
```

| Package | Covers |
| --- | --- |
| `@playwright/test` | Runner, browsers, fixtures, visual tests, sharding, `page.clock`, `page.route`, test agents |
| `typescript`, `@types/node` | Strict TypeScript |
| `@axe-core/playwright` | Accessibility scans |
| `@faker-js/faker` | Test data factories |
| `zod` | Typed env config and API response schemas |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-playwright` | Linting, including TypeScript and Playwright rules |
| `prettier`, `eslint-config-prettier` | Formatting, without clashing with ESLint |
| `husky`, `lint-staged` | Pre-commit lint and format |

Notes:

- **`"private": true`** only blocks `npm publish`. It does not affect whether the GitHub repository is public.
- **TypeScript is pinned to `~6.0.3`.** `typescript-eslint` supports TypeScript below 6.1 only, so TypeScript 7 would
  break type-aware linting. Move to 7 when `typescript-eslint` supports it.
- **Dependency install scripts are blocked** with `ignore-scripts=true` in `.npmrc`, as a supply-chain defence. None
  of these packages need install scripts. The setting also skips this project's own `prepare` script, so Husky is
  run explicitly by `npm run setup` instead.
- **Browsers run natively locally, in the official container in CI.** `npm run setup` installs browsers without
  `--with-deps`, which needs `sudo` and only works on Debian and Ubuntu; there, if a browser reports missing
  libraries, run `sudo npx playwright install-deps` once. CI runs in the pinned `mcr.microsoft.com/playwright` image,
  whose tag must match `@playwright/test` (Renovate bumps both together). Visual baselines are made in that same
  image, through a `test:docker` script added with the visual tests, because screenshots differ between systems.
  The same script runs WebKit on Linux distributions Playwright doesn't support, such as Arch, where WebKit can't
  find the system libraries it was built against.
- **The ESLint config is plain JavaScript** (`eslint.config.js` with `// @ts-check`). A TypeScript config would need
  `jiti` or an unstable ESLint flag.
- **Markdown is hand-formatted, not run through Prettier**, which would only pad the tables. Docs wrap at 120
  characters and keep tables compact.
- **Covered without a package:** `.env` loading (Node's `process.loadEnvFile()`), running TypeScript (Node's type
  stripping), the config meta-test (`node --test`), web-vitals budgets (the browser's `PerformanceObserver`),
  custom matchers, `test.step`, visual tests, sharding and report merging (Playwright), test agents
  (`npx playwright init-agents`), and Renovate, GitHub Pages and CI (config files and GitHub Actions).

## Build order

Build one thin slice that works end to end, then widen it. Each step ends in something that runs.

| Step | What | Done when | Done |
| --- | --- | --- | --- |
| 1. Skeleton | `git init`, `package.json`, `npm install`, `tsconfig.json`, ESLint + Prettier, `playwright.config.ts` with the typed zod env, `.env.example` | `npm run lint` passes and `npx playwright test` runs (zero tests) | ✓ |
| 2. First test | One test that opens dev's home page through basic auth and checks the heading | A green test against the real dev site | ✓ |
| 3. Test users | Test API client, `testUser` fixture (create → sign in by cookie → delete), the sweep in a setup project | A signed-in test passes, and its user is gone afterwards | ✓ |
| 4. First real journey | First page objects, one journey (e.g. bookmarks), axe scan, overflow check | A full spec in the style the rest will follow | ✓ |
| 5. CI | Create the public GitHub repository, add the secrets, add a GitHub Actions workflow in the pinned Playwright image (check its Node version against `engines`), `npm audit --audit-level=high` | The same tests pass on GitHub | ✓ |
| 6. Docs | README quickstart, CONTRIBUTING, one ADR per Skipped row | A visitor gets from clone to a passing run with the README alone, and every Skipped row has its ADR | ✓ |
| 7. Console errors | Auto fixture that fails a test on console errors or page errors; first check what dev logs today (e.g. the Cloudflare beacon) | Every test fails on an unexpected console or page error, and a deliberately broken page proves it | |
| 8. Cleanup and test data | Teardown project that deletes what the run created; Faker factories with a seed; run ID prefix on created data | A run leaves nothing behind on dev, and the data it creates is traceable to the run | |
| 9. `@http` | The `@http` tag, starting with the Showcase security header checks | `--grep @http` runs the header checks on their own | |
| 10. Devices and browsers | Phone and tablet projects, Firefox and WebKit on desktop, a `test:docker` script for WebKit where Playwright doesn't support the Linux distribution; the reader page object opens its hidden side panel on small screens | Every spec passes in every project, locally and in CI | |
| 11. CI at scale | Sharding with a merged report, a required PR check, the HTML report on GitHub Pages, Renovate | A pull request can't merge red, and the latest report is on GitHub Pages | |

Steps 1–5 built the foundation, and steps 6–11 finish the Core tier. The mocking folder is not a step: it is built
with the first test that needs one of the five allowed cases. The Showcase rows follow Core. More journeys follow
the patterns from steps 1–4 throughout. The repository stayed local until step 5, so the first public commit was
already in good shape.

## Open questions

None.

## Decided: test users on dev

"Each test owns its data" and "Cleanup" rely on a **test API** on Folio's dev environment. It is **live**: built in
Folio, deployed to dev, and checked end to end on 2026-11-11 (create, sign in with the returned cookie, delete,
sweep, and 404 for a missing or wrong token). On production it answers 404. The contract the framework relies on:

| Request | Answer |
| --- | --- |
| `POST /test-api/users` with `{ plan?: 'free' \| 'pro', starter?: boolean, signedIn?: boolean }` | `201 { username, password, plan }`, plus a session `Set-Cookie` when `signedIn` is true |
| `DELETE /test-api/users/<username>` | `204`, or `404` for anything that isn't a test account |
| `POST /test-api/sweep` | `200 { deleted: n }`: removes test accounts older than 6 hours |
| Any of them without the right token | `404` |

- Every request sends the header `X-Folio-Test-Token` and dev's basic-auth credentials. Both come from `.env`
  locally and from GitHub Secrets in CI (`FOLIO_TEST_API_TOKEN`, `DEV_BASIC_USER`, `DEV_BASIC_PASS`).
- At most 300 test accounts can exist at once; past that, create answers `429`, and the framework should sweep.
- A fixture creates a user before each test and deletes it after, even when the test fails. The sweep runs at the
  start of each run.
- Signing in over HTTP through `/login` needs an `Origin: https://dev.agenticlibrary.app` header, because Folio
  refuses cross-origin form posts. `signedIn: true` avoids that.

How the framework uses it (step 3):

- **Specs import `test` and `expect` from `src/fixtures/test.ts`**, never from `@playwright/test`, so every spec has
  the same import whatever fixtures it uses.
- **`testUser` creates the user through `context.request`.** That request context shares the browser context's
  cookie jar, so the `__Host-session` cookie from `signedIn: true` lands in the browser with no cookie copying.
- **Dev creates Pro users when no plan is sent.** `testUser` always sends one, `free` by default; a test that needs
  Pro says so with `test.use({ testUserOptions: { plan: 'pro' } })`.
- **Usernames look like `e2e-<12 hex>`.** The client's zod schema rejects any other name, and `deleteUser` refuses
  to delete one, so a bug can't reach a real account.
- **The sweep runs in a `setup` project** that the browser projects depend on. It only removes accounts older than
  6 hours, so it is safe while another run (local or CI) is in progress.
- **Dev handles test API writes one at a time.** A create takes about 0.5–1.5 s alone and a delete about 1 s;
  10 creates at once took up to 10 s. Test API calls get a 30 s timeout, and `testUser` has its own 60 s fixture
  timeout so queueing doesn't count against the test.

## Decided: how a spec is written (step 4)

[tests/bookmarks.spec.ts](../tests/bookmarks.spec.ts) is the model for later journeys.

- **Page objects in `src/pages/`, component objects in `src/components/`**, all injected as fixtures. They expose
  locators and user-intent methods, wrap each method in `test.step(…, { box: true })`, and never assert.
- **A test that needs a session but not the user's details** requests `testUser: _signedIn`. The underscore tells
  TypeScript and ESLint that it is unused on purpose.
- **A method that saves something returns the save's `Response`**, and the spec asserts its status. Folio updates
  the UI before the save finishes (the bookmark button shows pressed at once), so the UI alone doesn't prove the
  save, and leaving the page too early could cancel it.
- **Prove a list has loaded before asserting what it lacks.** After a reload a list may be empty only because it
  hasn't loaded yet, so the test keeps one item that must reappear.
- **Accessibility and overflow are fixtures**: `expect(await scanAccessibility()).toEqual([])` (WCAG 2.2 AA) and
  `await expect.poll(horizontalOverflow).toBe(0)`, run once per journey at its richest state.
- **Known Folio accessibility bugs** are listed in `KNOWN_ISSUES` in `src/checks/accessibility.ts`, each left out
  of the scan as narrowly as possible, noted on every test that scans, and deleted once dev has the fix.
- **Every dev page loads Cloudflare's analytics beacon** (`static.cloudflareinsights.com`). It is site
  infrastructure, not a Folio feature, so it is neither tested nor blocked.
- **On phone and tablet widths the reader hides its side panel**, so the Bookmarks tab isn't visible. The page
  object will need a step to open the panel when those projects are added.

## Decided: CI (step 5)

- **No traces in CI.** Traces record request headers, including dev's basic-auth header and the test API token,
  and Playwright can't redact them; artifacts of a public repository are downloadable by anyone. CI keeps
  screenshots, video and error context. `meta/config.test.ts` fails if CI tracing is turned back on, and also checks
  `forbidOnly` and that basic-auth credentials go only to dev. A failing CI-mode run was checked on 2026-11-11: its
  report and results hold no secret values. Locally, traces stay on failure; don't share a local report.
- **Both jobs run in `mcr.microsoft.com/playwright:v1.65.0-noble`**, which has Node 26.13.0 and npm 11.20.0,
  matching `engines`. Its tag must move with `@playwright/test`.
- **Actions are pinned by commit SHA**, with the version in a comment, as a supply-chain defence.
- **Pull requests from forks skip the e2e job.** GitHub gives them no secrets, so the tests couldn't reach dev.
- **`npm audit --audit-level=high` passes.** On 2026-11-11 it reported 10 moderate advisories, all one `minimatch`
  denial-of-service reached through the ESLint and typescript-eslint tooling (dev-only). The only offered fix
  downgrades ESLint, so they wait for upstream releases.
- **Not yet:** sharding with a merged report, and the GitHub Pages report. With six tests the run takes about 15 s,
  so they come once the suite grows.

## Decided: docs (step 6)

- **The credentials are given on request.** A visitor can't run the e2e tests without dev's basic-auth credentials
  and the test API token, so the README says to ask for them in a GitHub issue; they are shared privately, never in
  the issue. Without them, `npm run check` runs (it needs no secrets), and CI shows the suite passing.
- **The README quickstart was checked in a fresh clone** on 2026-11-11: `npm run setup`, fill in `.env`,
  `npm test` → `6 passed`. On Arch, `npm run setup` warns that the OS is unsupported and libraries are missing;
  the warning is about WebKit, and setup still exits 0. An empty `.env` stops the run and names the variables.
- **ADRs live in [docs/adr/](adr/)**, numbered, each with Status, Date, Context, Decision and Consequences, and
  listed in the folder's README. Every Skipped row has one (0001–0008). A changed decision is marked Superseded and
  gets a new record.
- **CONTRIBUTING repeats the spec rules** from "how a spec is written" in contributor terms, and asks for
  `--repeat-each=5` on a new or changed spec.
