# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project

A public Playwright end-to-end test framework that showcases automation best practices. The app under test is
**Folio**, a library and reader web app. Folio's source code lives in a separate, private repository and is not part
of this project.

## Rules

### Test only the dev environment

All tests run against Folio's dev environment: **https://dev.agenticlibrary.app/**. Never point tests at production
or any other environment.

### Secrets stay in `.env` and GitHub Secrets

Dev's basic-auth credentials (`DEV_BASIC_USER`, `DEV_BASIC_PASS`) and the test API token (`FOLIO_TEST_API_TOKEN`)
live only in a local `.env` (gitignored) and in GitHub Secrets. Never commit them, print them, log them, put them in
test output or reports, or paste them into chat.

### Test users come from Folio's test API

Every test gets its own fresh user from the test API on dev, and deletes it afterwards (the contract is in
[docs/framework-blueprint.md](docs/framework-blueprint.md#decided-test-users-on-dev)).

- Never create users through the sign-up form. Sign-up confirms by a mailed link, and real email is out of scope.
- Never use, change or delete real accounts on dev, such as personal or shared QA accounts. Tests touch only `e2e-`
  accounts the test API created.
- Drive the sign-in form only in tests whose subject is signing in. Everywhere else, use the session cookie from
  `signedIn: true`.

### Use npm

The package manager is **npm**. Do not use pnpm, Yarn or Bun, and do not add their lockfiles. Commit
`package-lock.json` and install with `npm ci` in CI.

### Third-party services are out of scope

Do not test third-party services or the Folio features that depend on them.

- Out of scope: Ask the book, quizzes and flashcards (Anthropic), ElevenLabs voices, word lookup and translation
  (Wiktionary, Wikipedia), cover and details search (Open Library), billing (Paddle), and real email delivery.
- Tests must not trigger these features by accident. When a journey passes near one, stop before the third-party call.
- Do not add stubs, mocks or sandbox setups for third-party services. Since they are not tested, nothing needs to
  stand in for them.

### Mocking is limited to these cases

Tests run against the real Folio app with real data. Mocking is allowed only for the cases below, where the real
app cannot produce the situation on demand. No other mocking is allowed.

| Case | Why it needs faking | How |
| --- | --- | --- |
| **Error states in Folio's UI** | The real server cannot be made to return a 500 when a test wants it | `page.route` returns an error for one request |
| **Offline and flaky network** | Offline reading and "connection lost" messages need the network to drop | `context.setOffline()` or `page.route` aborts the request |
| **Slow responses** | Loading spinners, Stop buttons and timeouts are too fast to see against a real server | `page.route` with a delay |
| **Device read-aloud** | CI machines have no speech voices, so `speechSynthesis` does nothing | An init script (`page.addInitScript`) that fakes `speechSynthesis` |
| **Time** | Read-aloud progress, timers and relative times ("5 minutes ago") | `page.clock` controls time |

### Playwright's test agents follow these rules too

The planner, generator and healer in `.claude/agents/` are set up for this repository: they start from a signed-in
test user, run in the pinned image, can't read request headers or the environment, and never press third-party
features. Plans go in `specs/`; generated tests are drafts until rewritten in the framework's style. See
[docs/test-agents.md](docs/test-agents.md).
