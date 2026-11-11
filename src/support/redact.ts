import type { APIRequestContext } from '@playwright/test';
import { env } from '../config/env.ts';

/**
 * When an API request fails (a timeout, a dropped connection), Playwright's error lists the request's headers,
 * including dev's basic-auth header and the test API token. The error ends up in the console, the `github`
 * reporter's annotations and the HTML report, all public in CI. So the framework redacts it before any reporter
 * sees it.
 */
/**
 * Every secret value, by name. `DEV_BASIC_USER` on its own isn't one: the basic-auth header covers it, and alone it
 * is too short and common to look for.
 */
export const SECRETS: { name: string; value: string }[] = [
  {
    name: 'basic-auth header (DEV_BASIC_USER:DEV_BASIC_PASS)',
    value: Buffer.from(`${env.DEV_BASIC_USER}:${env.DEV_BASIC_PASS}`).toString('base64'),
  },
  { name: 'DEV_BASIC_PASS', value: env.DEV_BASIC_PASS },
  { name: 'FOLIO_TEST_API_TOKEN', value: env.FOLIO_TEST_API_TOKEN },
];

const REDACTED = '[redacted]';

/** Replaces every secret in `text`, and the value of any credential header, with `[redacted]`. */
export function redact(text: string): string {
  let redacted = text.replace(/^(\s*(?:- )?(?:authorization|x-folio-test-token|cookie):).*$/gim, `$1 ${REDACTED}`);
  for (const { value } of SECRETS) redacted = redacted.replaceAll(value, REDACTED);
  return redacted;
}

const METHODS = ['fetch', 'get', 'post', 'put', 'patch', 'delete', 'head'] as const;

/** Makes every error a request context's calls throw safe to print. Returns the same context. */
export function redactErrors(request: APIRequestContext): APIRequestContext {
  for (const method of METHODS) {
    const original = request[method].bind(request) as (...args: unknown[]) => Promise<unknown>;
    Object.defineProperty(request, method, {
      configurable: true,
      value: async (...args: unknown[]) => {
        try {
          return await original(...args);
        } catch (error) {
          if (error instanceof Error) {
            error.message = redact(error.message);
            if (error.stack) error.stack = redact(error.stack);
          }
          throw error;
        }
      },
    });
  }
  return request;
}
