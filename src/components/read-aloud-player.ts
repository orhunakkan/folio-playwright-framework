import { test, type Locator, type Page } from '@playwright/test';

/**
 * The read-aloud player: a bar at the foot of the page while a book is read aloud, which opens into the "Now
 * playing" dialog. It offers Folio's own downloadable voice ("Try the Folio voice"); tests leave it alone.
 */
export class ReadAloudPlayer {
  readonly page: Page;
  readonly bar: Locator;
  /** Names what is playing, e.g. `Open player: Pride and Prejudice Ch. 1 · p. 1 · Device voice`. */
  readonly openButton: Locator;
  /** Shown while reading; Play takes its place when paused. */
  readonly pauseButton: Locator;
  readonly dialog: Locator;
  /** e.g. `About 5 min left in this chapter`. */
  readonly timeLeft: Locator;
  /** How far through the chapter, 0–100. */
  readonly progress: Locator;
  /** Names the voice, e.g. `Voice Fake voice`. */
  readonly voiceButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bar = page.getByRole('region', { name: 'Read aloud' });
    this.openButton = this.bar.getByRole('button', { name: /^Open player/ });
    this.pauseButton = this.bar.getByRole('button', { name: 'Pause', exact: true });
    this.dialog = page.getByRole('dialog', { name: 'Now playing' });
    this.timeLeft = this.dialog.getByRole('paragraph').filter({ hasText: /left in this chapter$/ });
    this.progress = this.dialog.getByRole('slider', { name: 'Progress' });
    this.voiceButton = this.dialog.getByRole('button', { name: /^Voice / });
  }

  async open(): Promise<void> {
    await test.step('open the player', () => this.openButton.click(), { box: true });
  }
}
