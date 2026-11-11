import { expect, test } from '../src/fixtures/test.ts';
import { FAKE_VOICE, fakeDeviceSpeech, spokenText } from '../src/mocking/device-speech.ts';
import { installClock, letTimePass } from '../src/mocking/time.ts';

const BOOK = 'pride-and-prejudice';
const FIRST_SENTENCE = 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.';

// The device's own voice, faked: CI machines have none (src/mocking/device-speech.ts). Folio's downloadable voice
// and ElevenLabs voices are left alone.
test.describe('Read aloud', { tag: '@regression' }, () => {
  test('the page is read aloud with the device voice, sentence by sentence', async ({ page, readerPage }) => {
    await fakeDeviceSpeech(page);
    await readerPage.open(BOOK, 1);

    await readerPage.readAloud();

    await expect(readerPage.player.openButton).toHaveAccessibleName('Open player: Pride and Prejudice Ch. 1 · p. 1 · Device voice');
    await expect(readerPage.player.pauseButton).toBeVisible();
    await expect.poll(async () => (await spokenText(page)).slice(0, 2)).toEqual(['Chapter 1.', FIRST_SENTENCE]);
  });

  test("the player's progress follows the reading", async ({ page, readerPage }) => {
    await installClock(page);
    await fakeDeviceSpeech(page);
    await readerPage.open(BOOK, 1);
    await readerPage.readAloud();
    await readerPage.player.open();

    await expect(readerPage.player.voiceButton).toHaveAccessibleName(`Voice ${FAKE_VOICE}`);
    await expect(readerPage.player.timeLeft).toHaveText('About 5 min left in this chapter');

    await letTimePass(page, 90_000);

    await expect(readerPage.player.timeLeft).toHaveText('About 4 min left in this chapter');
    await expect(readerPage.player.progress).not.toHaveAttribute('aria-valuenow', '0');
  });

  test('the open player is accessible and fits the screen', async ({ page, readerPage, scanAccessibility, horizontalOverflow }) => {
    await fakeDeviceSpeech(page);
    await readerPage.open(BOOK, 1);
    await readerPage.readAloud();
    await readerPage.player.open();
    await expect(readerPage.player.dialog).toBeVisible();

    expect(await scanAccessibility()).toEqual([]);
    await expect.poll(horizontalOverflow).toBe(0);
  });
});
