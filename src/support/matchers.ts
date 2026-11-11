import type {
  APIRequestContext,
  APIResponse,
  BrowserContext,
  ExpectMatcherState,
  MatcherReturnType,
  Page,
  Response,
} from '@playwright/test';
import { z } from 'zod';
import { schemaIssues } from '../api/folio-api.ts';
import { BUDGETS, type WebVitals } from '../checks/web-vitals.ts';

/**
 * Domain matchers, added to `expect` in src/fixtures/test.ts. Each failure message says what Folio did in a user's
 * terms, and never prints a response body, which may hold IP addresses or other people's data.
 */

/** Who the account export says is signed in, or `null` when Folio sends a signed-out visitor to sign in. */
const SignedInSchema = z.object({ account: z.object({ username: z.string() }) });

/** How often `toBeSignedIn` asks Folio again, until it answers as expected or the timeout passes. */
const POLL_MS = 500;

async function whoIsSignedIn(request: APIRequestContext): Promise<string | null> {
  const response = await request.get('/account/export', { maxRedirects: 0 });
  if (response.status() === 302) return null;
  if (response.status() !== 200) throw new Error(`GET /account/export answered ${String(response.status())}`);
  return SignedInSchema.parse(await response.json()).account.username;
}

function requestName(response: Response | APIResponse): string {
  const { pathname } = new URL(response.url());
  return 'request' in response ? `${response.request().method()} ${pathname}` : pathname;
}

export const matchers = {
  /**
   * The browser (a page or its context) or a request context has a session Folio accepts, optionally as a given
   * user: `await expect(page).toBeSignedIn({ as: testUser.username })`. Asks Folio, so it holds on every screen
   * size; retries until the expect timeout. `.not.toBeSignedIn()` checks the visitor is signed out.
   */
  async toBeSignedIn(
    this: ExpectMatcherState,
    received: Page | BrowserContext | APIRequestContext,
    options: { as?: string; timeout?: number } = {},
  ): Promise<MatcherReturnType> {
    const request = 'request' in received ? received.request : received;
    const deadline = Date.now() + (options.timeout ?? this.timeout);
    const isSignedInAsAsked = (who: string | null): boolean =>
      who !== null && (options.as === undefined || who === options.as);

    let who = await whoIsSignedIn(request);
    while (isSignedInAsAsked(who) === this.isNot && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      who = await whoIsSignedIn(request);
    }

    const pass = isSignedInAsAsked(who);
    const expected = options.as === undefined ? 'signed in' : `signed in as ${options.as}`;
    const actual = who === null ? 'signed out' : `signed in as ${who}`;
    return {
      name: 'toBeSignedIn',
      pass,
      message: () =>
        `${this.utils.matcherHint('toBeSignedIn', undefined, '', { isNot: this.isNot })}\n\n` +
        `Expected: ${this.isNot ? 'not ' : ''}${expected}\nReceived: ${actual}`,
    };
  },

  /** A response's status, with the request named in the failure: `expect(saved).toHaveStatus(201)`. */
  toHaveStatus(this: ExpectMatcherState, received: Response | APIResponse, expected: number): MatcherReturnType {
    const status = received.status();
    const pass = status === expected;
    return {
      name: 'toHaveStatus',
      pass,
      expected,
      actual: status,
      message: () =>
        `${this.utils.matcherHint('toHaveStatus', undefined, undefined, { isNot: this.isNot })}\n\n` +
        `${requestName(received)} answered ${String(status)} ${received.statusText()}, ` +
        `expected ${this.isNot ? 'anything but ' : ''}${String(expected)}`,
    };
  },

  /**
   * A response's JSON body matches a zod schema: `await expect(response).toMatchSchema(OkSchema)`. The failure
   * lists where the body breaks the schema, never its values. To use the body as well, read it with `readJson`.
   */
  async toMatchSchema(this: ExpectMatcherState, received: APIResponse, schema: z.ZodType): Promise<MatcherReturnType> {
    const result = schema.safeParse(await received.json());
    return {
      name: 'toMatchSchema',
      pass: result.success,
      message: () =>
        `${this.utils.matcherHint('toMatchSchema', undefined, 'schema', { isNot: this.isNot })}\n\n` +
        (result.success
          ? `${requestName(received)}'s body matches the schema`
          : `${requestName(received)}'s body doesn't match the schema:\n${schemaIssues(result.error)}`),
    };
  },

  /**
   * Web vitals within their budgets (`BUDGETS` in src/checks/web-vitals.ts): `expect(vitals).toBeWithinBudgets()`.
   * The failure lists every metric against its budget.
   */
  toBeWithinBudgets(this: ExpectMatcherState, received: WebVitals): MatcherReturnType {
    const lines = [
      {
        name: 'LCP',
        value: received.lcp,
        budget: BUDGETS.lcp,
        unit: ' ms',
        text: `${String(Math.round(received.lcp))} ms`,
      },
      { name: 'CLS', value: received.cls, budget: BUDGETS.cls, unit: '', text: received.cls.toFixed(3) },
      { name: 'INP', value: received.inp, budget: BUDGETS.inp, unit: ' ms', text: `${String(received.inp)} ms` },
    ].map(({ name, value, budget, unit, text }) => {
      // False for NaN too: an LCP that was never measured is over its budget.
      const within = value <= budget;
      return { within, text: `${name} ${text}, ${within ? 'within' : 'over'} its budget of ${String(budget)}${unit}` };
    });
    return {
      name: 'toBeWithinBudgets',
      pass: lines.every(({ within }) => within),
      message: () =>
        `${this.utils.matcherHint('toBeWithinBudgets', undefined, '', { isNot: this.isNot })}\n\n` +
        lines.map(({ within, text }) => `${within ? '✓' : '✗'} ${text}`).join('\n'),
    };
  },
};
