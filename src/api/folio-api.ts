import { test, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { DEV_URL } from '../config/env.ts';
import type { HighlightColor } from './schemas.ts';

/** A place in a book, as Folio's endpoints take it. */
export interface Position {
  /** e.g. `chapter-1` */
  chapter: string;
  page: number;
}

export interface NewHighlight {
  book: string;
  position: Position;
  /** The highlighted text, and where it starts and ends in the page's text. */
  text: string;
  start: number;
  end: number;
  color: HighlightColor;
}

/**
 * Client for Folio's own JSON endpoints: the ones the reader calls to save bookmarks, highlights and reading
 * places, the account export, and the health check and app manifest. Schemas are in `schemas.ts`.
 *
 * Pass it `context.request` from a test with `testUser`, which shares the signed-in browser context's cookies, or
 * the `request` fixture to call as a signed-out visitor. Both have dev's baseURL and basic auth, and redact their
 * errors. Like a page object, it doesn't assert: each method returns Folio's response, and the spec checks the
 * status and reads the body with `readJson`.
 *
 * Folio refuses cross-origin writes (403), so every write says it comes from dev, as the reader's own do.
 */
export class FolioApi {
  readonly #request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.#request = request;
  }

  health(): Promise<APIResponse> {
    return this.#step('GET /healthz', () => this.#request.get('/healthz'));
  }

  manifest(): Promise<APIResponse> {
    return this.#step('GET /manifest.webmanifest', () => this.#request.get('/manifest.webmanifest'));
  }

  /** Everything Folio holds about the signed-in account. Signed out, it redirects to sign in (302). */
  exportAccount(): Promise<APIResponse> {
    return this.#step('GET /account/export', () => this.#request.get('/account/export', { maxRedirects: 0 }));
  }

  createBookmark(book: string, position: Position): Promise<APIResponse> {
    return this.#write('/account/bookmarks/new', { book, position });
  }

  deleteBookmark(id: string): Promise<APIResponse> {
    return this.#write(`/account/bookmarks/${id}`, { intent: 'delete' });
  }

  createHighlight(highlight: NewHighlight): Promise<APIResponse> {
    return this.#write('/account/highlights/new', highlight);
  }

  /** Sets a highlight's note; an empty note removes it. */
  noteHighlight(id: string, note: string): Promise<APIResponse> {
    return this.#write(`/account/highlights/${id}`, { intent: 'update', note });
  }

  deleteHighlight(id: string): Promise<APIResponse> {
    return this.#write(`/account/highlights/${id}`, { intent: 'delete' });
  }

  /** Saves where the user is reading, as the reader does when a page turns. `at` is when, in ms since 1970. */
  syncReadingPlace(book: string, position: Position, at: number): Promise<APIResponse> {
    return this.#write('/account/sync', { reading: [{ book, position, at }] });
  }

  /** A write with any JSON body and headers, for checking how Folio answers a bad request. */
  post(path: string, data: unknown, options: { sameOrigin?: boolean } = {}): Promise<APIResponse> {
    const { sameOrigin = true } = options;
    return this.#step(`POST ${path}`, () =>
      this.#request.post(path, { data, maxRedirects: 0, ...(sameOrigin && { headers: { Origin: DEV_URL } }) }),
    );
  }

  #write(path: string, data: unknown): Promise<APIResponse> {
    return this.post(path, data);
  }

  #step(title: string, call: () => Promise<APIResponse>): Promise<APIResponse> {
    return test.step(title, call, { box: true });
  }
}

/**
 * Reads a response's JSON body through a schema, and returns it typed. If the body doesn't match, the error lists
 * where and how, but never the body's values: some responses (the account export) hold IP addresses.
 */
export async function readJson<Schema extends z.ZodType>(
  response: APIResponse,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const result = schema.safeParse(await response.json());
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(body)'}: ${issue.message}`);
  throw new Error(`${response.url()} (${String(response.status())}) doesn't match the schema:\n${issues.join('\n')}`);
}
