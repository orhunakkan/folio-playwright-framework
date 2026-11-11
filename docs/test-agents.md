# Playwright test agents

Playwright ships three AI agents for writing and fixing tests: a **planner** that explores the app and writes a test
plan, a **generator** that turns a plan into test code, and a **healer** that runs failing tests and fixes them. They
are Claude Code subagents here, in [.claude/agents/](../.claude/agents/), and drive a browser through Playwright's
test MCP server, configured in [.mcp.json](../.mcp.json). They work within [AGENTS.md](../AGENTS.md): every rule
there applies to them as it does to people.

## Using them

1. Open the repository in Claude Code and approve the `playwright-test` MCP server when asked (it comes from
   `.mcp.json`). It starts in the pinned Playwright image (`node scripts/playwright.ts run-test-mcp-server`), like
   every run, so Docker must be running and `.env` filled in.
2. Ask for the agent by name, with the journey and where the result goes:
   - **Planner**: "Use the playwright-test-planner agent to plan the highlights journey in the reader. Save it as
     `specs/highlights.md`." It sets up the page with the seed, explores dev, and saves a Markdown plan.
   - **Generator**: "Use the playwright-test-generator agent to generate the tests in `specs/highlights.md` into
     `specs/drafts/`." It replays each step in the browser and writes what it did as a test.
   - **Healer**: "Use the playwright-test-healer agent to fix `tests/<spec>.spec.ts`." It runs the spec, debugs
     the failure in the browser, and edits the code.
3. Review everything they write as you would a contributor's pull request.

## What is adapted, and why

The files came from `npx playwright init-agents --loop=claude --project=chromium` (Playwright 1.65, 2026-11-11),
then changed to fit this repository. `meta/agents.test.ts` fails if a later `init-agents` undoes any of it, so after
a Playwright upgrade, regenerate, re-apply these, and let the meta-test confirm.

- **The MCP server runs in the pinned image, headless.** `npx playwright run-test-mcp-server` would run on the
  host, with the host's browsers. `scripts/playwright.ts` keeps stdin open for it (`--interactive`, no terminal).
- **The seed is `tests/agents/signed-in.seed.ts`, in an `agents` project** that exists only when `AGENTS=true`,
  which `.mcp.json` sets. It opens the library signed in as a fresh test user from the test API, deleted when the
  agent is done, so agents never use the sign-up form or a real account. A normal run never sees it: `.seed.ts`
  matches no other project. The generated `tests/seed.spec.ts`, which imported from `@playwright/test` and would
  have run in every project, is gone.
- **Tools that could expose secrets are denied**, in `.claude/settings.json` for every agent and session, and
  removed from the agents' tool lists: request details (they show dev's basic-auth header and the test API token),
  `browser_run_code_unsafe` (it runs in Node, which can read the environment), `browser_get_config` (the config
  holds the credentials), tracing (traces record headers), and storage state. Routing and network-state tools are
  denied too: faking the network belongs in `src/mocking/`, for the five allowed cases only.
- **Each agent ends with "Rules for this repository"**: dev only, start from the seed, never press a third-party
  feature (Ask, Explain, Translate, quizzes, flashcards, voices, word lookup, cover search, billing, email), never
  read headers or the environment, plans in `specs/`, generated tests as drafts in `specs/drafts/`.

## From draft to spec

A generated test is a draft. It records clicks with whatever locators worked, imports from `@playwright/test`, and
knows nothing of the framework, so it is never committed to `tests/` as it is. Rewrite it in the framework's style
([CONTRIBUTING.md](../CONTRIBUTING.md#writing-a-spec)): `test` and `expect` from `src/fixtures/test.ts`, page objects
for locators and actions, role and label locators, `testUser` for the session, `testData` for typed text,
`toHaveStatus` on saves, and the accessibility and overflow checks. Then `npm run check` and
`npm test -- tests/<spec>.spec.ts --repeat-each=5`.

The plan is the lasting part: [specs/highlights.md](../specs/highlights.md) was made by the planner, and
`tests/highlights.spec.ts` was written from it.
