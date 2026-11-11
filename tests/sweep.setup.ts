import { TestApi } from '../src/api/test-api.ts';
import { test } from '../src/fixtures/test.ts';

test('sweep test users left over from earlier runs', async ({ request }) => {
  const deleted = await new TestApi(request).sweep();
  test.info().annotations.push({ type: 'swept test users', description: String(deleted) });
});
