@regression @http
Feature: Security headers
  Scenario Outline: <page> sends the security headers
    When I request <path>
    Then Folio answers <status>
    And the response has these headers:
      | x-content-type-options | nosniff                         |
      | x-frame-options        | DENY                            |
      | referrer-policy        | strict-origin-when-cross-origin |
      | x-robots-tag           | noindex, nofollow               |

    Examples:
      | page                  | path          | status |
      | the home page         | /             | 200    |
      | the library           | /library      | 200    |
      | the sign-in page      | /login        | 200    |
      | a redirect to sign in | /account      | 307    |
      | a missing page        | /no-such-page | 404    |

  # Folio gap: dev sends no Strict-Transport-Security header (found 2026-11-11).
  # Remove @fail when dev sends it; the scenario then has to pass.
  @fail
  Scenario: pages tell browsers to use HTTPS only (HSTS)
    When I request /
    Then the response tells browsers to use HTTPS only
