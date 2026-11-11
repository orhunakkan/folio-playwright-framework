# 0003. Playwright's HTML report only, no Allure

- **Status:** Accepted
- **Date:** 2026-11-11

## Context

Playwright ships an HTML report that shows each test's steps, annotations, attachments, screenshots and videos, and
can merge the reports of sharded runs. Allure is a popular second reporter.

## Decision

The framework uses Playwright's HTML report only, locally, in CI, and on GitHub Pages. It doesn't add Allure.

## Consequences

- One good reporter beats two: one format to configure, publish and keep free of secrets.
- The `test.step` calls in page objects already make the HTML report read like a story.
- Features only Allure has, such as history across runs, are not available.
