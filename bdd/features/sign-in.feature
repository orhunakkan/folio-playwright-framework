@regression
Feature: Signing in
  As a reader with an account
  I want to sign in with my username and password
  So that my bookmarks, highlights and reading place follow me

  Background:
    Given I have an account and am signed out

  Rule: Only the right username and password sign you in

    @smoke
    Scenario: sign in with the form and see your account
      When I sign in with my username and password
      Then I am signed in
      And I see my account

    Scenario Outline: signing in with <what is wrong> is refused
      When I sign in with "<username>" and "<password>"
      Then I am told the username or password is wrong
      But I am still signed out

      Examples:
        | what is wrong       | username | password |
        | a wrong password    | mine     | wrong    |
        | an unknown username | unknown  | mine     |

    Scenario: sign out
      Given I have signed in
      When I sign out
      Then I am signed out

  Rule: Signing in takes you where you were going

    Scenario: signing in takes you back to the page you asked for
      When I open my highlights in "Pride and Prejudice"
      And I sign in with my username and password
      Then I see my highlights in "Pride and Prejudice"
