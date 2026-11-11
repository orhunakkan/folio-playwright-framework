import { test, type Locator, type Page } from '@playwright/test';

/**
 * The sign-in page, at /login. Only for tests whose subject is signing in (AGENTS.md); everywhere else, `testUser`
 * is already signed in by cookie. A page that needs an account sends a signed-out visitor here, with where they
 * were going in `?next=`, and signing in takes them there.
 */
export class SignInPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly signInButton: Locator;
  /** Shown after a failed sign-in: `Username or password is incorrect.` */
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1 });
    this.usernameField = main.getByRole('textbox', { name: 'Username' });
    this.passwordField = main.getByRole('textbox', { name: 'Password' });
    this.signInButton = main.getByRole('button', { name: 'Sign in' });
    this.error = main.getByRole('alert');
  }

  async open(): Promise<void> {
    await test.step('open the sign-in page', () => this.page.goto('/login'), { box: true });
  }

  /**
   * Signs in with the form. Opens the sign-in page first, unless Folio has already sent the browser there (it keeps
   * where you were going in the address, so this mustn't reload it).
   */
  async signIn(username: string, password: string): Promise<void> {
    await test.step(
      `sign in as ${username} with the form`,
      async () => {
        if (new URL(this.page.url(), 'https://invalid').pathname !== '/login') await this.open();
        await this.usernameField.fill(username);
        await this.passwordField.fill(password);
        await this.signInButton.click();
      },
      { box: true },
    );
  }
}
