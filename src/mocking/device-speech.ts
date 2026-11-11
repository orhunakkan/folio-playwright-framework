import { test, type Page } from '@playwright/test';

/** The name the fake device voice has, as Folio's player shows it. */
export const FAKE_VOICE = 'Fake voice';

/**
 * Allowed mocking case "Device read-aloud" (AGENTS.md): CI machines have no speech voices, so `speechSynthesis`
 * does nothing. This gives the page one English device voice that "speaks" each utterance for 0.4 s a word (about
 * the 150 words a minute Folio's estimates assume), on the page's own timers, so `page.clock` controls it too.
 * It records what was spoken; read it with `spokenText`. Call it before the page loads.
 */
export async function fakeDeviceSpeech(page: Page): Promise<void> {
  await test.step(
    'give the page a fake device voice',
    () =>
      page.addInitScript((voiceName: string) => {
        const voice = {
          voiceURI: 'fake-device-voice',
          name: voiceName,
          lang: 'en-US',
          localService: true,
          default: true,
        };
        const spoken: string[] = [];
        let timer: ReturnType<typeof setTimeout> | undefined;

        // Folio sets `utterance.voice` to a voice from `getVoices()`, which a real utterance refuses unless it is a
        // real SpeechSynthesisVoice, so the utterance is faked too.
        class FakeUtterance extends EventTarget {
          text: string;
          lang = '';
          rate = 1;
          pitch = 1;
          volume = 1;
          voice: unknown = null;
          onstart: ((event: Event) => void) | null = null;
          onend: ((event: Event) => void) | null = null;
          onerror: ((event: Event) => void) | null = null;
          constructor(text: string) {
            super();
            this.text = text;
          }
        }

        const synth = Object.assign(new EventTarget(), {
          speaking: false,
          pending: false,
          paused: false,
          getVoices: () => [voice],
          speak(utterance: FakeUtterance) {
            spoken.push(utterance.text);
            synth.speaking = true;
            setTimeout(() => utterance.onstart?.(new Event('start')), 0);
            const words = utterance.text.split(/\s+/).length;
            timer = setTimeout(
              () => {
                synth.speaking = false;
                utterance.onend?.(new Event('end'));
              },
              (400 * words) / utterance.rate,
            );
          },
          cancel() {
            clearTimeout(timer);
            synth.speaking = false;
          },
          pause() {
            synth.paused = true;
          },
          resume() {
            synth.paused = false;
          },
        });

        Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
        Object.defineProperty(window, '__folioSpoken', { value: spoken });
      }, FAKE_VOICE),
    { box: true },
  );
}

/** Everything the fake voice was asked to say, in order. */
export function spokenText(page: Page): Promise<string[]> {
  return page.evaluate(() => [...((window as unknown as { __folioSpoken?: string[] }).__folioSpoken ?? [])]);
}
