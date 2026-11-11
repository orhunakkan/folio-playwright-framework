import { TestApi } from '../src/api/test-api.ts';
import { test } from '../src/fixtures/test.ts';
import { closeRun, forgetUser, leftoverUsers } from '../src/support/run-ledger.ts';

// Runs after every other project. Each test deletes its own user, so normally there is nothing left to delete.
test('delete test users this run left behind', async ({ request }) => {
  const testApi = new TestApi(request);
  for (const username of leftoverUsers()) {
    await testApi.deleteUser(username);
    forgetUser(username);
    test.info().annotations.push({ type: 'deleted leftover user', description: username });
  }
  closeRun();
});
