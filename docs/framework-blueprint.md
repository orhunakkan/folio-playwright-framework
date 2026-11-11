# Framework blueprint

What this framework aims to be, written within the rules in [AGENTS.md](../AGENTS.md): dev environment only, no
third-party testing, limited mocking, public repository.

- **Core**: must-haves, done well.
- **Showcase**: a deliberate, smaller set of extras.
- **Skipped**: left out on purpose, each with a short reason in an ADR.
- **Outcomes**: qualities the repository should have overall, beyond individual practices.

| Tier | Area | What the framework has | Why |
| --- | --- | --- | --- |
| **Core** | Structure | Page objects + component objects, user-intent methods, no assertions inside | Readable, maintainable specs |
| | Fixtures | Custom `test`/`expect`, page objects injected as fixtures | One import, less boilerplate |
| | Fixtures | Auto fixture that fails a test on console errors or page errors | Catches hidden JS bugs on every test |
| | Locators | Role and label locators only, enforced by lint | Resilient, accessible by design |
| | Assertions | Web-first, ARIA state, response status | Assertions retry on their own and check the user's view and the network |
| | Isolation | Each test owns its data; `fullyParallel` | Runs in any order, retries safely |
| | Setup | Users and data created over HTTP; the UI is driven only for the feature under test | Fast, focused tests |
| | Test data | Faker factories with a seed, plus a run ID prefix on created data | Realistic, reproducible, traceable on dev |
| | Cleanup | A teardown project deletes what the run created | Keeps the shared dev site clean |
| | Config | Typed env (zod), explicit timeouts, dev URL in one place | Fails fast and stays predictable |
| | Mocking | One small folder with only the five allowed cases | Follows AGENTS.md, nothing more |
| | Accessibility | Axe scan per journey | A11y is part of "done" |
| | Responsive | Desktop, phone and tablet projects; horizontal overflow check | Proves layouts hold up |
| | Cross-browser | Chromium, Firefox and WebKit on desktop | Wider coverage than Folio's own suite |
| | Tags & skips | `@smoke`, `@regression`, `@http`; conditional skips with reasons | Targeted runs, honest skips |
| | Reporting in tests | `test.step()` in page objects | Reports and traces read like a story |
| | Guards | `forbidOnly`, plus a meta-test that checks the config | The suite can't silently rot |
| | Debugging | Trace, screenshot and video on failure | Any failure is diagnosable |
| | CI | GitHub-hosted runners, pinned image, sharding + merged report, PR gate, nightly run | Public, fast, trustworthy |
| | Reporting | HTML report published to GitHub Pages | Visitors can see real results |
| | Code quality | Strict TS, ESLint + `eslint-plugin-playwright`, Prettier, Husky, Renovate | Clean code and a current Playwright |
| | Docs | README quickstart, CONTRIBUTING, ADRs | Shows judgment, not just code |
| **Showcase** | Visual | Screenshot tests on stable pages (home, catalogue) with masking | Catches visual regressions |
| | API layer | Typed API client + zod response schemas | Shows API testing alongside UI |
| | Assertions | A few custom matchers (`toBeSignedIn()`) | Domain-language tests |
| | Performance | Web-vitals budgets, nightly | Covers more than functional testing |
| | Security | Header checks (`@http`) | Cheap, meaningful checks |
| | Flakiness | Burn-in (`--repeat-each`) on changed specs in PRs | Stops flaky tests at the door |
| | AI | Playwright test agents (planner, healer) with docs | Fits an "agentic" story |
| **Skipped (with ADR)** | Third parties | No tests, no stubs | AGENTS.md rule |
| | Other mocking | No HAR replay or extra mocks | AGENTS.md rule |
| | Allure | HTML report only | One good reporter beats two |
| | Component testing | Not included | No access to Folio's source here |
| | E2E coverage | Not included | The dev site isn't an instrumented build |
| | DB reset or guard | Not included | It's a shared deployed environment |
| | Bundle leak check | Not included | Belongs in Folio's own repo |
| | Notifications | Not included | No team to notify |
| **Outcomes** | CI health | Always green, no flaky tests | A red badge undoes everything |
| | Speed | Full run in about 10 minutes or less | People actually run it |
| | First run | Clone → `npm run setup` → `npm test` → passing | Easy to evaluate |
| | Consistency | The same patterns in every spec | This matters more than having many patterns |
| | History | Small, meaningful commits | Shows how it was built |

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

| Step | What | Done when |
| --- | --- | --- |
| 1. Skeleton | `git init`, `package.json`, `npm install`, `tsconfig.json`, ESLint + Prettier, `playwright.config.ts` with the typed zod env, `.env.example` | `npm run lint` passes and `npx playwright test` runs (zero tests) |
| 2. First test | One test that opens dev's home page through basic auth and checks the heading | A green test against the real dev site |
| 3. Test users | Test API client, `testUser` fixture (create → sign in by cookie → delete), the sweep in a setup project | A signed-in test passes, and its user is gone afterwards |
| 4. First real journey | First page objects, one journey (e.g. bookmarks), axe scan, overflow check | A full spec in the style the rest will follow |
| 5. CI | Create the public GitHub repository, add the secrets, add a GitHub Actions workflow in the pinned Playwright image (check its Node version against `engines`), `npm audit --audit-level=high` | The same tests pass on GitHub |

After step 5 the foundation is done; more journeys, devices, browsers, visual tests and reports follow the patterns
from steps 1–4. Keep the repository local until step 5, so the first public commit is already in good shape.

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
