@regression
Feature: Reading
  Background:
    Given I am reading chapter 1 of "Pride and Prejudice"

  Scenario: turn the page forward and back
    When I turn 1 page forward
    And I turn 1 page back
    Then I see the first page again

  Scenario Outline: jump to chapter <chapter> from Contents
    When I go to chapter <chapter> from Contents
    Then I am reading chapter <chapter> of "Pride and Prejudice"

    @smoke
    Examples: the next chapter
      | chapter |
      | 2       |

    Examples: further on
      | chapter |
      | 3       |
      | 5       |

  Scenario: Contents lists the chapters in order
    When I open Contents
    Then the chapters begin:
      | Chapter 1 |
      | Chapter 2 |
      | Chapter 3 |
