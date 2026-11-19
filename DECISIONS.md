# Architecture & Technical Decisions

This document records architectural, technical, and operational decisions made throughout the project's evolution, following the format:
`- [phase] decision — reason`

- [phase 0] Inferred product specifications from codebase and README — SPEC.md does not exist in repository.
- [phase 0] Ranked floating-point money math, unhandled date boundaries/DST shifts, missing types, and absence of input validation schemas as High priority — Direct impact on calculation correctness and system reliability.
- [phase 1] Adopted npm workspaces with TypeScript strict mode across client and server — Provides unified type safety and single command verification.
- [phase 1] Pinned TypeScript, ESLint, Prettier, and type definitions — Ensures exact reproducible builds across environments.
