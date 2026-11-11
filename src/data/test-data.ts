import { createHash } from 'node:crypto';
import { en, Faker } from '@faker-js/faker';
import { RUN_ID } from '../config/run.ts';

/**
 * A test's own seed, from the run's base seed and the test's identity. The same base seed gives every test the
 * same data again, whatever order or worker it runs in.
 */
export function testSeed(baseSeed: number, testId: string, repeatEachIndex: number): number {
  return createHash('sha256')
    .update(`${String(baseSeed)}:${testId}:${String(repeatEachIndex)}`)
    .digest()
    .readUInt32BE();
}

/**
 * Factories for the data tests type into Folio. Realistic text from a seeded Faker, and every value a user could
 * see on dev starts with the run ID, so it can be traced back to the run that made it.
 */
export class TestData {
  readonly #faker: Faker;

  constructor(seed: number) {
    this.#faker = new Faker({ locale: [en] });
    this.#faker.seed(seed);
  }

  /** A note on a highlight, e.g. `[local-20261111T0820-a3f9] Quia et voluptas …`. */
  note(): string {
    return `[${RUN_ID}] ${this.#faker.lorem.sentence({ min: 6, max: 12 })}`;
  }
}
