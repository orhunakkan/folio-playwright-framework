import { expect, test } from '../../src/fixtures/test.ts';

// The seed for Playwright's test agents (see docs/test-agents.md): it sets up the page they explore and generate
// from. It runs only in the `agents` project, which exists when AGENTS=true (.mcp.json sets it), never in a normal
// run. The user is a fresh test user, signed in by cookie and deleted afterwards, like every test's.
test('seed', async ({ page, testUser }) => {
  await page.goto('/library');
  await expect(page).toBeSignedIn({ as: testUser.username });
});
