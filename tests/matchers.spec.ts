import { OkSchema } from '../src/api/schemas.ts';
import { expect, test } from '../src/fixtures/test.ts';

// Proves the framework's custom matchers (src/support/matchers.ts) fail, and say why in a user's terms. Each test
// makes one fail on purpose against a real answer from dev, and checks the message.
test.describe('Custom matchers', { tag: ['@regression', '@api'] }, () => {
  test('toHaveStatus names the request and both statuses', async ({ visitorApi }) => {
    const health = await visitorApi.health();

    expect(() => {
      expect(health).toHaveStatus(201);
    }).toThrow('/healthz answered 200 OK, expected 201');
    expect(() => {
      expect(health).not.toHaveStatus(200);
    }).toThrow('/healthz answered 200 OK, expected anything but 200');
  });

  test('toBeSignedIn says who, if anyone, is signed in', async ({ request, context, testUser }) => {
    await expect(expect(request).toBeSignedIn({ timeout: 1_000 })).rejects.toThrow(
      'Expected: signed in\nReceived: signed out',
    );
    await expect(expect(context).toBeSignedIn({ as: 'e2e-000000000000', timeout: 1_000 })).rejects.toThrow(
      `Expected: signed in as e2e-000000000000\nReceived: signed in as ${testUser.username}`,
    );
    await expect(expect(context).not.toBeSignedIn({ timeout: 1_000 })).rejects.toThrow(
      `Expected: not signed in\nReceived: signed in as ${testUser.username}`,
    );
  });

  test('toMatchSchema lists where the body breaks the schema', async ({ visitorApi }) => {
    const manifest = await visitorApi.manifest();

    await expect(expect(manifest).toMatchSchema(OkSchema)).rejects.toThrow(
      "/manifest.webmanifest's body doesn't match the schema:\n  ok: Invalid input",
    );
  });

  test('toBeWithinBudgets lists every metric against its budget', () => {
    expect(() => {
      expect({ lcp: 3_648, cls: 0.004, inp: 0 }).toBeWithinBudgets();
    }).toThrow(
      '✗ LCP 3648 ms, over its budget of 2500 ms\n' +
        '✓ CLS 0.004, within its budget of 0.1\n' +
        '✓ INP 0 ms, within its budget of 200 ms',
    );
  });
});
