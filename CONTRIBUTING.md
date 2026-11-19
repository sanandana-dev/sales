# Contributing Guidelines

Thank you for contributing to the Small Business Sales Analytics Dashboard!

---

## 1. Development Workflow

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/sanandana-dev/sales.git
cd sales
npm ci
```

### Running Locally

```bash
# Start both backend server (port 5000) and frontend dev server (port 5173)
npm run dev
```

---

## 2. Quality Verification Gates

Before submitting any pull request, verify that all checks pass:

```bash
# Run comprehensive check pipeline
npm run check
```

The check gate enforces:

1. `npm run secret-scan`: Scans tracked files for leaked API keys, tokens, and credentials.
2. `npm run a11y`: Executes axe-core WCAG 2.1 AA audits across mobile and desktop viewports.
3. `npm run typecheck`: Strict TypeScript typechecking for client and server.
4. `npm run lint`: ESLint with zero-warning threshold.
5. `npm run test`: Unit tests with 100% line coverage enforcement on business logic, backend tests, and E2E verification.
6. `npm run build`: Production client Vite build.
7. `npm run budget`: Production bundle size budget verification.

---

## 3. Pull Request Guidelines

- Branch naming: `feature/<feature-name>` or `fix/<bug-name>`.
- Keep business logic in pure functions inside `shared/analytics.js` with comprehensive unit tests.
- Maintain WCAG 2.1 AA accessibility standards for all UI updates.
