import { fakeDeviceSpeech } from '../../src/mocking/device-speech.ts';
import { BeforeScenario } from './fixtures.ts';

/**
 * `@device-voice`: the page gets a fake device voice before it loads, because CI machines have none (AGENTS.md's
 * "Device read-aloud" case). A tag, not a Given: it is technical setup, not something a reader does.
 */
BeforeScenario({ name: 'give the page a fake device voice', tags: '@device-voice' }, async ({ page }) => {
  await fakeDeviceSpeech(page);
});
