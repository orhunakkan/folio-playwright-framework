import { expect, Given, Then, When } from './fixtures.ts';

Given('I am on the home page', async ({ homePage }) => {
  await homePage.open();
});

When('I open the question {string}', async ({ homePage }, question: string) => {
  await homePage.openQuestion(question);
});

// A doc string: the answer as a reader sees it, which may wrap over several lines in the feature file.
Then('I can read its answer:', async ({ homePage }, answer: string) => {
  await expect(homePage.answer(answer)).toBeVisible();
});
