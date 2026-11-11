// Playwright's test agents (docs/test-agents.md) are adapted to this repository's rules. Re-running
// `npx playwright init-agents` overwrites the adaptations; these checks catch that.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const AGENTS = ['planner', 'generator', 'healer'].map((name) => `.claude/agents/playwright-test-${name}.md`);

/** Tools that could show dev's credentials or the token, or fake the network outside src/mocking/. */
const DENIED = [
  'browser_network_request',
  'browser_network_requests',
  'browser_get_config',
  'browser_run_code_unsafe',
  'browser_start_tracing',
  'browser_stop_tracing',
  'browser_route',
  'browser_unroute',
  'browser_network_state_set',
  'browser_storage_state',
  'browser_set_storage_state',
];

test('the MCP server runs in the pinned image, headless, with the agents project', () => {
  const server = (JSON.parse(read('.mcp.json')) as { mcpServers: Record<string, unknown> }).mcpServers[
    'playwright-test'
  ];
  assert.deepEqual(server, {
    command: 'node',
    args: ['scripts/playwright.ts', 'run-test-mcp-server', '--headless'],
    env: { AGENTS: 'true' },
  });
});

test('tools that could expose secrets are denied for every agent', () => {
  const { permissions } = JSON.parse(read('.claude/settings.json')) as { permissions: { deny: string[] } };
  for (const tool of DENIED) assert.ok(permissions.deny.includes(`mcp__playwright-test__${tool}`), tool);
  for (const file of AGENTS) {
    const tools = /^tools: (.*)$/m.exec(read(file))?.[1]?.split(', ') ?? [];
    for (const tool of DENIED) assert.ok(!tools.includes(`mcp__playwright-test__${tool}`), `${file} lists ${tool}`);
  }
});

test("every agent carries this repository's rules", () => {
  for (const file of AGENTS) {
    const agent = read(file);
    assert.match(agent, /## Rules for this repository/, file);
    assert.match(agent, /tests\/agents\/signed-in\.seed\.ts/, file);
  }
});
