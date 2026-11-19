# System Audit & Codebase Health Report

This comprehensive audit documents the current state, architecture, correctness flaws, security vulnerabilities, accessibility gaps, and performance characteristics of the Sales Analytics repository (`sanandana-dev/sales`).

---

## 1. Architecture & Tech Stack

The application is structured as a full-stack mono-repository consisting of a Node/Express backend and a React/Vite frontend.

```
/
├── client/                     # Frontend client application (React 18 + Vite)
│   ├── src/
│   │   ├── api.js              # Fetch client wrapper for backend endpoints
│   │   ├── App.jsx             # Main dashboard page layout and state coordinator
│   │   ├── main.jsx            # React root mount point and ThemeProvider context
│   │   ├── context/
│   │   │   └── ThemeContext.jsx# Dark/light mode state manager using localStorage
│   │   └── components/
│   │       ├── AddSaleModal.jsx# Transaction entry form with live preview calculations
│   │       ├── CategoryPieChart.jsx # Donut chart of category distribution
│   │       ├── FilterBar.jsx   # Date range presets, custom date, category selector
│   │       ├── KpiCards.jsx    # Metric cards for Sales, Revenue, Profit, Margin
│   │       ├── Navbar.jsx      # Navigation bar, brand logo, dark mode toggle
│   │       ├── ProductBarChart.jsx # Horizontal bar chart of top 5 products by revenue
│   │       ├── ProductTable.jsx# Sortable, searchable table of product metrics
│   │       └── TrendChart.jsx  # Recharts Area/Line chart for monthly/weekly trends
├── server/                     # Backend API server (Node.js + Express)
│   ├── data/database.sqlite    # Embedded SQLite database
│   ├── src/
│   │   ├── db.js               # better-sqlite3 database connection and schema setup
│   │   ├── index.js            # Express server initialization, CORS, logging, healthcheck
│   │   ├── routes.js           # REST API routes (/api/summary, trend, performance, etc.)
│   │   └── seed.js             # 12-month sample dataset generator (~2,380 sales)
│   └── test.js                 # HTTP integration test suite
├── package.json                # Root package with concurrently runner
├── test-e2e.js                 # End-to-end integration test script
└── README.md                   # Project overview and API documentation
```

---

## 2. Findings Matrix

| ID          | Category        | File Path                                   | Finding Description                                                                                                                                            | Severity   |
| ----------- | --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **BUG-01**  | Correctness     | `server/src/routes.js:51`                   | Typo checking `currentStats.profit` instead of `currentStats.totalProfit`, causing ternary fallback behavior.                                                  | **High**   |
| **BUG-02**  | Correctness     | `server/src/routes.js:59-67`                | Non-UTC date arithmetic (`new Date(...)` and millisecond subtraction) shifts days across Daylight Saving Time (DST) boundaries.                                | **High**   |
| **BUG-03**  | Correctness     | `server/src/routes.js:88-113`               | Comparison mismatch: all-time `summary` calculates deltas by comparing all historical records against a 30-day window, yielding skewed percentages (+1,100%+). | **High**   |
| **BUG-04**  | Correctness     | `server/src/routes.js:270-282`              | `WHERE s.sale_date >= ?` applied on `LEFT JOIN` in `/api/products/performance` drops products with 0 sales instead of displaying 0 counts.                     | **High**   |
| **BUG-05**  | Correctness     | `server/src/routes.js:468-470`              | Floating-point calculations (`qty * price`, `revenue - cost`) accumulate IEEE 754 precision errors. Money must be tracked in cents or bounded.                 | **High**   |
| **BUG-06**  | Correctness     | `client/src/App.jsx:51`                     | Hardcoded anchor date `new Date('2026-11-19T23:59:59')` prevents dynamic real-time rolling date presets (`30d`, `90d`) in production.                          | **High**   |
| **SEC-01**  | Security        | `server/src/routes.js:429-470`              | Missing runtime schema validation (Zod) on `POST /api/sales` and query parameters; unvalidated payloads could accept malicious or out-of-range values.         | **High**   |
| **SEC-02**  | Security        | `server/src/index.js:10-15`                 | Wildcard CORS `origin: '*'` without origin restriction or credential boundary.                                                                                 | **High**   |
| **SEC-03**  | Security        | `server/src/index.js:1-55`                  | Missing HTTP security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).                                             | **High**   |
| **SEC-04**  | Security        | `server/src/index.js:17`                    | Missing rate limiting and request payload size limiting on mutating endpoints (`POST /api/sales`).                                                             | **High**   |
| **TYP-01**  | Types & Tooling | Entire codebase                             | Complete absence of TypeScript strict type checking; all files are untyped plain JavaScript (.js, .jsx).                                                       | **High**   |
| **TYP-02**  | Types & Tooling | `package.json`                              | Missing centralized `npm run check` pipeline enforcing typecheck, lint, test, and build together.                                                              | **High**   |
| **TST-01**  | Testing         | Entire codebase                             | Zero unit test coverage for pure calculation logic (margin, delta pct, date ranges, currency formatting). Missing coverage threshold enforcement.              | **High**   |
| **A11Y-01** | Accessibility   | `client/src/components/FilterBar.jsx`       | Form `<select>` and `<input>` elements lack associated `<label>` or `aria-label` attributes.                                                                   | **Medium** |
| **A11Y-02** | Accessibility   | `client/src/components/KpiCards.jsx`        | Trend direction indicators (arrows) rely solely on color and lack screen reader descriptions.                                                                  | **Medium** |
| **A11Y-03** | Accessibility   | `client/src/components/AddSaleModal.jsx`    | Modal dialog lacks `role="dialog"`, `aria-modal="true"`, focus trapping, and `aria-labelledby`.                                                                | **Medium** |
| **A11Y-04** | Accessibility   | `client/src/index.css`                      | Missing `prefers-reduced-motion` media queries for animations and spinners.                                                                                    | **Medium** |
| **A11Y-05** | Accessibility   | `client/src/components/ProductTable.jsx`    | Missing tabular numerals styling (`tabular-nums`) causing jitter and misalignment in numeric columns.                                                          | **Medium** |
| **PERF-01** | Performance     | `client/src/App.jsx`                        | Recharts bundle (~622kB) is bundled synchronously into main chunk rather than code-split via lazy-loading.                                                     | **Medium** |
| **PERF-02** | Performance     | `server/src/index.js`                       | Missing static asset caching headers (`Cache-Control`) and database connection shutdown cleanup on `SIGTERM`/`SIGINT`.                                         | **Medium** |
| **PERF-03** | Performance     | `client/vite.config.js`                     | No bundle size limits or build budgets configured to prevent bundle bloat.                                                                                     | **Medium** |
| **ERR-01**  | Error Handling  | `client/src/App.jsx`                        | Individual card/chart components lack isolated Error Boundaries; a single rendering error crashes the whole dashboard.                                         | **Medium** |
| **ERR-02**  | Error Handling  | `client/src/components/ProductBarChart.jsx` | Inadequate empty states and loading skeletons for individual data sections.                                                                                    | **Low**    |
| **DOC-01**  | Documentation   | Root                                        | Missing `.env.example`, `.nvmrc`, `.editorconfig`, CI/CD workflow, Dockerfile, and versioned healthcheck endpoint.                                             | **Medium** |

---

## 3. Detailed Audit by Category

### A. Correctness & Calculations (High)

1. **Broken Ternary in Summary**: In `server/src/routes.js:51`, `currentStats.profit` is referenced, but the query aliases the column as `totalProfit`. As a result, the code relied on fallback evaluation.
2. **DST & Date Drift**: Date calculations using `new Date()` without UTC methods can drift across daylight saving time transitions and timezone boundaries. Stored dates are in `YYYY-MM-DD` strings, but calculations in `routes.js` instantiate local `Date` objects.
3. **Period Comparison Inaccuracy**: In `server/src/routes.js:88`, when viewing All-Time data, the backend compares all recorded history against the prior 30 days, generating meaningless percentage change statistics.
4. **Left Join Exclusion**: Filtering by `s.sale_date >= ?` in the `WHERE` clause rather than the `ON` condition of a `LEFT JOIN` converts the outer join into an inner join, unintentionally dropping products with zero sales in that time window.
5. **Floating Point Rounding**: Financial math performed using standard JavaScript IEEE 754 floating point arithmetic accumulates rounding inaccuracies. Calculations should use integer cents or strict decimal rounding.

### B. Security & Validation (High)

1. **Unchecked Request Input**: API endpoints accept parameters without strict schema enforcement. `quantity`, `sellingPrice`, and `productId` should be parsed and validated with Zod.
2. **Missing HTTP Security Headers**: Neither Helmet nor CSP headers are configured in Express, leaving endpoints susceptible to clickjacking and MIME sniffing.
3. **CORS Policy**: Configured to `origin: '*'` without configurable environment safeguards.
4. **Rate Limiting**: No rate limiter on `POST /api/sales` leaves the database vulnerable to transaction flooding or resource exhaustion.

### C. Types, Linting & Testing (High)

1. **No TypeScript**: Neither frontend nor backend uses TypeScript. Lack of compiler checks allows runtime undefined errors and prop drilling discrepancies.
2. **No Linter or Formatter**: Absence of ESLint and Prettier configs allows inconsistent code style and undetected syntax risks.
3. **Missing Automated Gate**: No single `npm run check` script to execute typechecking, linting, unit testing, and compilation together.
4. **Missing Pure Logic Unit Tests**: Aggregations, financial formulas, margin computations, and date range math are intertwined with Express routes and React components rather than isolated into pure, testable modules.

### D. Accessibility & UX (Medium)

1. **Form Labels**: Several dropdowns and date pickers lack accessible name bindings.
2. **Visual-Only Cues**: Color-only delta indicators in KPI cards without screen reader text violate WCAG 1.4.1.
3. **Accessible Dialog**: The `AddSaleModal` lacks standard WAI-ARIA dialog attributes and keyboard focus confinement.
4. **Motion Preferences**: CSS animations run unconditionally without checking `@media (prefers-reduced-motion: reduce)`.
5. **Touch Targets**: Several mobile button targets fall below the recommended 44×44px minimum.

### E. Performance & Operations (Medium)

1. **Monolithic Bundle**: Vite builds a single bundle exceeding 600kB due to direct Recharts imports.
2. **Static Asset Caching**: Express does not serve static files with immutable or long-term caching headers.
3. **No CI Pipeline**: GitHub Actions workflow and Dependabot configurations are absent.
4. **No Containerization**: No Dockerfile or `.dockerignore` exists for reproducible production deployment.
