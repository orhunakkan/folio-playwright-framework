import type { Page, TestInfo } from '@playwright/test';

/**
 * Budgets, at Google's "good" thresholds (web.dev/articles/vitals): Largest Contentful Paint in ms, Cumulative
 * Layout Shift (unitless), and Interaction to Next Paint in ms.
 */
export const BUDGETS = { lcp: 2_500, cls: 0.1, inp: 200 } as const;

export interface WebVitals {
  /** When the largest text or image was painted, in ms from the start of navigation. */
  lcp: number;
  /** The largest burst of unexpected layout shifts (shifts less than 1 s apart, 5 s at most). */
  cls: number;
  /**
   * The slowest interaction since `startWebVitals`, from input to the next paint, in ms. 0 when every interaction
   * took under 16 ms, the shortest the browser reports.
   */
  inp: number;
}

declare global {
  interface Window {
    __folioInteractions?: { id: number; duration: number }[];
  }
}

/**
 * Starts recording interactions on the page as it is now. Call it once the page has loaded, before the interaction
 * to measure. LCP and layout shifts are buffered by the browser from the start of navigation, so they need no
 * early start. Chromium only: Firefox reports neither layout shifts nor interactions.
 */
export async function startWebVitals(page: Page): Promise<void> {
  await page.evaluate(() => {
    const interactions: { id: number; duration: number }[] = [];
    window.__folioInteractions = interactions;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        if (entry.interactionId) interactions.push({ id: entry.interactionId, duration: entry.duration });
      }
      // `durationThreshold` is in Event Timing, not yet in TypeScript's DOM types.
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
}

/**
 * Reads the page's web vitals, once the last interaction has painted, and records them on the test: as an
 * annotation, which the HTML report shows, and as an attachment.
 */
export async function readWebVitals(page: Page, testInfo: TestInfo): Promise<WebVitals> {
  const vitals = await page.evaluate(
    () =>
      new Promise<WebVitals>((resolve) => {
        // LCP and layout shifts are only reported to observers (buffered from the start of navigation), not by
        // `performance.getEntriesByType`.
        type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
        const paints: PerformanceEntry[] = [];
        const shifts: LayoutShift[] = [];
        new PerformanceObserver((list) => paints.push(...list.getEntries())).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        new PerformanceObserver((list) => shifts.push(...(list.getEntries() as LayoutShift[]))).observe({
          type: 'layout-shift',
          buffered: true,
        });

        // Observers and event timing entries report after the next paint.
        requestAnimationFrame(() =>
          setTimeout(() => {
            let cls = 0;
            let burst = 0;
            let burstStart = 0;
            let previous = 0;
            for (const shift of shifts.filter((entry) => !entry.hadRecentInput)) {
              if (shift.startTime - previous > 1_000 || shift.startTime - burstStart > 5_000) {
                burst = 0;
                burstStart = shift.startTime;
              }
              burst += shift.value;
              previous = shift.startTime;
              cls = Math.max(cls, burst);
            }

            const longest = new Map<number, number>();
            for (const { id, duration } of window.__folioInteractions ?? []) {
              longest.set(id, Math.max(longest.get(id) ?? 0, duration));
            }

            resolve({ lcp: paints.at(-1)?.startTime ?? Number.NaN, cls, inp: Math.max(0, ...longest.values()) });
          }, 200),
        );
      }),
  );

  testInfo.annotations.push({
    type: 'web vitals',
    description:
      `LCP ${String(Math.round(vitals.lcp))} ms (budget ${String(BUDGETS.lcp)}) · ` +
      `CLS ${vitals.cls.toFixed(3)} (budget ${String(BUDGETS.cls)}) · ` +
      `INP ${vitals.inp ? `${String(vitals.inp)} ms` : 'under 16 ms'} (budget ${String(BUDGETS.inp)})`,
  });
  await testInfo.attach('web vitals', {
    body: JSON.stringify({ ...vitals, budgets: BUDGETS }, null, 2),
    contentType: 'application/json',
  });
  return vitals;
}
