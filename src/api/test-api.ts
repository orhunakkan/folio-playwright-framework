import type { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';
import { env } from '../config/env.ts';

/** Every account the test API creates starts with this. Nothing else may be touched. */
const TEST_USER_PREFIX = 'e2e-';

const PlanSchema = z.enum(['free', 'pro']);
export type Plan = z.infer<typeof PlanSchema>;

const TestUserSchema = z.object({
  username: z.string().startsWith(TEST_USER_PREFIX),
  password: z.string().min(1),
  plan: PlanSchema,
});
export type TestUser = z.infer<typeof TestUserSchema>;

/**
 * Dev handles test API writes one at a time: a create takes about 0.5–1.5 s on its own, a delete about 1 s.
 * With many workers they queue (10 creates at once took up to 10 s), so these calls get a longer timeout
 * than page actions.
 */
const TEST_API_TIMEOUT = 30_000;

const SweepSchema = z.object({ deleted: z.number().int().nonnegative() });

export interface CreateUserOptions {
  plan?: Plan;
  starter?: boolean;
  /** When true, the response sets a session cookie on the request context that made the call. */
  signedIn?: boolean;
}

/**
 * Client for Folio's test API on dev (contract: docs/framework-blueprint.md#decided-test-users-on-dev).
 *
 * Pass it a request context that already has dev's baseURL and basic-auth credentials, such as Playwright's
 * `request` fixture or `context.request`. The client adds the test token to each call itself.
 */
export class TestApi {
  readonly #request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.#request = request;
  }

  async createUser(options: CreateUserOptions = {}): Promise<TestUser> {
    let response = await this.#call('post', '/test-api/users', options);
    if (response.status() === 429) {
      // At most 300 test accounts can exist at once. Clear out stale ones and try once more.
      await this.sweep();
      response = await this.#call('post', '/test-api/users', options);
    }
    expectStatus(response, [201], 'create a test user');
    return TestUserSchema.parse(await response.json());
  }

  /** Deletes a test account. An account that is already gone (404) counts as deleted. */
  async deleteUser(username: string): Promise<void> {
    if (!username.startsWith(TEST_USER_PREFIX)) {
      throw new Error(`Refusing to delete "${username}": it is not a test account.`);
    }
    const response = await this.#call('delete', `/test-api/users/${encodeURIComponent(username)}`);
    expectStatus(response, [204, 404], `delete test user ${username}`);
  }

  /** Deletes test accounts older than 6 hours, and returns how many went. */
  async sweep(): Promise<number> {
    const response = await this.#call('post', '/test-api/sweep');
    expectStatus(response, [200], 'sweep old test users');
    return SweepSchema.parse(await response.json()).deleted;
  }

  #call(method: 'post' | 'delete', path: string, data?: object): Promise<APIResponse> {
    return this.#request[method](path, {
      headers: { 'X-Folio-Test-Token': env.FOLIO_TEST_API_TOKEN },
      timeout: TEST_API_TIMEOUT,
      ...(data && { data }),
    });
  }
}

function expectStatus(response: APIResponse, expected: number[], action: string): void {
  if (!expected.includes(response.status())) {
    // Status only: the request carried secrets, so don't echo its headers.
    throw new Error(
      `Test API could not ${action}: got ${String(response.status())}, expected ${expected.join(' or ')}.`,
    );
  }
}
