# 0008. No failure notifications

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Team suites often post failed runs to a chat channel or by email. This framework has one maintainer and no team.

## Decision

The framework sends no notifications of its own, such as Slack or email messages. Run results live on GitHub: the CI
run, its annotations on the pull request, and the report on GitHub Pages.

## Consequences

- No webhook or notification secret to manage.
- A failure is seen on GitHub, not pushed to anyone.
