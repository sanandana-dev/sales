# Architecture & Technical Decisions

This document records architectural, technical, and operational decisions made throughout the project's evolution, following the format:
`- [phase] decision — reason`

- [phase 0] Inferred product specifications from codebase and README — SPEC.md does not exist in repository.
- [phase 0] Ranked floating-point money math, unhandled date boundaries/DST shifts, missing types, and absence of input validation schemas as High priority — Direct impact on calculation correctness and system reliability.
- [phase 1] Adopted npm workspaces with TypeScript strict mode across client and server — Provides unified type safety and single command verification.
- [phase 1] Pinned TypeScript, ESLint, Prettier, and type definitions — Ensures exact reproducible builds across environments.
- [phase 2] Extracted pure financial and UTC date math into shared/analytics.js with 100% line coverage — Fixes floating-point drift, DST shifts, and missing edge case handling.
- [phase 2] Enforced 80% coverage threshold gate via test/coverage-gate.js — Ensures regressions in core business logic fail the check pipeline.
- [phase 3] Added zod runtime validation schemas and helmet/rate-limiting security middleware — Rejects invalid input with structured 400 responses and protects server against payload injection and rate abuse.
- [phase 3] Added ErrorBoundary component to client and sanitized logging to server — Prevents blank screens on render crashes and prevents secrets from being logged.
- [phase 4] Added automated axe-core WCAG 2.1 AA accessibility audit to test suite for 390x844 and 1280x800 viewports — Ensures zero serious or critical a11y violations across mobile and desktop.
- [phase 4] Added tabular-nums, accessible dialog markup, labeled controls, 44px tap targets, and prefers-reduced-motion media query — Satisfies WCAG AA contrast, keyboard accessibility, and screen reader compatibility.
