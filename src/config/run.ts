import { randomBytes, randomInt } from 'node:crypto';
import { env } from './env.ts';

/**
 * One ID per run of the suite, so the data a run creates on dev can be traced back to it:
 * `ci-<GitHub run ID>-<attempt>` in CI (shared by every shard of the run), `local-<UTC time>-<4 hex>` locally.
 */
function newRunId(): string {
  const { GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT } = process.env;
  if (GITHUB_RUN_ID) return `ci-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT ?? '1'}`;
  const time = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13); // e.g. 20261111T0820
  return `local-${time}-${randomBytes(2).toString('hex')}`;
}

// Playwright loads the config in the runner first, then again in every worker, which inherit the runner's
// environment. Setting these on the first load makes every worker share the runner's values.
process.env.FOLIO_RUN_ID ??= newRunId();
process.env.FOLIO_FAKER_SEED ??= String(env.FAKER_SEED ?? randomInt(2 ** 31));

export const RUN_ID = process.env.FOLIO_RUN_ID;

/** The run's base Faker seed. Set `FAKER_SEED` to repeat a run's test data. */
export const FAKER_SEED = Number(process.env.FOLIO_FAKER_SEED);
