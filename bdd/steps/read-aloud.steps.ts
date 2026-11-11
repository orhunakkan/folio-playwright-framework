import type { DataTable } from 'playwright-bdd';
import { spokenText } from '../../src/mocking/device-speech.ts';
import { expect, Then, When } from './fixtures.ts';

// The fake device voice comes from the `@device-voice` hook (hooks.ts).
When('I start reading aloud', async ({ readerPage }) => {
  await readerPage.readAloud();
});

// A plain-list data table: what the voice says first, one utterance per row.
Then('the device voice says, in order:', async ({ page, readerPage }, table: DataTable) => {
  const expected = table.raw().flat();
  await expect(readerPage.player.pauseButton).toBeVisible();
  await expect.poll(async () => (await spokenText(page)).slice(0, expected.length)).toEqual(expected);
});
