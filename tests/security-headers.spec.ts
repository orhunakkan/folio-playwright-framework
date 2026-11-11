import { signInOverHttp } from '../src/api/session.ts';
import { expect, test } from '../src/fixtures/test.ts';

/** What every response from dev must carry, whatever its kind. */
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Dev must never show up in search results.
  'x-robots-tag': 'noindex, nofollow',
};

const RESPONSES = [
  { kind: 'the home page', path: '/', status: 200 },
  { kind: 'the library', path: '/library', status: 200 },
  { kind: 'the sign-in page', path: '/login', status: 200 },
  { kind: 'a redirect to sign in', path: '/account', status: 307 },
  { kind: 'a missing page', path: '/no-such-page', status: 404 },
];

test.describe('Security headers', { tag: '@http' }, () => {
  for (const { kind, path, status } of RESPONSES) {
    test(`${kind} sends the security headers`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });

      expect(response).toHaveStatus(status);
      expect(response.headers()).toMatchObject(SECURITY_HEADERS);
    });
  }

  test('a stylesheet sends the security headers and its real content type', async ({ request }) => {
    const home = await (await request.get('/')).text();
    const stylesheet = /<link[^>]+href="(\/assets\/[^"]+\.css)"/.exec(home)?.[1];
    expect(stylesheet, 'the home page links a stylesheet').toBeDefined();

    const response = await request.get(stylesheet ?? '');

    expect(response).toHaveStatus(200);
    expect(response.headers()).toMatchObject({ ...SECURITY_HEADERS, 'content-type': 'text/css; charset=utf-8' });
  });

  test('pages with account details are never cached', async ({ request, context, testUser: _signedIn }) => {
    const signedIn = await context.request.get('/account');
    const signInPage = await request.get('/login');
    const redirect = await request.get('/account', { maxRedirects: 0 });

    expect(signedIn).toHaveStatus(200);
    for (const response of [signedIn, signInPage, redirect]) {
      expect(response.headers()['cache-control'], response.url()).toContain('no-store');
    }
  });

  test('signing in sets a session cookie that only dev, over HTTPS, can read', async ({ request, testUser }) => {
    // `request` has its own cookie jar, apart from the browser context `testUser` signed in.
    const response = await signInOverHttp(request, testUser);

    expect(response).toHaveStatus(303);
    await expect(request).toBeSignedIn({ as: testUser.username });
    const { cookies } = await request.storageState();
    expect(cookies.find((cookie) => cookie.name === '__Host-session')).toMatchObject({
      domain: 'dev.agenticlibrary.app',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });
  });

  test('pages tell browsers to use HTTPS only (HSTS)', async ({ request }) => {
    test.fail(true, 'Folio gap: dev sends no Strict-Transport-Security header (found 2026-11-11). Remove when fixed.');
    const response = await request.get('/');

    expect(response.headers()['strict-transport-security']).toMatch(/max-age=[1-9]\d*/);
  });

  test('pages set a Content-Security-Policy', async ({ request }) => {
    test.fail(true, 'Folio gap: dev sends no Content-Security-Policy header (found 2026-11-11). Remove when fixed.');
    const response = await request.get('/');

    expect(response.headers()['content-security-policy']).toBeDefined();
  });
});
