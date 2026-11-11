# BDD scenarios

Folio's journeys written as Gherkin feature files, run by [playwright-bdd](https://vitalets.github.io/playwright-bdd/)
with Playwright's own runner. They use the framework's fixtures, page objects, projects, pinned image, cleanup and
HTML report, exactly as the specs in `tests/` do. Some journeys are covered in both styles, on purpose: this folder
shows the BDD way of writing them. Why playwright-bdd and not cucumber-js is in
[ADR 0009](../docs/adr/0009-bdd-through-playwright-bdd.md); how it was built is in
[docs/bdd-plan.md](../docs/bdd-plan.md).

## Running them

```sh
npm run test:bdd                                     # every scenario, in every project, in the pinned image
npm run test:bdd -- --grep @smoke                    # by tag
npm run test:bdd -- sign-in.feature                  # one feature
npm run test:bdd -- sign-in.feature --repeat-each=5  # a new or changed feature, to show it isn't flaky
npm run test:bdd:ui                                  # UI mode, at http://localhost:9324
npm run bdd:steps                                    # every step sentence there is, to reuse their wording
npx bddgen --config playwright.bdd.config.ts --tags "@smoke and not @slow"   # generate only some scenarios
```

`npm run test:bdd` first runs `bddgen`, which turns `bdd/features/*.feature` into tests in `.features-gen/`
(gitignored, never edited), then runs them with [playwright.bdd.config.ts](../playwright.bdd.config.ts): the main
config, with the generated tests as its test folder. `bddgen` only reads files, so it runs on the host; the tests
run in the pinned image, like `npm test`. `npm test` doesn't run the scenarios. In CI the `bdd` job runs them, and
its report is merged with the specs' into one HTML report, where each Gherkin line is a step.

## How a scenario runs

```text
bdd/features/*.feature ──bddgen──▶ .features-gen/*.spec.js ──playwright test──▶ HTML report
        │                                   │
        │ each line matches a step in       │ runs with the fixtures in src/fixtures/test.ts
        ▼                                   ▼
bdd/steps/*.steps.ts ───────────────▶ src/pages, src/components, src/api, src/mocking
```

1. **The feature file** says what should happen, in the reader's words, in the first person. No selectors, URLs or
   waits.
2. **A step** turns one sentence into one or two calls to a page object or API client, with fixtures, the way a
   test gets them: `async ({ readerPage }, chapter: number) => …`.
3. **Page objects** do the work in the browser, with role and label locators, as they do for the specs.
4. **Assertions go in `Then` steps only**, with the framework's `expect`, so `toBeSignedIn()`, `toHaveStatus()`
   and the other matchers are there. ESLint enforces it: `expect` in a `Given`, a `When` or a hook is an error, and
   a `Then` without one is too.

## Adding a scenario

1. Write it in the feature file it belongs to, reusing sentences that already exist (`npm run bdd:steps`).
2. Run `npm run test:bdd`. A sentence with no step fails `bddgen` (`missingSteps: 'fail-on-gen'`) and prints a
   ready-made snippet; paste it into the feature's steps file (`<feature>.steps.ts`) and fill it in.
3. Follow the rules for specs in [CONTRIBUTING.md](../CONTRIBUTING.md#writing-a-spec) and [AGENTS.md](../AGENTS.md):
   a user from `testUser` (the step that needs one asks for it), the sign-in form only in `sign-in.feature`, fakes
   only through `src/mocking/`, nothing near a third-party feature.
4. Burn it in: `npm run test:bdd -- <name>.feature --repeat-each=5 --retries=0`.

Things worth knowing:

- **Every steps file is loaded for every feature**, so a sentence is defined once, in the steps file of the feature
  it belongs to most, and others reuse it.
- **A step's keyword counts** (`matchKeywords`): `Given I am reading chapter 1 of "Pride and Prejudice"` opens the
  chapter, `Then I am reading chapter 2 of "Pride and Prejudice"` checks it. `*` matches any keyword, so a sentence
  written with `*` must mean one thing only.
- **Steps share state through fixtures**, not variables: a `When` that sends a request keeps Folio's answer in
  `latestResponse`, and the `Then` reads it.
- **Signed-out users**: the sign-in feature needs a user who exists but is signed out, so `bdd/steps/fixtures.ts`
  adds `signedOutUser`. It is created and deleted like `testUser`, and recorded in the run's ledger.
- **Folio's pages hydrate after they appear.** A click that comes first can be lost: the account menu waits for it
  before signing out (`waitForHydration` in `src/support/hydration.ts`). Use it where a step acts on a page that has
  only just loaded and the race shows.
- **Dev limits sign-ins.** After a few hundred form sign-ins from one address within an hour, dev refuses even the
  right password (`Username or password is incorrect.`) for 10–15 minutes, with no `429` or other sign of the limit
  (found 2026-11-11). A run signs in 20 times. Keep sign-in scenarios few, and when burning in `sign-in.feature`
  locally, run a few projects at a time with a pause between.

## The features

| Feature file | Scenarios | Runs in |
| --- | --- | --- |
| `sign-in.feature` | sign in and see your account; a wrong password or unknown username is refused; sign out; signing in takes you back to the page you asked for | every browser project |
| `home.feature` | open a question on the home page and read its answer | every browser project |
| `library.feature` | filter the library; go from the library to a book and start reading | every browser project |
| `reading.feature` | turn the page forward and back; jump to a chapter from Contents; Contents lists the chapters in order | every browser project |
| `offline-reading.feature` | a downloaded book can be read without a connection; remove a download | every browser project |
| `read-aloud.feature` | the page is read aloud with the device voice | every browser project |
| `account-api.feature` | saved bookmarks appear in the export; each highlight colour is saved or refused; a malformed body is refused | `http` |
| `security-headers.feature` | five kinds of page send the security headers; HSTS (a known Folio gap, `@fail`) | `http` |

18 scenarios, 78 tests a run (each `Examples` row is a test, and browser scenarios run in four projects), and 28
test users.

## BDD features shown

### Gherkin

| Feature | Where |
| --- | --- |
| `Feature` with a free-text description (a user story: As a… I want… so that…) | `sign-in` |
| `Background` for a whole feature | `sign-in`, `library`, `reading`, `offline-reading`, `account-api` |
| `Rule`, to group scenarios under one business rule | `sign-in` |
| `Scenario` | most |
| `Scenario Outline` with `Examples`, and placeholders in the title | `sign-in`, `reading`, `account-api`, `security-headers` |
| Several named `Examples` blocks in one outline | `reading`, `account-api` |
| A tag on one `Examples` block | `reading` (`@smoke` on the first block only) |
| `Given`, `When`, `Then`, `And`, `But` | all; `But` in `sign-in` |
| `*` in place of a keyword | `account-api` (`Background`) |
| Data table: a plain list (`raw()`) | `reading`, `read-aloud` |
| Data table with a header row (`hashes()`) | `account-api` |
| Data table of key/value pairs (`rowsHash()`) | `security-headers` |
| Doc string, plain | `home` |
| Doc string with a media type | `account-api` (`"""json`) |
| Tags on features, scenarios and `Examples` blocks | all |
| `#` comments | `security-headers` |

### Cucumber expressions

| Feature | Where |
| --- | --- |
| `{int}` | `reading`, `account-api`, `security-headers` |
| `{string}` | `home`, `library`, `sign-in` |
| `{word}` | `account-api` (a colour), `security-headers` (a path) |
| Optional text, `page(s)` and `bookmark(s)` | `reading`, `account-api` |
| Custom parameter type `{book}`: a book's title turned into its slug and library path | `library`, `reading`, `offline-reading`, `sign-in` |
| Custom parameter type `{direction}`: `forward` or `back`, checked against a fixed list | `reading` |

### playwright-bdd

| Feature | Where |
| --- | --- |
| Steps use the framework's fixtures: page objects, `testUser`, `folioApi`, `request` | all |
| A fixture is created only when a step asks for it, so a scenario gets a test user only if a step needs one | `sign-in`, `account-api` |
| BDD-only fixtures: `signedOutUser`, and `latestResponse` to share an answer between steps | `sign-in`; `account-api`, `security-headers` |
| A scenario hook for one tag: `BeforeScenario({ tags: '@device-voice' }, …)` | `read-aloud` |
| Special tags that become Playwright annotations: `@slow` → `test.slow()`, `@fail` → `test.fail()` | `offline-reading`, `security-headers` |
| Gherkin tags become Playwright tags, so `--grep` and the projects' `grep` work on them | all; `@api` and `@http` choose the project |
| `matchKeywords`: one sentence as a `Given` that sets a state up and a `Then` that checks it | `library`, `reading`, `offline-reading`, `read-aloud` |
| Tag expressions when generating (`bddgen --tags "@smoke and not @slow"`) | commands |
| `missingSteps: 'fail-on-gen'`: a sentence with no step fails generation and prints a ready-made snippet | config |
| `bddgen export`: lists every step sentence, so people writing features can reuse wording | `npm run bdd:steps` |

### Not shown, on purpose

| Feature | Why not |
| --- | --- |
| Cucumber's own HTML, JSON and JUnit reports | [ADR 0003](../docs/adr/0003-html-report-only-no-allure.md): Playwright's HTML report only, which already shows each Gherkin line as a step |
| Feature files in another language (`# language: de`) | Works, but a gimmick in an English repository, against an English app |
| Step definitions as decorators on page objects | Page objects make no assertions here, and decorators may conflict with `erasableSyntaxOnly` |
| Steps that change behaviour by tag | Phone and desktop are projects, not tags, and it would hide what a sentence does |
| `@skip`, `@only`, `@fixme`, `@timeout:N`, `@retries:N`, `@mode:serial` | No scenario needs them. They work as their names say; `@only` fails in CI (`forbidOnly`) |
| Regular-expression step definitions | Cucumber expressions read better; `{direction}` already uses a regular expression, inside a parameter type |
| Worker hooks (`BeforeWorker`, `AfterWorker`) | The `setup` and `cleanup` projects already do work for the whole run |
