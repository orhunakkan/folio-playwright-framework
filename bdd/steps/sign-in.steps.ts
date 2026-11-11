import { randomBytes } from 'node:crypto';
import { RUN_ID } from '../../src/config/run.ts';
import { expect, Given, Then, When } from './fixtures.ts';
import type { Book } from './parameter-types.ts';

/**
 * In a feature file, `mine` is the signed-out user's own username or password, and `wrong` and `unknown` are made
 * up for the scenario, with the run ID in them, so no real account is ever tried.
 */
function credential(word: string, own: string): string {
  if (word === 'mine') return own;
  if (word === 'wrong' || word === 'unknown') return `${word}-${RUN_ID}-${randomBytes(3).toString('hex')}`;
  throw new Error(`"${word}" is not mine, wrong or unknown.`);
}

Given('I have an account and am signed out', async ({ signedOutUser: _account }) => {
  // The fixture creates the account, signed out, and deletes it afterwards.
});

Given('I have signed in', async ({ signInPage, signedOutUser }) => {
  await signInPage.signIn(signedOutUser.username, signedOutUser.password);
});

When('I sign in with my username and password', async ({ signInPage, signedOutUser }) => {
  await signInPage.signIn(signedOutUser.username, signedOutUser.password);
});

When('I sign in with {string} and {string}', async ({ signInPage, signedOutUser }, username: string, password: string) => {
  await signInPage.signIn(credential(username, signedOutUser.username), credential(password, signedOutUser.password));
});

When('I sign out', async ({ accountMenu }) => {
  await accountMenu.signOut();
});

When('I open my highlights in {book}', async ({ highlightsPage }, book: Book) => {
  await highlightsPage.open(book.slug);
});

Then('I am signed in', async ({ page, signedOutUser }) => {
  await expect(page).toBeSignedIn({ as: signedOutUser.username });
});

Then('I see my account', async ({ accountMenu, signedOutUser }) => {
  await expect(accountMenu.menu).toContainText(signedOutUser.username);
});

Then('I am told the username or password is wrong', async ({ signInPage }) => {
  await expect(signInPage.error).toHaveText('Username or password is incorrect.');
});

Then('I am signed out', async ({ page }) => {
  await expect(page).not.toBeSignedIn();
});

Then('I am still signed out', async ({ page, signInPage }) => {
  await expect(signInPage.heading).toHaveText('Sign in');
  await expect(page).not.toBeSignedIn();
});

Then('I see my highlights in {book}', async ({ page, highlightsPage }, book: Book) => {
  await expect(page).toHaveURL(`/account/highlights?book=${book.slug}`);
  await expect(highlightsPage.heading).toHaveText(book.title);
});
