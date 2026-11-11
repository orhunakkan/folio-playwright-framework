# 0006. No database reset or guard

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Some suites reset the database before a run, or check that it is a test database before touching it. Dev is a
shared deployed environment: other people and other runs (local and CI) use it at the same time, and real accounts
live on it.

## Decision

The framework never resets dev's database and doesn't guard it. Instead, each test owns its data: it gets a fresh
`e2e-` user from Folio's test API and deletes it afterwards, and a sweep at the start of each run removes test users
older than 6 hours.

## Consequences

- Runs can overlap safely, and real accounts are never touched.
- Tests can't assume an empty database, so they assert only on data they created.
- Data a run leaves behind is cleaned up by the sweep and the teardown project, not by a reset.
