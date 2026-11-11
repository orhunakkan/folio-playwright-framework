# 0007. No check for secrets leaking into Folio's bundles

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

A bundle leak check looks through an app's built JavaScript for secrets or server-only code that shouldn't reach the
browser. It is most useful when it runs on every build, before the code is deployed.

## Decision

The framework doesn't check Folio's bundles. That check belongs in Folio's own repository, where it runs on the
build.

## Consequences

- A leak would be caught by Folio's own pipeline, not by this framework.
- This framework stays focused on how Folio behaves for a user on dev.
