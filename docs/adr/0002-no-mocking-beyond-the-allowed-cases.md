# 0002. No HAR replay or mocks beyond the five allowed cases

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Tests run against the real Folio app on dev with real data.
[AGENTS.md](../../AGENTS.md#mocking-is-limited-to-these-cases) allows faking only where the real app can't produce a
situation on demand: error states, offline and flaky network, slow responses, device read-aloud, and time.

## Decision

The framework fakes only those five cases, in one small mocking folder that is built with the first test that needs
it. It doesn't record or replay HAR files, and adds no other mocks.

## Consequences

- Every test exercises the real app, so a passing run says something about dev as it is today.
- Tests depend on dev being up, and run at the speed of the real network.
- A new kind of mock needs a change to AGENTS.md first, not just a new test.
