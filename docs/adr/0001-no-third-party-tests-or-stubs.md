# 0001. No tests or stubs for third-party services

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Several Folio features are built on other companies' services: Ask the book, quizzes and flashcards (Anthropic),
ElevenLabs voices, word lookup and translation (Wiktionary, Wikipedia), cover and details search (Open Library),
billing (Paddle), and email delivery. [AGENTS.md](../../AGENTS.md) puts them out of scope.

## Decision

The framework doesn't test these services or the Folio features that depend on them, and adds no stubs, mocks or
sandbox setups to stand in for them. A journey that passes near one stops before the third-party call.

## Consequences

- Those features have no end-to-end coverage here. What Folio does around them, such as the pages that lead to them,
  can still be tested.
- A test must not trigger one by accident, so specs near these features are written to stop short of the call.
- Since nothing stands in for a service, there are no stubs to keep in step with the real service.
