# BDD plan: a Gherkin showcase

**Status: built (build steps 1–6), with the decisions and the changes found while building at the end. Not yet
pushed, so CI hasn't run it.**

This plan adds a set of Cucumber-style Gherkin feature files to the framework, in a folder of their own. The
scenarios are chosen so that, between them, they use every Gherkin and playwright-bdd feature that fits the
repository's rules. Each one is still a real, first-party journey on dev. The existing specs in `tests/` stay as
they are. Some journeys are covered twice, once in each style, and that is intended.

## The scenarios

18 scenarios in 8 feature files. Each scenario name is also the test name, so it appears the same way in the
report.

| # | Scenario | Feature file | Shows |
| --- | --- | --- | --- |
| 1 | sign in with the form and see your account | `sign-in.feature` | User-story description, feature `Background`, `Rule`, `@smoke` on a scenario, a BDD-only fixture |
| 2 | signing in with \<what is wrong\> is refused | `sign-in.feature` | `Scenario Outline` with a placeholder in its title, `But` |
| 3 | sign out | `sign-in.feature` | A `Given` that adds to the `Background` |
| 4 | signing in takes you back to the page you asked for | `sign-in.feature` | A second `Rule`, `{book}` |
| 5 | open a question on the home page and read its answer | `home.feature` | Doc string |
| 6 | filter the library | `library.feature` | `{string}` |
| 7 | go from the library to a book and start reading | `library.feature` | Custom parameter type `{book}` |
| 8 | turn the page forward and back | `reading.feature` | `{int}`, optional text `page(s)`, custom parameter type `{direction}` |
| 9 | jump to chapter \<chapter\> from Contents | `reading.feature` | Two named `Examples` blocks, one with its own tag |
| 10 | Contents lists the chapters in order | `reading.feature` | Data table: a plain list |
| 11 | a downloaded book can be read without a connection | `offline-reading.feature` | `@slow` (special tag), a step that uses an allowed fake |
| 12 | remove a book downloaded for offline | `offline-reading.feature` | `Background` shared by both scenarios |
| 13 | the page is read aloud with the device voice | `read-aloud.feature` | A hook that runs only for a tag (`@device-voice`) |
| 14 | saved bookmarks appear in my export | `account-api.feature` | `@api` routes it to the `http` project, `*` keyword, data table with a header row, optional text `bookmark(s)` |
| 15 | a \<colour\> highlight is \<answered\> | `account-api.feature` | Two `Examples` blocks with different outcomes, `{word}` |
| 16 | a malformed body is refused | `account-api.feature` | Doc string with a media type (`json`) |
| 17 | \<page\> sends the security headers | `security-headers.feature` | `Scenario Outline` combined with a key/value data table |
| 18 | pages tell browsers to use HTTPS only (HSTS) | `security-headers.feature` | `@fail` (special tag) for a known Folio gap, `#` comments |

Scenarios 1–13 run in every browser project (Chromium, Firefox, phone, tablet). Scenarios 14–18 are tagged `@api`
or `@http`, so they run once, in the `http` project. A run has 78 tests, because each `Examples` row counts
as its own test. It creates about 28 test users, well inside dev's limit of 300.

## BDD features shown

### Gherkin

| Feature | Where |
| --- | --- |
| `Feature` with a free-text description (here a user story: As a… I want… so that…) | 1–4 |
| `Background` for a whole feature | sign-in, library, reading, offline reading, account API |
| `Rule`, to group scenarios under one business rule | 1–4 |
| `Scenario` | Most |
| `Scenario Outline` with `Examples`, and placeholders in the title | 2, 9, 15, 17 |
| Several named `Examples` blocks in one outline | 9, 15 |
| A tag on one `Examples` block | 9 (`@smoke` on the first block only) |
| `Given`, `When`, `Then`, `And`, `But` | All; `But` in 2 |
| `*` in place of a keyword | 14 (`Background`) |
| Data table: a plain list (`raw()`) | 10, 13 |
| Data table with a header row (`hashes()`) | 14 |
| Data table of key/value pairs (`rowsHash()`) | 17 |
| Doc string, plain | 5 |
| Doc string with a media type | 16 (`"""json`) |
| Tags on features, scenarios and `Examples` blocks | All |
| `#` comments | 18 |

### Cucumber expressions

| Feature | Where |
| --- | --- |
| `{int}`, `{string}`, `{word}` | 8, 9, 6, 15 |
| Optional text, `page(s)` | 8 |
| Custom parameter type `{book}`: a book's title turned into its URL slug | 7, the reading and offline backgrounds |
| Custom parameter type `{direction}`: `forward` or `back`, checked against a fixed list | 8 |

### playwright-bdd

| Feature | Where |
| --- | --- |
| Steps use the framework's fixtures: page objects, `testUser`, `folioApi`, `request` | All |
| A fixture is created only when a step asks for it, so a scenario gets a test user only if one of its steps needs one | 1–4, 14–16 |
| A BDD-only fixture, `signedOutUser` | 1–4 |
| A scenario hook for one tag: `BeforeScenario({ tags: '@device-voice' }, …)` | 13 |
| Special tags that become Playwright annotations: `@slow` → `test.slow()`, `@fail` → `test.fail()` | 11–12, 18 |
| Gherkin tags become Playwright tags, so `--grep` and the projects' `grep` work on them | All; `@api` and `@http` choose the project |
| Tag expressions when generating (`bddgen --tags "@smoke and not @slow"`) | Commands |
| `missingSteps: 'fail-on-gen'`: a sentence with no step fails generation and prints a ready-made snippet | Config |
| `bddgen export`: lists every step sentence, so people writing features can reuse wording | `bdd/README.md` |

### Not shown, on purpose

| Feature | Why not |
| --- | --- |
| Cucumber's own HTML, JSON and JUnit reports | ADR 0003 allows Playwright's HTML report only, which already shows each Gherkin line as a step (decision 5) |
| Feature files in another language (`# language: de`) | Works, but it's a gimmick in an English repository and against an English app |
| Step definitions as decorators on page objects | Page objects make no assertions here, and decorators may conflict with `erasableSyntaxOnly` in `tsconfig.json` |
| Steps that change behaviour by tag | Nothing here needs it: phone and desktop are projects, not tags. It would also make it harder to tell what a sentence does |
| `@skip`, `@only`, `@fixme`, `@timeout:N`, `@retries:N`, `@mode:serial` | No scenario needs them, so using them would be for show. `bdd/README.md` lists them. `@only` fails in CI anyway (`forbidOnly`) |
| Regular-expression step definitions | Cucumber expressions read better. `{direction}` already shows a regular expression, inside a parameter type |
| Worker hooks (`BeforeWorker`, `AfterWorker`) | The `setup` and `cleanup` projects already do work for the whole run |

## Tool: playwright-bdd

[playwright-bdd](https://vitalets.github.io/playwright-bdd/) turns `.feature` files into ordinary Playwright test
files, and Playwright's own runner runs them. In this framework, that means the scenarios get everything the specs
already have, without rebuilding any of it:

- the fixtures in `src/fixtures/test.ts`: page objects, `testUser` (created and deleted per scenario), the
  console-error check, and error redaction
- the browser projects, the `http` project, the `setup` sweep and the `cleanup` teardown
- the pinned image (`scripts/playwright.ts`), retries, timeouts, and `trace: off` in CI
- the HTML report (ADR 0003) and its secret scan

**Not chosen: `@cucumber/cucumber` (cucumber-js) with Playwright as a library.** It has its own runner, so the
fixtures, projects, sharding, retries, report and console check would all have to be rebuilt in Cucumber's World
and hooks. It would also need a second reporter, which ADR 0003 rules out.

**Version: `playwright-bdd` 9.2.1, pinned exactly** (released 2026-09-06; it supports `@playwright/test` >= 1.44).
10.0 is still in pre-release (`10.0.0-next.*`). Renovate takes care of updates after that, as it does for every
other dependency. The API names in this plan come from playwright-bdd 9's documentation, and build step 1 confirms
them.

## Folder layout

Everything lives under one new top-level folder, `bdd/`, beside `tests/`, plus one config file.

```text
bdd/
  features/                    what the app should do, in plain language
    sign-in.feature
    home.feature
    library.feature
    reading.feature
    offline-reading.feature
    read-aloud.feature
    account-api.feature
    security-headers.feature
  steps/                       how each sentence is done, using the page objects
    fixtures.ts                Given / When / Then / BeforeScenario, bound to the framework's test, + signedOutUser
    parameter-types.ts         {book} and {direction}
    hooks.ts                   the @device-voice hook
    sign-in.steps.ts
    home.steps.ts
    library.steps.ts
    reading.steps.ts
    offline-reading.steps.ts
    read-aloud.steps.ts
    account-api.steps.ts
    security-headers.steps.ts
  README.md                    how to run it, how to add a scenario, the BDD features and where each is shown
playwright.bdd.config.ts       the BDD run: the main config, with the generated tests as its test folder
.features-gen/                 generated by `bddgen`, gitignored, never edited
```

Each feature file has a steps file with the same name. A sentence used by more than one feature, such as
`I am reading chapter {int} of {book}`, lives in the steps file of the feature it belongs to most, and the others
reuse it. playwright-bdd loads every steps file for every feature.

## How a scenario runs

```text
bdd/features/*.feature ──bddgen──▶ .features-gen/*.spec.js ──playwright test──▶ HTML report
        │                                   │
        │ each line matches a step in       │ runs with the fixtures in src/fixtures/test.ts
        ▼                                   ▼
bdd/steps/*.steps.ts ───────────────▶ src/pages, src/components, src/api, src/mocking
```

1. **The feature file** says what should happen, in the user's words. It contains no selectors, URLs or waits.
2. **A step** turns one sentence into one or two calls to a page object or API client. Steps get fixtures the way
   tests do: `async ({ readerPage }) => …`.
3. **The page objects** do the work in the browser, with role and label locators, as they already do for the specs.
4. **Assertions go in `Then` steps only**, with the framework's `expect`, so the custom matchers such as
   `toBeSignedIn()` and `toHaveStatus()` are available. `Given` and `When` steps make no assertions, just as page
   objects make none.

## Feature files

As built. The drafts' `<…>` placeholders were filled in from dev in build step 2 (confirmed with the planner agent;
its findings are in [specs/bdd.md](../specs/bdd.md)), and the drafts were changed where dev differed. Each change is
listed under "Changes from the reviewed plan" at the end.

```gherkin
# bdd/features/sign-in.feature
@regression
Feature: Signing in
  As a reader with an account
  I want to sign in with my username and password
  So that my bookmarks, highlights and reading place follow me

  Background:
    Given I have an account and am signed out

  Rule: Only the right username and password sign you in

    @smoke
    Scenario: sign in with the form and see your account
      When I sign in with my username and password
      Then I am signed in
      And I see my account

    Scenario Outline: signing in with <what is wrong> is refused
      When I sign in with "<username>" and "<password>"
      Then I am told the username or password is wrong
      But I am still signed out

      Examples:
        | what is wrong       | username | password |
        | a wrong password    | mine     | wrong    |
        | an unknown username | unknown  | mine     |

    Scenario: sign out
      Given I have signed in
      When I sign out
      Then I am signed out

  Rule: Signing in takes you where you were going

    Scenario: signing in takes you back to the page you asked for
      When I open my highlights in "Pride and Prejudice"
      And I sign in with my username and password
      Then I see my highlights in "Pride and Prejudice"
```

In scenario 2, `mine` means the test user's own username or password, and `wrong` and `unknown` mean freshly
generated values (`wrong-<run ID>-<6 hex>`, `unknown-<run ID>-<6 hex>`), so no real account is ever tried.

```gherkin
# bdd/features/home.feature
@regression
Feature: Home page
  Scenario: open a question on the home page and read its answer
    Given I am on the home page
    When I open the question "Do I need an account to read?"
    Then I can read its answer:
      """
      No. The whole library and read aloud are open to everyone. An account adds highlights, notes, your own books
      and Ask the book; the Sign in page says how to get one.
      """
```

```gherkin
# bdd/features/library.feature
@regression
Feature: Library
  Background:
    Given I am in the library

  Scenario: filter the library
    When I filter by "Classic novels"
    Then "Classic novels" is the only filter selected
    And the library shows at least one book

  Scenario: go from the library to a book and start reading
    When I open "Pride and Prejudice"
    And I start reading
    Then I am reading chapter 1 of "Pride and Prejudice"
```

```gherkin
# bdd/features/reading.feature
@regression
Feature: Reading
  Background:
    Given I am reading chapter 1 of "Pride and Prejudice"

  Scenario: turn the page forward and back
    When I turn 1 page forward
    And I turn 1 page back
    Then I see the first page again

  Scenario Outline: jump to chapter <chapter> from Contents
    When I go to chapter <chapter> from Contents
    Then I am reading chapter <chapter> of "Pride and Prejudice"

    @smoke
    Examples: the next chapter
      | chapter |
      | 2       |

    Examples: further on
      | chapter |
      | 3       |
      | 5       |

  Scenario: Contents lists the chapters in order
    When I open Contents
    Then the chapters begin:
      | Chapter 1 |
      | Chapter 2 |
      | Chapter 3 |
```

```gherkin
# bdd/features/offline-reading.feature
@regression @slow
Feature: Offline reading
  Background:
    Given I have downloaded "Pride and Prejudice" for offline

  Scenario: a downloaded book can be read without a connection
    When I lose my connection
    And I open chapter 2 of "Pride and Prejudice"
    Then I am reading chapter 2 of "Pride and Prejudice"

  Scenario: remove a book downloaded for offline
    When I remove the download
    Then I can download it for offline again
```

```gherkin
# bdd/features/read-aloud.feature
@regression @device-voice
Feature: Read aloud
  Folio reads the page aloud with the device's own voice.

  Scenario: the page is read aloud with the device voice
    Given I am reading chapter 1 of "Pride and Prejudice"
    When I start reading aloud
    Then the device voice says, in order:
      | Chapter 1.                                                                                                 |
      | It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. |
```

```gherkin
# bdd/features/account-api.feature
@regression @api
Feature: Account API
  Folio's own JSON endpoints for what a reader saves.

  Background:
    * I have an account and am signed in

  Scenario: saved bookmarks appear in my export
    When I save these bookmarks in "Pride and Prejudice":
      | chapter | page |
      | 1       | 1    |
      | 2       | 2    |
    Then my export lists 2 bookmarks

  Scenario Outline: a <colour> highlight is <answered>
    When I save a <colour> highlight
    Then Folio answers <status>

    Examples: Folio's colours
      | colour | answered | status |
      | yellow | saved    | 201    |
      | green  | saved    | 201    |
      | blue   | saved    | 201    |
      | pink   | saved    | 201    |

    Examples: colours Folio doesn't have
      | colour | answered | status |
      | red    | refused  | 400    |
      | purple | refused  | 400    |

  Scenario: a malformed body is refused
    When I send a new bookmark with this body:
      """json
      { "chapter": 1 }
      """
    Then Folio answers 400 with the error "invalid"
```

```gherkin
# bdd/features/security-headers.feature
@regression @http
Feature: Security headers
  Scenario Outline: <page> sends the security headers
    When I request <path>
    Then Folio answers <status>
    And the response has these headers:
      | x-content-type-options | nosniff                         |
      | x-frame-options        | DENY                            |
      | referrer-policy        | strict-origin-when-cross-origin |
      | x-robots-tag           | noindex, nofollow               |

    Examples:
      | page                  | path          | status |
      | the home page         | /             | 200    |
      | the library           | /library      | 200    |
      | the sign-in page      | /login        | 200    |
      | a redirect to sign in | /account      | 307    |
      | a missing page        | /no-such-page | 404    |

  # Folio gap: dev sends no Strict-Transport-Security header (found 2026-11-11).
  # Remove @fail when dev sends it; the scenario then has to pass.
  @fail
  Scenario: pages tell browsers to use HTTPS only (HSTS)
    When I request /
    Then the response tells browsers to use HTTPS only
```

## What the steps look like

Short excerpts; the real files are in `bdd/steps/`.

```ts
// bdd/steps/fixtures.ts: steps and hooks bound to the framework's test
import { mergeTests } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';
import { test as frameworkTest } from '../../src/fixtures/test.ts';

export const test = mergeTests(bddTest, frameworkTest).extend<{ signedOutUser: TestUser; … }>({ … });
export const { Given, When, Then, BeforeScenario } = createBdd(test);
```

playwright-bdd does need its own base `test`: `createBdd` refuses one without its fixtures (build step 1). So the
two are merged with `mergeTests`, and `signedOutUser`, `signInPage`, `accountMenu` and `latestResponse` are added on
top (see Test users and the decisions).

```ts
// bdd/steps/parameter-types.ts: {book} turns a title into the book the page objects open
defineParameterType({ name: 'book', regexp: /"([^"]+)"/, transformer: (title) => bookCalled(title) });
defineParameterType({ name: 'direction', regexp: /forward|back/, transformer: (word) => word });
```

```ts
// bdd/steps/reading.steps.ts: a custom type, {int} and optional text
When('I turn {int} page(s) {direction}', async ({ readerPage }, pages: number, direction: Direction) => {
  for (let turned = 0; turned < pages; turned++) {
    await (direction === 'forward' ? readerPage.nextPage() : readerPage.previousPage());
  }
});

// A plain-list data table. Contents names each link with its number first (`02 Chapter 2`).
Then('the chapters begin:', async ({ readerPage }, table: DataTable) => {
  const expected = table.raw().flat();
  const titles = async () => (await readerPage.panel.chapters.allInnerTexts()).slice(0, expected.length).map((text) => text.replace(/^\d+\s*/, ''));
  await expect.poll(titles).toEqual(expected);
});
```

```ts
// bdd/steps/hooks.ts: runs only for scenarios tagged @device-voice, before any page loads
BeforeScenario({ name: 'give the page a fake device voice', tags: '@device-voice' }, async ({ page }) => {
  await fakeDeviceSpeech(page);
});
```

A tag is used for the device voice, and a `Given` is not, because the fake voice is technical setup (CI machines
have no speech voices) and not something a reader does. Preconditions a reader would recognise ("I have downloaded
… for offline") stay as visible `Given` steps.

## Test users

- **Signed-in scenarios** use the `testUser` fixture, as the specs do: a fresh `e2e-` user per scenario, signed in
  by cookie, and deleted afterwards. Only the steps that need it ask for it (`I have an account and am signed in`),
  so the other scenarios create no user.
- **The sign-in feature needs a user who exists but is signed out**, because signing in is what it tests (AGENTS.md
  allows the form only there). `testUser` always signs in, so `bdd/steps/fixtures.ts` adds a `signedOutUser`
  fixture: it calls `TestApi.createUser({ signedIn: false })`, records the user in the run ledger, and deletes it
  afterwards, the same way `testUser` does. It stays in `bdd/` so `src/` stays unchanged (decision 2).
- No scenario creates a user through the sign-up form or touches a real account. The unknown username in scenario
  2 is generated with the run ID, so it can never be someone's account.

## Mocking

Only AGENTS.md's allowed cases, and only through the helpers in `src/mocking/`, which are what the specs use too:

- **Offline** (scenario 11): `When I lose my connection` calls `goOffline`.
- **Device read-aloud** (scenario 13): the `@device-voice` hook calls `fakeDeviceSpeech`.

The lint rule that keeps fakes inside `src/mocking/` covers `bdd/` too.

## Config and commands

**`playwright.bdd.config.ts`** imports the main config and replaces only what has to change. The main config stays
as it is.

- `testDir` becomes the folder that `defineBddConfig({ features: 'bdd/features', steps: 'bdd/steps', missingSteps:
  'fail-on-gen' })` returns.
- The `setup` and `cleanup` projects keep `testDir: './tests'`, so the existing sweep and teardown run before and
  after the BDD run.
- The browser projects and the `http` project are reused unchanged, so their `grep` and `grepInvert` send `@api`
  and `@http` scenarios to the `http` project and everything else to the browsers.
- Everything else (basic auth, timeouts, `trace` off in CI, reporters, `forbidOnly`) comes from the main config, so
  the guards in `meta/config.test.ts` still hold.

**Scripts** in `package.json`:

| Script | Does |
| --- | --- |
| `npm run test:bdd` | `bddgen --config playwright.bdd.config.ts`, then `node scripts/playwright.ts test --config playwright.bdd.config.ts` |
| `npm run test:bdd:ui` | the same, in UI mode |
| `npm run bdd:steps` | `bddgen export`: prints every step sentence |

To run part of the set, filter by tag. Use `--grep @smoke` when running, or a Cucumber tag expression when
generating: `npx bddgen --tags "@smoke and not @slow"`. `bddgen` only reads files and writes the generated tests,
so it runs on the host without a browser. The tests run in the pinned image, as `npm test` does. `npm test` itself
is unchanged and does not run the BDD scenarios.

**Repository settings**

- `.gitignore`: add `.features-gen/`.
- `eslint.config.js`: apply the `tests/**` rules (role locators only, mocking only through `src/mocking/`) to
  `bdd/**/*.ts` too, and ignore `.features-gen/`.
- `tsconfig.json` already includes `**/*.ts`, and Prettier skips `.feature` files.

## Page-object additions

The steps need a few actions the page objects don't have yet. Each one is a new method or a new page object in
`src/`. Nothing that existing specs use is changed. The API and HTTP scenarios need no additions, because
`FolioApi` and `request` already do everything they need.

As built:

| Needed for | Addition |
| --- | --- |
| 1–4 | `SignInPage` (new, `src/pages/sign-in-page.ts`): `open()`, `signIn(username, password)`, `heading`, `error` |
| 3 | `AccountMenu` (new, `src/components/account-menu.ts`): `menu`, `signOut()`. Dev puts Sign out in the account menu |
| 3 | `waitForHydration(locator)` (new, `src/support/hydration.ts`), used by `AccountMenu` |
| 5 | `HomePage.answer(text)` (`openQuestion` already exists) |
| 6 | `LibraryPage.selectedFilters` and `LibraryPage.books` (`filterBy` already exists) |
| 7 | `LibraryPage.book(title)`, `LibraryPage.openBook(title)`, `BookPage.startReadingLink`, `BookPage.startReading()` |
| 8 | `ReaderPage.pageNavigation`, `pagePosition`, `nextPageLink`, `previousPageLink`, `nextPage()`, `previousPage()` |
| 9–10 | `BookPanel.contentsTab`, `chapters`, `chapter(n)`, `showContents()`, `goToChapter(n)` |
| 12 | `BookPage.removeDownload()` (`downloadForOffline` and `removeDownloadButton` already exist) |

The page objects are injected as fixtures in `bdd/steps/fixtures.ts` (`signInPage`, `accountMenu`), not in
`src/fixtures/test.ts`, which stays unchanged.

## CI

There will be one new `bdd` job in `ci.yml`. It runs in the same pinned image with the same secrets, as a single
shard, and writes a blob report that the existing report job merges. That way there is one HTML report, which goes
through the same secret scan and is published to Pages. Burn-in also runs changed `.feature` files five times, as
it does for changed specs.

## Build order

Each step is checked locally before the next one starts, and everything is pushed once at the end.

| Step | Work | Done when |
| --- | --- | --- |
| 1. Wiring | Install `playwright-bdd@9.2.1`, add `playwright.bdd.config.ts`, the scripts, `bdd/steps/fixtures.ts`, gitignore and lint scopes, and only `home.feature` (scenario 5) | `npm run test:bdd` passes in every project, the scenario appears in the HTML report under its name with its Gherkin steps, a sentence with no step fails generation, and `npm run check` passes |
| 2. Confirm on dev | Use the planner agent to find the exact labels and text: the home question and answer, the filter, the sign-in form, its error and sign-out, the back button, the chapter list | Every `<…>` in this plan is filled in, or the scenario is changed |
| 3. Browsing and reading | `library`, `reading`, `offline-reading` and `read-aloud` features (scenarios 6–13), the parameter types, the `@device-voice` hook and the page-object additions | Each passes in every project ×5 (`--repeat-each=5`) |
| 4. Sign-in | `signedOutUser`, `SignInPage`, `sign-in.feature` (scenarios 1–4) | Passes in every project ×5, and no `e2e-` user is left behind afterwards |
| 5. API and HTTP | `account-api` and `security-headers` features (scenarios 14–18) | They pass ×5 in the `http` project only, and scenario 18 is reported as an expected failure |
| 6. CI and docs | The `bdd` job, burn-in for `.feature` files, a meta test that the BDD config keeps the main config's guards, `bdd/README.md` (with the "BDD features shown" tables from this plan), a blueprint row, and an ADR ("BDD through playwright-bdd, not cucumber-js") | CI is green, and the merged report shows both the specs and the scenarios |

## Out of scope

- Changing or removing any spec in `tests/`.
- Accessibility scans, visual checks and performance budgets in the BDD scenarios. The specs already cover them.
  The console-error check still runs, because it is a fixture.
- Search, and anything near the third-party features (AGENTS.md).
- A Gherkin linter (e.g. `gherkin-lint`). It can be added later if the feature files grow.

## Decisions

Made on 2026-11-11, after review.

1. **Folder: a top-level `bdd/`**, not `tests/bdd/`. `npm test` and the main config stay exactly as they are,
   and the BDD layer is easy to find.
2. **`signedOutUser` stays in `bdd/steps/fixtures.ts`.** `src/` stays unchanged. The fixture repeats about ten lines
   of `testUser`'s create-and-delete logic. If a spec ever needs a signed-out user, move it into
   `src/fixtures/test.ts` as a `signedIn` option on `testUserOptions` and have the BDD layer use that.
3. **CI: a separate `bdd` job**, not part of the e2e shards. Its blob report is merged with theirs, so there is
   still one HTML report.
4. **Steps are written in the first person** ("I sign in…", "I am reading…"), as drafted. It is the usual Gherkin
   style, and it keeps sentences short.
5. **Playwright's HTML report only**, as ADR 0003 says. It already shows each scenario's Gherkin lines as steps.
   Cucumber's own reports stay in "Not shown, on purpose".
6. **The full set of 18 scenarios** (78 tests and about 28 test users per run). Every outline row shows something
   or checks a real case, and the run stays well inside dev's 300-user limit.

Made while building, on 2026-11-11, by the implementer (the instruction was to take the recommended option, within
AGENTS.md, and record it here):

7. **`mergeTests(bddTest, frameworkTest)`** in `bdd/steps/fixtures.ts`. Build step 1 found that `createBdd` refuses a
   `test` without playwright-bdd's fixtures, which the framework's `test` doesn't have.
8. **`featuresRoot: 'bdd/features'`**, so generated tests are `.features-gen/<name>.feature.spec.js` rather than
   `.features-gen/bdd/features/…`. The report and burn-in can then filter by the feature file's name.
9. **The `setup`, `cleanup` and `agents` projects keep `testDir: './tests'`** in the BDD config; every other project
   is reused unchanged. `meta/bdd-config.test.ts` checks the guards, the projects and their `grep`.
10. **ESLint enforces "assertions in `Then` steps only"**: in `bdd/steps/`, `eslint-plugin-playwright` treats `Then`
    as a test block (`settings.playwright.globalAliases`), so `expect` in a `Given`, a `When` or a hook is a
    standalone-expect error, and a `Then` without one fails `expect-expect` (an error there).
11. **`matchKeywords: true`.** The drafts use one sentence as a `Given` that opens a chapter and a `Then` that
    checks it (`I am reading chapter {int} of {book}`); without keyword matching the two definitions clash. It is
    one more playwright-bdd feature shown. Its catch: `*` matches any keyword, so the API background, drafted as
    `* I am signed in`, also matched the sign-in feature's `Then I am signed in`; it became
    `* I have an account and am signed in`, which mirrors the sign-in feature's background.
12. **`{book}` resolves titles through a small table** (`SERIES` in `bdd/steps/parameter-types.ts`): the slug comes
    from the title, but the library path also needs the series (`jane-austen/pride-and-prejudice`), which isn't in
    the title. An unknown title fails with the list of known ones.
13. **Steps share state through a `latestResponse` fixture**: a `When` that sends a request keeps Folio's answer,
    and `Then Folio answers {int}` reads it. Fixtures are playwright-bdd's way to share state between steps.
14. **`signInPage`, `accountMenu` and `latestResponse` are BDD-only fixtures**, beside `signedOutUser`, so
    `src/fixtures/test.ts` stays unchanged (decision 2's reasoning). Move them there if a spec needs them.
15. **The page navigation's links turn pages, not `turnPage()`'s button**: on phone and tablet only the links exist.
    `turnPage()` is left as it is for the specs that use it; `nextPage()` and `previousPage()` are new.
16. **`waitForHydration`** (`src/support/hydration.ts`): Folio's pages show before React hydrates them, and on dev a
    click or typing that comes first is lost (see the changes below). Nothing on screen shows when hydration is
    done, so it waits for the props React keeps on each element it has hydrated. It is used only where the race was
    shown: the account menu.
17. **The planner's findings are saved as a plan**, [specs/bdd.md](../specs/bdd.md), as the agents' rules ask, rather
    than kept only in this document.
18. **The CI `bdd` job runs on the same events as e2e** (pushes, pull requests from this repository, nightly, manual)
    and `CI passed` needs it; a fork's pull request skips it, like e2e. Burn-in runs a changed feature's generated
    test with `npm run test:bdd -- <name>.feature --repeat-each=5 --retries=0`, and writes its HTML report to
    `bdd-report/`, beside the specs' `playwright-report/`; both are scanned for secrets before upload.
19. **`sign-in.feature` keeps all five scenarios in every browser project**, despite dev's sign-in limit (see the
    changes below): 20 sign-ins a run is far below where dev started refusing. Burning it in locally needs a pause
    between halves; in CI a burn-in runs on a fresh runner. If CI ever trips the limit, run the sign-in feature in
    Chromium only, rather than retrying.
20. **Nothing was committed.** The owner asked to review the work before any commit, so build step 6's "commit each
    step" was left to them, and nothing was pushed.

## Changes from the reviewed plan

Found on dev or in playwright-bdd 9.2.1 while building (2026-11-11). Each one adapts the plan rather than stopping.

| What the plan said | What dev or playwright-bdd does | Change |
| --- | --- | --- |
| `createBdd(test)` with the framework's `test` | `createBdd` needs playwright-bdd's fixtures | `mergeTests` (decision 7) |
| Home question and answer to confirm | Seven questions; answers are paragraphs | "Do I need an account to read?" and its answer, in a doc string wrapped over two lines (matching ignores the line break) |
| Filter to confirm; "Then that filter is selected" | Filters are `All` and `Classic novels`, pressed when active. A `Then` can't know which filter "that" is without shared state | `When I filter by "Classic novels"` / `Then "Classic novels" is the only filter selected`, which also checks `All` is no longer pressed |
| The library, signed in | Signed in, a free test user's library shows "Your library is empty" and only `All` | The library scenarios stay signed out, as drafted |
| `BookPage.startReading()` presses a button | "Start reading" is a link to `/read/<book>/chapter-1` | `startReadingLink` |
| "I turn 2 pages forward / back" | Chapter 1 has two pages; past its last page Next page becomes the next chapter, and on its first page there is no Previous page, only a disabled Start of book | "I turn 1 page forward / back", which still shows `{int}`, optional `page(s)` and `{direction}` |
| `ReaderPage.previousPage()` beside `turnPage()` | On phone and tablet there are no Next and Previous page buttons, only links in "Page navigation" | `nextPage()` and `previousPage()` use the links (decision 15) |
| "Then I see the first page again" | "Page navigation" shows `Chapter 1 · Page 1 of 2` | It checks the position reads `Page 1 of …` |
| Contents lists "Chapter 1", "Chapter 2" … | Each link is named with its number first: `01 Chapter 1` | `chapter(n)` matches the end of the name; the data table still lists `Chapter 1` …, and the step drops the number |
| "And I open chapter 2" (offline) | A sentence without the book can't know which book, short of shared state | `And I open chapter 2 of "Pride and Prejudice"` |
| Remove download asks to confirm? | No confirmation; Download for offline comes straight back | `removeDownload()` is one click |
| "When I open my highlights" / "Then I am on my highlights page" | `/account/highlights` signed out redirects to `/login?next=…`; `HighlightsPage.open(book)` exists, for one book | "When I open my highlights in {book}" / "Then I see my highlights in {book}", using the existing page object, so no new method |
| "And I see my account" | After signing in, Folio goes to the library. The account menu shows the username, in the sidebar on wide screens and in the banner on narrow ones (both are in the page; one shows) | It checks the account menu on screen shows the username |
| `signOut()` "wherever dev puts it" | In the account menu (a `<details>`), after Account, My books, Highlights, Flashcards and API keys; afterwards Folio goes to the library | `AccountMenu.signOut()` opens the menu on screen and presses Sign out |
| Sign-in error text to confirm | `alert`: "Username or password is incorrect."; the address gets `?error=invalid` | Used as is |
| `* I am signed in` | Matches `Then I am signed in` too, with `matchKeywords` | `* I have an account and am signed in` (decision 11) |
| A bookmark at chapter 2, page 3 | Chapter 2 has two pages | Chapter 2, page 2 |
| — | **A Folio bug: clicks and typing before hydration are lost.** On a page just loaded, a click on the account menu is lost (Chromium opens it and React closes it again; Firefox doesn't open it), and a sign-out sent then is cut off by the router's first load (the trace shows the `POST /logout` aborted), leaving the reader signed in. Found under `--repeat-each` | `AccountMenu` waits for hydration before acting (decision 16). Worth raising with Folio |
| — | **Dev limits form sign-ins, silently.** After roughly 200–250 sign-ins from this machine in about an hour (the step 4 burn-in and the debugging around it), dev answered every sign-in, right password included, with `303` to `/login?error=invalid`: no `429`, no `Retry-After`. The existing `security-headers.spec.ts` cookie test, which signs in over HTTP, failed too. Refused at 22:24 UTC, accepted again at 22:35 | Step 4's ×5 (100 sign-ins) was run in two halves 15 minutes apart. A normal BDD run signs in 20 times (5 per browser project) and CI's burn-in of `sign-in.feature` 100 times, from one runner. Noted in `bdd/README.md`; worth asking Folio what the limit is |
