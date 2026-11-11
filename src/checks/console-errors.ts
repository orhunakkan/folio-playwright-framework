import type { BrowserContext, ConsoleMessage, TestInfo, WebError } from '@playwright/test';

/**
 * Console errors Folio is known to log, left out of the check until they are fixed. Each pattern is as narrow as
 * possible. Delete an entry as soon as dev stops logging it.
 *
 * Empty on purpose: on 2026-11-11 dev logged no console errors and no page errors on any page the tests visit, in
 * Chromium or Firefox. That includes Cloudflare's analytics beacon, which loads and reports on every page silently.
 */
const KNOWN_CONSOLE_ERRORS: { pattern: RegExp; reason: string }[] = [];

/**
 * Starts recording console errors (`console.error`, failed `console.assert`) and uncaught page errors in every page
 * of the context. The returned function lists the ones that are not known, as readable one-line strings.
 */
export function watchConsoleErrors(context: BrowserContext, testInfo: TestInfo): () => string[] {
  const errors: string[] = [];

  context.on('console', (message: ConsoleMessage) => {
    if (message.type() !== 'error' && message.type() !== 'assert') return;
    const { url, lineNumber } = message.location();
    errors.push(`console.${message.type()}: ${message.text()}${url ? ` (${url}:${String(lineNumber)})` : ''}`);
  });
  context.on('weberror', (webError: WebError) => {
    errors.push(`page error: ${webError.error().message}`);
  });

  return () =>
    errors.filter((error) => {
      const known = KNOWN_CONSOLE_ERRORS.find(({ pattern }) => pattern.test(error));
      if (known) testInfo.annotations.push({ type: 'known console error', description: known.reason });
      return !known;
    });
}
