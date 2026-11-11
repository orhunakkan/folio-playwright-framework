@regression @slow
Feature: Offline reading
  Background:
    Given I have downloaded "Pride and Prejudice" for offline

  Scenario: a downloaded book can be read without a connection
    When I lose my connection
    And I open chapter 2 of "Pride and Prejudice"
    Then I am reading chapter 2 of "Pride and Prejudice"

  Scenario: remove a book downloaded for offline
    When I remove the download
    Then I can download it for offline again
