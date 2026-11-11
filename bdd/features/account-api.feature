@regression @api
Feature: Account API
  Folio's own JSON endpoints for what a reader saves.

  Background:
    * I have an account and am signed in

  Scenario: saved bookmarks appear in my export
    When I save these bookmarks in "Pride and Prejudice":
      | chapter | page |
      | 1       | 1    |
      | 2       | 2    |
    Then my export lists 2 bookmarks

  Scenario Outline: a <colour> highlight is <answered>
    When I save a <colour> highlight
    Then Folio answers <status>

    Examples: Folio's colours
      | colour | answered | status |
      | yellow | saved    | 201    |
      | green  | saved    | 201    |
      | blue   | saved    | 201    |
      | pink   | saved    | 201    |

    Examples: colours Folio doesn't have
      | colour | answered | status |
      | red    | refused  | 400    |
      | purple | refused  | 400    |

  Scenario: a malformed body is refused
    When I send a new bookmark with this body:
      """json
      { "chapter": 1 }
      """
    Then Folio answers 400 with the error "invalid"
