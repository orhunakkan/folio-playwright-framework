# 0005. No code coverage from the e2e run

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Measuring which of an app's code an end-to-end run reaches needs a build that is instrumented for it, and the source
to map the numbers back to. The dev site is a normal deployed build, not an instrumented one, and Folio's source is
not part of this project.

## Decision

The framework doesn't collect or report code coverage.

## Consequences

- Coverage is judged by the journeys in the blueprint and the specs in `tests/`, not by a percentage.
- Coverage for Folio, if it wants it, belongs in Folio's own repository, where the build and the source are.
