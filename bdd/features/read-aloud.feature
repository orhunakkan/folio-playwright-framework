@regression @device-voice
Feature: Read aloud
  Folio reads the page aloud with the device's own voice.

  Scenario: the page is read aloud with the device voice
    Given I am reading chapter 1 of "Pride and Prejudice"
    When I start reading aloud
    Then the device voice says, in order:
      | Chapter 1.                                                                                                             |
      | It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. |
