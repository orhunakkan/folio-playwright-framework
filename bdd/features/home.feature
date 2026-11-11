@regression
Feature: Home page
  Scenario: open a question on the home page and read its answer
    Given I am on the home page
    When I open the question "Do I need an account to read?"
    Then I can read its answer:
      """
      No. The whole library and read aloud are open to everyone. An account adds highlights, notes, your own books
      and Ask the book; the Sign in page says how to get one.
      """
