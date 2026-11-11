import { TestApi } from '../src/api/test-api.ts';
import { test } from '../src/fixtures/test.ts';
import { closeRun, forgetUser, leftoverUsers, staleRuns } from '../src/support/run-ledger.ts';

/** No run takes this long, so a ledger untouched for an hour belongs to a run that was interrupted. */
const STALE_RUN_MS = 60 * 60_000;

test('sweep test users left over from earlier runs', async ({ request }) => {
  const deleted = await new TestApi(request).sweep();
  test.info().annotations.push({ type: 'swept test users', description: String(deleted) });
});

test('delete test users that interrupted runs on this machine left behind', async ({ request }) => {
  const testApi = new TestApi(request);
  for (const run of staleRuns(STALE_RUN_MS)) {
    for (const username of leftoverUsers(run)) {
      await testApi.deleteUser(username);
      forgetUser(username, run);
      test.info().annotations.push({ type: 'deleted leftover user', description: `${username} (run ${run})` });
    }
    closeRun(run);
  }
});
