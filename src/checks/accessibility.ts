import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';

/** The standard every page is held to: WCAG 2.2, levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Real Folio bugs, left out of every scan until they are fixed. Each entry is as narrow as possible, so the
 * rest of the page is still scanned. Delete an entry as soon as dev has the fix.
 */
const KNOWN_ISSUES: { exclude: string; reason: string }[] = [
  {
    exclude: '[aria-label="Pages in this chapter"] a',
    reason: "Folio bug: the reader's page dots are 18×6 px and 6×6 px links, under the 24 px minimum (WCAG 2.2 AA 2.5.8, axe rule target-size).",
  },
];

export interface AccessibilityViolation {
  rule: string;
  impact: string | null | undefined;
  help: string;
  targets: string[];
}

/**
 * Scans the page as it is now and returns its violations, summarised so a failing
 * `expect(...).toEqual([])` reads well. The full axe results are attached to the report, and each known
 * issue that was left out is noted on the test.
 */
export async function scanAccessibility(page: Page, testInfo: TestInfo): Promise<AccessibilityViolation[]> {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  for (const issue of KNOWN_ISSUES) {
    builder.exclude(issue.exclude);
    testInfo.annotations.push({ type: 'known accessibility issue', description: issue.reason });
  }
  const results = await builder.analyze();
  await testInfo.attach('accessibility scan', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  return results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}
