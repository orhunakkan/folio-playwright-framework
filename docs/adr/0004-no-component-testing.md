# 0004. No component tests

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Playwright can mount single UI components and test them in a real browser. That needs the components' source code.
Folio's source lives in a separate, private repository, and is not part of this project.

## Decision

The framework has no component tests. It tests Folio only through its dev environment, as a user does.

## Consequences

- The framework covers whole journeys, not single components in isolation.
- Component tests, if Folio wants them, belong in Folio's own repository, next to the components.
