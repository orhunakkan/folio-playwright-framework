@regression
Feature: Library
  Background:
    Given I am in the library

  Scenario: filter the library
    When I filter by "Classic novels"
    Then "Classic novels" is the only filter selected
    And the library shows at least one book

  Scenario: go from the library to a book and start reading
    When I open "Pride and Prejudice"
    And I start reading
    Then I am reading chapter 1 of "Pride and Prejudice"
