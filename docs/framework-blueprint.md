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
| | Fixtures | Auto fixture that fails a test on console errors or page errors | Catches hidden JS bugs on every test | ✓ |
| | Locators | Role and label locators only, enforced by lint | Resilient, accessible by design | ✓ |
| | Assertions | Web-first, ARIA state, response status | Assertions retry on their own and check the user's view and the network | ✓ |
| | Isolation | Each test owns its data; `fullyParallel` | Runs in any order, retries safely | ✓ |
| | Setup | Users and data created over HTTP; the UI is driven only for the feature under test | Fast, focused tests | ✓ |
| | Test data | Faker factories with a seed, plus a run ID prefix on created data | Realistic, reproducible, traceable on dev | ✓ |
| | Cleanup | A teardown project deletes what the run created | Keeps the shared dev site clean | ✓ |
| | Config | Typed env (zod), explicit timeouts, dev URL in one place | Fails fast and stays predictable | ✓ |
| | Mocking | One small folder with only the five allowed cases | Follows AGENTS.md, nothing more | |
| | Accessibility | Axe scan per journey | A11y is part of "done" | ✓ |
| | Responsive | Desktop, phone and tablet projects; horizontal overflow check | Proves layouts hold up | ✓ |
| | Cross-browser | Chromium and Firefox on desktop; WebKit when Playwright's basic-auth bug is fixed (see step 10) | Wider coverage than Folio's own suite | ✓ |
| | Tags & skips | `@smoke`, `@regression`, `@http`; conditional skips with reasons | Targeted runs, honest skips | ✓ |
| | Reporting in tests | `test.step()` in page objects | Reports and traces read like a story | ✓ |
| | Guards | `forbidOnly`, plus a meta-test that checks the config | The suite can't silently rot | ✓ |
| | Debugging | Screenshot and video on failure; traces locally only (they hold secrets) | Any failure is diagnosable | ✓ |
| | CI | GitHub-hosted runners, pinned image, sharding + merged report, PR gate, nightly run | Public, fast, trustworthy | ✓ |
| | Reporting | HTML report published to GitHub Pages | Visitors can see real results | ✓ |
| | Code quality | Strict TS, ESLint + `eslint-plugin-playwright`, Prettier, Husky, Renovate | Clean code and a current Playwright | ✓ |
| | Docs | README quickstart, CONTRIBUTING, ADRs | Shows judgment, not just code | ✓ |
| **Showcase** | Visual | Screenshot tests on stable pages (home, library) with masking | Catches visual regressions | |
| | API layer | Typed API client + zod response schemas | Shows API testing alongside UI | |
| | Assertions | A few custom matchers (`toBeSignedIn()`) | Domain-language tests | |
| | Performance | Web-vitals budgets, nightly | Covers more than functional testing | |
| | Security | Header checks (`@http`) | Cheap, meaningful checks | ✓ |
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
    "setup": "npm ci && husky && node scripts/playwright.ts --version",
    "test": "node scripts/playwright.ts test"
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
- **Every run uses the pinned `mcr.microsoft.com/playwright` image, locally and in CI** (decided in step 10; it
  replaces native browsers locally). No machine installs browsers. The tag follows `@playwright/test`, so Renovate
  bumping the library moves the image too; a meta-test keeps CI's tag in step. Visual baselines will come from the
  same image, so screenshots match everywhere.
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
| 7. Console errors | Auto fixture that fails a test on console errors or page errors; first check what dev logs today (e.g. the Cloudflare beacon) | Every test fails on an unexpected console or page error, and a deliberately broken page proves it | ✓ |
| 8. Cleanup and test data | Teardown project that deletes what the run created; Faker factories with a seed; run ID prefix on created data | A run leaves nothing behind on dev, and the data it creates is traceable to the run | ✓ |
| 9. `@http` | The `@http` tag, starting with the Showcase security header checks | `--grep @http` runs the header checks on their own | ✓ |
| 10. Devices and browsers | Phone and tablet projects, Firefox and WebKit on desktop, every run in the pinned image (`npm test`); the reader page object opens its hidden side panel on small screens | Every spec passes in every project, locally and in CI | ✓, without WebKit (see step 10's notes) |
| 11. CI at scale | Sharding with a merged report, a required PR check, the HTML report on GitHub Pages, Renovate | A pull request can't merge red, and the latest report is on GitHub Pages | ✓ |
| 12. Flakiness | A CI job on pull requests that runs only the specs the PR changed, with `--repeat-each=5`; `CI passed` requires it | A PR that changes a spec runs it five times in CI, and the PR can't merge if a repeat fails | |
| 13. Visual | Screenshot tests on stable pages (home, library) with dynamic parts masked; baselines made in the pinned image | They pass in every browser project, locally and in CI, and a deliberate visual change fails them | |
| 14. API layer | A typed client with zod response schemas for Folio's own endpoints, alongside the UI tests | An `@api` spec checks real responses against the schemas | |
| 15. Custom matchers | A few domain matchers, e.g. `toBeSignedIn()`, via `expect.extend` in `src/fixtures/test.ts` | Used in at least two specs, with readable failure messages | |
| 16. Performance | Web-vitals budgets (LCP, CLS, INP) measured in the browser, run nightly | The nightly run records the metrics in the report and fails when one is over budget | |
| 17. AI | Playwright's test agents (planner, generator, healer), set up as Playwright documents them, with docs on using them within AGENTS.md | The agent files are committed, the docs explain them, and one plan made with them for a real journey is in the repo | |
| 18. More journeys + mocking | New journeys (e.g. highlights, reading settings, search, offline reading, read-aloud), building `src/mocking/` with the first test that needs one of the five allowed cases | The Mocking row holds only cases real specs use, and each case has a spec | |

Steps 1–5 built the foundation, and steps 6–11 finish the Core tier. Steps 12–17 build the open Showcase rows, and
step 18 adds journeys and, with the first test that needs one of the five allowed cases, the mocking folder (the
Core Mocking row). More journeys follow the patterns from steps 1–4 throughout. The repository stayed local until
step 5, so the first public commit was already in good shape.

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
  (Step 11 correction: that check, and the one in step 9, searched files as plain text, which can't see into the
  HTML report's embedded zip. Both of CI's uploaded reports so far were rescanned with the zip-aware scan on
  2026-11-11, along with their run logs: clean.)
- **The check, e2e and report jobs run in `mcr.microsoft.com/playwright:v1.65.0-noble`**, with Node 26.13.0 and
  npm 11.20.0, matching `engines`. Its tag must move with `@playwright/test`.
- **Actions are pinned by commit SHA**, with the version in a comment, as a supply-chain defence.
- **Pull requests from forks skip the e2e job.** GitHub gives them no secrets, so the tests couldn't reach dev.
- **`npm audit --audit-level=high` passes.** On 2026-11-11 it reported 10 moderate advisories, all one `minimatch`
  denial-of-service reached through the ESLint and typescript-eslint tooling (dev-only). The only offered fix
  downgrades ESLint, so they wait for upstream releases.
- **Sharding with a merged report, and the GitHub Pages report,** were left out with six tests; step 11 added them
  (see "Decided: CI at scale").

## Decided: docs (step 6)

- **The credentials are given on request.** A visitor can't run the e2e tests without dev's basic-auth credentials
  and the test API token, so the README says to ask for them in a GitHub issue; they are shared privately, never in
  the issue. Without them, `npm run check` runs (it needs no secrets), and CI shows the suite passing.
- **The README quickstart was checked in a fresh clone** on 2026-11-11: `npm run setup`, fill in `.env`,
  `npm test` → `6 passed`. On Arch, `npm run setup` warns that the OS is unsupported and libraries are missing;
  the warning is about WebKit, and setup still exits 0. An empty `.env` stops the run and names the variables.
  Rechecked in step 10, when runs moved into the pinned image: setup pulls the image and prints its Playwright
  version, and `npm test` → `49 passed`, with no warnings on Arch.
- **ADRs live in [docs/adr/](adr/)**, numbered, each with Status, Date, Context, Decision and Consequences, and
  listed in the folder's README. Every Skipped row has one (0001–0008). A changed decision is marked Superseded and
  gets a new record.
- **CONTRIBUTING repeats the spec rules** from "how a spec is written" in contributor terms, and asks for
  `--repeat-each=5` on a new or changed spec.

## Decided: console errors (step 7)

- **What dev logs today: nothing.** On 2026-11-11, in Chromium and Firefox, signed in and out, the home page, library,
  book page, sign-in, legal pages, account pages and reader logged no console messages and threw no page errors.
  Cloudflare's analytics beacon loads (`static.cloudflareinsights.com`) and reports (`POST /cdn-cgi/rum` → 204)
  without logging anything, so it needs no exception. Pages near third-party features (plan, credits, flashcards)
  and the export were not visited.
- **The check lives in the framework's `context` fixture** (an override of Playwright's own), and fails a test on
  `console.error`, a failed `console.assert`, or an uncaught page error. Warnings don't count. Every test with a
  page has a context, so every such test is checked, popups included; it checks after the test body, so the failure
  lists every message at once. (Step 7 made it an automatic fixture; step 9 moved it into `context`, because an
  automatic fixture that needs a context made API-only `@http` tests start a browser.)
- **Known errors go in `KNOWN_CONSOLE_ERRORS`** in `src/checks/console-errors.ts`, like `KNOWN_ISSUES` for
  accessibility: as narrow as possible, noted on the test, deleted once fixed. It starts empty.
- **`tests/console-errors.spec.ts` proves the fixture works**: two local pages (`setContent`), one that logs an
  error and one that throws, each marked `test.fail`. If the fixture stops catching errors, they go red.
- **Seen in passing, for step 10:** Firefox's first request to dev gets a `401` (the basic-auth challenge) before it
  sends the credentials; the navigation itself still answers 200. Dev sends no `Content-Security-Policy` header
  (for step 9).

## Decided: cleanup and test data (step 8)

- **What a run creates on dev:** test users, and what they own (bookmarks, highlights and notes, imported books,
  sessions). Deleting a test user removes everything it owns, so cleanup only has to make sure no user is left.
  API keys (checked with Anthropic and ElevenLabs) and email (a real mail) are out of scope.
- **Usernames can't carry the run ID**: the test API makes them (`e2e-<12 hex>`) and takes no label. So each run
  has a **ledger**, `playwright/.runs/<run ID>/`, with one empty file per live test user: `testUser` records the
  user on create and forgets it on delete. One file per user means workers never write the same file. The ledger
  lives outside `test-results/`, which Playwright empties at the start of a run.
- **The `cleanup` project is the `setup` project's teardown**, so it runs after everything else. It deletes the
  users left in this run's ledger. Checked on 2026-11-11 by killing a worker mid-run: its test failed with
  `SIGKILL`, cleanup deleted the user it stranded, and a second delete answered 404.
- **Setup also clears ledgers of interrupted runs** on the same machine, once they are an hour old; younger ones may
  belong to a run still in progress. The test API's 6-hour sweep stays the backstop, for example for CI jobs.
- **The run ID** is `ci-<GitHub run ID>-<attempt>` in CI (shared by every shard) and `local-<UTC time>-<4 hex>`
  locally. `src/config/run.ts` sets it in `process.env` when the config first loads, so every worker inherits the
  runner's ID; it must stay imported by `playwright.config.ts`. It is in the HTML report's metadata.
- **Faker data is seeded per test**: a hash of the run's base seed, the test ID and the repeat index, so a test gets
  the same data whatever worker or order it runs in. The base seed is random per run, or `FAKER_SEED`; each test
  notes it. Every value starts with `[<run ID>]`. `meta/test-data.test.ts` checks both.
- **The first consumer is a notes journey** (`tests/notes.spec.ts`): select a passage, press Note (which saves the
  highlight, `POST /account/highlights/new`), type the note, Save (`POST /account/highlights/<id>` → 200), then find
  it after a reload and in Account → Highlights. The selection toolbar also has Ask about this, Explain and
  Translate, which are third-party: tests never press them.

## Decided: `@http` (step 9)

- **`tests/security-headers.spec.ts`** checks, on the home page, library, sign-in page, a redirect to sign in, a
  404 and a stylesheet: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Robots-Tag: noindex, nofollow` (dev must stay out of
  search results). Pages with account details send `Cache-Control: … no-store`. Signing in over HTTP
  (`src/api/session.ts`) sets `__Host-session` host-only, `Path=/`, `Secure`, `HttpOnly`, `SameSite=Lax`.
- **Gaps on dev, as `test.fail` with a reason:** no `Strict-Transport-Security` and no `Content-Security-Policy`
  (found 2026-11-11). They go red the day dev sends them, so the marker is removed then. Also absent, not tested:
  `Permissions-Policy` and `Cross-Origin-Opener-Policy`. Plain `http://` answers dev's basic-auth 401 rather than
  redirecting to HTTPS; it isn't tested, because sending credentials over plain HTTP would expose them.
- **An `http` project runs `@http` tests, and browser projects leave them out** (`grepInvert`), so they run once,
  not once per device and browser. `--grep @http` still runs `setup` and `cleanup`, as dependencies.
- **Credentials are sent up front** (`httpCredentials.send: 'always'`, still only to dev's origin). After a 401
  challenge, the request fixture's retry sometimes hung until it timed out under parallel load.
- **API errors are redacted** (`src/support/redact.ts`). A failed API call's error lists its request headers:
  dev's basic-auth header and the test API token. That error reaches the console, the `github` reporter and the
  HTML report, so in CI it would be public. Traces being off didn't cover it. The framework's `request` and
  `context.request` rethrow errors with those values replaced by `[redacted]`. Checked on 2026-11-11 in CI mode
  with a deliberately timed-out call: an unwrapped request context leaked the header and the token into the output;
  the framework's were clean in the output, the report and `test-results/`. `meta/redact.test.ts` guards it.
- **For step 11: the JSON reporter writes the whole config into its output, basic-auth password included.** CI
  doesn't use it, and the HTML report was clean. Sharding uploads blob reports as artifacts, so check them for
  secrets before the first sharded run; they may embed the config the same way. (Checked in step 11: they don't.)

## Decided: devices and browsers (step 10)

- **Every run, everywhere, is in the pinned image.** `npm test` runs `scripts/playwright.ts`, which starts
  `mcr.microsoft.com/playwright:v<installed @playwright/test>-noble` (`src/config/image.ts`) with the checkout
  mounted at the same path, and runs Playwright there. CI's jobs already run in that image, so there the script
  starts Playwright directly (the image sets `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`). One environment for macOS,
  every Linux distribution and CI: the same browsers, Node (26.13.0), fonts and libraries, and the same output.
  - Secrets are passed by name only (`--env NAME`), or read from `.env` in the mounted checkout, so no value is in
    a command line. Files are written as the host user (`--user`), so nothing in the checkout ends up owned by root.
  - The project has no native modules, so the host's `node_modules` works in the container.
  - `npm run test:ui` serves UI mode on `127.0.0.1:9324`. Headed mode and the Inspector need a screen, so they're
    not offered; `npx playwright test` still runs natively, but the docs point to `npm test`.
- **Projects:** `chromium` (Desktop Chrome), `firefox` (Desktop Firefox), `phone` (Pixel 7), `tablet` (Galaxy
  Tab S9), plus `http`. Every browser spec runs in all four.
- **No WebKit yet.** In Playwright 1.65, WebKit never answers dev's basic-auth challenge while
  `httpCredentials.origin` is set: every page is a `401`. Checked on 2026-11-11 with `https://…`, `:443`, a trailing
  slash, upper case and host-only origins; without `origin` it works. The origin guard stays, and so does the
  WebKit gap, until Playwright fixes it. Considered and not taken: dropping `origin` for WebKit projects (WebKit
  would then answer any host's challenge with dev's credentials), and adding the header to dev's requests through
  `context.route`. The tablet is a Chromium device (Galaxy Tab S9) instead of an iPad, for the same reason.
- **The reader's side panel on narrow screens.** Below roughly 850–900 px wide (Folio's CSS, not a standard
  breakpoint), the panel is hidden and a Contents button (`aria-haspopup="dialog"`) opens it as a modal dialog
  named Contents, with the same tabs. `BookPanel` finds the panel in either form, and its `show…` methods press
  Contents first when it's showing and not already expanded (pressing Note opens the dialog itself). CSS picks the
  layout, so it is settled when the page loads; the breakpoint isn't copied into the tests.
- **A modal dialog hides the rest of the page from role locators** until it closes, so `bookmarks.spec.ts` checks
  the bookmark button before opening the panel.
- **The narrow reader shows "Ask this book"**, a third-party feature, where the wide one shows "Ask". Tests press
  neither.

## Decided: CI at scale (step 11)

- **Two shards.** Each e2e job runs `npm test -- --shard=<n>/2` and writes a blob report (the CI reporters are
  `list`, `github` and `blob`). `setup` and `cleanup` run in every shard, which is safe: the run ledger is per
  machine, and the sweep only removes accounts older than 6 hours. `fail-fast` is off, so every shard finishes
  and the merged report shows every failure.
- **The report job merges the blob reports** with `merge.config.ts`, a config with only the HTML reporter, because
  `playwright.config.ts` loads the secrets. It runs after failed tests too, and uploads the report as an artifact
  (14 days). Main's runs (pushes, the nightly run, manual runs) also publish it to GitHub Pages, at
  <https://orhunakkan.github.io/folio-playwright-framework/>; a pull request's report never goes there.
- **Every report is scanned for secrets before it leaves the runner** (`scripts/scan-secrets.ts`): each shard's
  blob report before upload, and the merged report before upload and publishing. A failed scan stops the upload.
  The scan reads inside zips at any depth, because blob reports are zips and the HTML report embeds its data as a
  base64 zip in `index.html`, which a plain text search can't read. It names what it found, never the value.
  `meta/secret-scan.test.ts` covers plain files, deflated and stored zips, nested zips and the embedded zip.
  Checked on 2026-11-11 with a deliberately failing call through an unredacted request context, in CI mode: the
  scan found the basic-auth header and the token in both the blob and the HTML report, including inside the
  embedded zip. The framework's own runs are clean.
- **Blob reports hold no config secrets.** Unlike the JSON reporter, the blob report's config and projects leave
  out `use`, so `httpCredentials` isn't in them (checked on 2026-11-11).
- **One required check: `CI passed`.** A final job that is green only when `check`, every e2e shard and the
  report job passed. Requiring it, rather than each job, keeps the rule stable as the shard count changes. For a
  fork's pull request, whose e2e jobs are skipped (no secrets), it passes on `check` alone, and a maintainer runs the
  suite before merging.
- **The ruleset "main: CI must pass"** (created 2026-11-11) requires `CI passed` on the default branch, and also
  blocks force-pushes and deleting it. Repository admins may bypass it, so the owner can still push straight to
  `main` and, deliberately, merge past a red check; anyone else's pull request can't merge red. Remove the bypass
  in the repository's Rules settings to hold the owner to it too.
- **Renovate** (`renovate.json`, validated with `renovate-config-validator --strict`): weekly, Monday before 06:00
  UTC; releases at least 3 days old; `@playwright/test` and the `mcr.microsoft.com/playwright` image in one
  "Playwright" group, so the tag check in `meta/image.test.ts` passes on the same PR; TypeScript kept below 6.1;
  `.nvmrc`, `engines` and `@types/node` majors left to follow the image's Node and npm; Actions stay pinned by
  digest. Its PRs face
  the same `CI passed` check. It runs as the Renovate GitHub App, which the owner installs; a Renovate Action with
  the default token would open PRs that don't trigger CI.
- **GitHub Pages is on** (2026-11-11), with "GitHub Actions" as its source. Before it was, the `pages` job failed
  with `Not Found` and the run on `main` showed red although every test passed. The first published report was
  scanned as served: clean.
- **The Renovate app is installed** (2026-11-11), for this repository only. Its Dependency Dashboard (issue #1)
  found every npm package, the pinned Actions and the three uses of the Playwright image. Its first run wanted to
  raise `engines` to Node `>=26.13.0` and npm `>=11.21.2` or 12, past the image's npm 11.20.0, so `engines` updates
  are off: Node and npm come from the image.
