import { test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { DEV_URL } from '../config/env.ts';
import type { TestUser } from './test-api.ts';

/**
 * Signs in over HTTP, as the sign-in form does, and returns Folio's answer (a 303 on success) without following
 * it. Only for tests whose subject is signing in; everywhere else, use `testUser`, which is already signed in.
 * Folio refuses cross-origin form posts, so the request says it comes from dev.
 */
export function signInOverHttp(request: APIRequestContext, user: TestUser): Promise<APIResponse> {
  return test.step(
    `sign in as ${user.username} over HTTP`,
    () =>
      request.post('/login', {
        headers: { Origin: DEV_URL },
        form: { username: user.username, password: user.password },
        maxRedirects: 0,
      }),
    { box: true },
  );
}
