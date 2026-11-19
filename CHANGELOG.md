# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-19

Production-grade upgrade of the Small Business Sales Analytics Dashboard.

### Added

- **Monorepo Structure**: Added npm workspaces for `server`, `client`, and `shared`.
- **Pure Business Logic Module (`shared/analytics.js`)**:
  - Exact financial arithmetic avoiding IEEE 754 floating-point drift.
  - Strict UTC date handling across leap days, month boundaries, and daylight saving transitions.
  - Rolling date range generator and previous-period metric calculations.
  - Product performance badge assignment (`Best Seller`, `Slow Mover`).
  - Unit test suite achieving 100% line coverage enforced by `test/coverage-gate.js`.
- **Runtime Validation & Security (`shared/schemas.js`)**:
  - Comprehensive Zod validation schemas for all query parameters and mutation request bodies.
  - Helmet HTTP security headers including Content-Security-Policy.
  - Express rate limiting for API reads and transaction mutations.
  - Safe, sanitized request logger with redaction of sensitive parameters.
  - Automated secret scanning script (`scripts/secret-scan.js`).
- **Accessibility & UX**:
  - Full WCAG 2.1 AA compliance verified with automated `axe-core` mobile/desktop audits.
  - Accessible interactive landmarks, dialog focus trapping, 44px touch tap targets, and `prefers-reduced-motion` animations.
  - Tabular numerals (`tabular-nums`) for clean financial data alignment.
  - React `ErrorBoundary` wrappers for individual widgets with interactive Retry mechanisms.
- **Performance & Code Splitting**:
  - Lazy loading for heavy Recharts visualization components (`TrendChart`, `ProductBarChart`, `CategoryPieChart`) and `AddSaleModal`.
  - Initial JS bundle size reduced by **94.7%** (from 694.22 KB to 36.51 KB).
  - Production bundle size budget enforcement (`scripts/check-bundle-budget.js`).
  - HTTP caching headers for immutable static assets.
- **CI/CD & Deployment**:
  - GitHub Actions CI pipeline (`.github/workflows/ci.yml`) validating builds across Node 20.x and 22.x.
  - Dependabot configuration for npm dependencies and GitHub Actions.
  - Multi-stage Alpine `Dockerfile` with non-root runtime user and healthcheck.
  - Healthcheck endpoint (`/api/health`) returning application status and version.
- **Documentation**:
  - `AUDIT.md`, `PERF.md`, `ARCHITECTURE.md`, `DEPLOY.md`, `CONTRIBUTING.md`, and `SECURITY.md`.
