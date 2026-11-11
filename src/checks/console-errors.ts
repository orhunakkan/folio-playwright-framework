import type { BrowserContext, ConsoleMessage, TestInfo, WebError } from '@playwright/test';

/** The annotation `goOffline` (src/mocking/offline.ts) adds, so known errors of offline pages can be scoped to it. */
export const WENT_OFFLINE = 'went offline';

/**
 * Console errors Folio is known to log, left out of the check until they are fixed. Each pattern is as narrow as
 * possible, and `onlyWhen` narrows it to tests carrying that annotation. Delete an entry as soon as dev stops
 * logging it.
 *
 * On 2026-11-11 dev logged no console errors and no page errors on any page the tests visit online, in Chromium or
 * Firefox. That includes Cloudflare's analytics beacon, which loads and reports on every page silently.
 */
const KNOWN_CONSOLE_ERRORS: { pattern: RegExp; onlyWhen?: string; reason: string }[] = [
  {
    pattern: /^page error: Minified React error #418;/,
    onlyWhen: WENT_OFFLINE,
    reason: 'Folio bug: a downloaded chapter opened offline throws React error #418 (hydration mismatch) in Chromium (found 2026-11-11).',
  },
];

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

  const hasAnnotation = (type: string): boolean => testInfo.annotations.some((annotation) => annotation.type === type);

  return () =>
    errors.filter((error) => {
      const known = KNOWN_CONSOLE_ERRORS.find(({ pattern, onlyWhen }) => pattern.test(error) && (onlyWhen === undefined || hasAnnotation(onlyWhen)));
      if (known) testInfo.annotations.push({ type: 'known console error', description: known.reason });
      return !known && !expectedByTheTest(error, testInfo);
    });
}

/** The annotation a fake in src/mocking/ adds for the console error it causes on purpose. */
export const EXPECTED_CONSOLE_ERROR = 'expected console error';

/**
 * Errors the test causes on purpose, e.g. the browser's "Failed to load resource" for a request a fake failed.
 * Only src/mocking/ adds them, each as narrow as the fake, and the report shows them on the test.
 */
function expectedByTheTest(error: string, testInfo: TestInfo): boolean {
  return testInfo.annotations.some(({ type, description }) => type === EXPECTED_CONSOLE_ERROR && description !== undefined && error.includes(description));
}
