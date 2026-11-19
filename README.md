# SalesPulse — Production-Grade Small Business Sales Analytics Dashboard

A modern, full-stack Small Business Sales & Margin Intelligence Dashboard built with React 18 (Vite), Tailwind CSS, Recharts, Express, and an embedded SQLite database seeded with 12 months of realistic transaction data.

---

## 📸 Screenshots

|                                     Desktop Dashboard (Light)                                      |                         Mobile Viewport (Dark)                         |
| :------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------: |
| _[ Executive KPI metrics, interactive revenue trend line, product rankings, and sortable tables ]_ | _[ Fully responsive 390px mobile layout with accessible ARIA drawer ]_ |

---

## ⚡ Quickstart (3 Commands)

Get up and running in under 60 seconds:

```bash
git clone https://github.com/sanandana-dev/sales.git
cd sales && npm ci
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🚀 Key Features

- **Executive KPI Cards**: Real-time Total Sales, Revenue, Gross Profit, and Profit Margin with comparative period deltas.
- **Interactive Visualizations**:
  - **Revenue vs Profit Trend**: Area/Line chart with monthly/weekly interval toggle and custom tooltips.
  - **Top 5 Products by Revenue**: Ranked horizontal bar chart highlighting primary revenue drivers.
  - **Revenue Share by Category**: Donut chart with breakdown of department contributions and margins.
- **Product Performance Table**: Fast search, multi-column sorting (Revenue, Profit, Units, Margin, Price), and dynamic badge assignment (`Best Seller`, `Slow Mover`).
- **Transaction Entry (Add Sale)**: Interactive modal with live calculations of revenue, COGS, gross profit, and margin before submission.
- **Production Hardened**:
  - Strict TypeScript type safety across client and server.
  - Exact financial cents integer arithmetic preventing IEEE 754 floating-point drift.
  - Strict UTC date handling across daylight savings shifts and leap days.
  - Zod runtime schema validation rejecting malformed queries and inputs.
  - Helmet CSP security headers, IP rate limiting, and sanitized request logging.
  - WCAG 2.1 AA compliant with zero serious or critical accessibility violations.
  - Code-split Recharts bundles reducing initial JS payload by 94.7% (down to 36.5 KB).

---

## ⚙️ Environment Variables

The application runs out of the box with zero setup. Optional environment variables can be customized:

| Variable         | Default                 | Purpose                                                 |
| :--------------- | :---------------------- | :------------------------------------------------------ |
| `PORT`           | `5000`                  | Port for the Express backend server.                    |
| `NODE_ENV`       | `development`           | Environment mode (`development`, `production`, `test`). |
| `CORS_ORIGIN`    | `*`                     | Allowed CORS origins (comma-separated or `*`).          |
| `VITE_API_URL`   | `http://localhost:5000` | Frontend backend API URL (used in local Vite dev mode). |
| `NVIDIA_API_KEY` | _(empty)_               | NVIDIA NIM API key for the AI sales chatbot.            |
| `NVIDIA_MODEL`   | `nemotron-3.5-parse`    | NVIDIA NIM model identifier for natural language Q&A.   |

---

## 🤖 AI Sales Chatbot (NVIDIA NIM Integration)

SalesPulse includes a built-in AI Sales Assistant powered by NVIDIA AI Foundation Endpoints / NIM:

- **Model**: `nemotron-3.5-parse` (customizable via `NVIDIA_MODEL` environment variable).
- **Backend-Only Integration**: All API calls are securely dispatched server-side to NVIDIA's OpenAI-compatible endpoint `https://integrate.api.nvidia.com/v1/chat/completions`. Your `NVIDIA_API_KEY` is never exposed to the client.
- **Strict Data Grounding (Zero Hallucinations)**: The chatbot queries the embedded SQLite database to inject real-time structured business metrics (revenue in ₹ INR, profits, margins, category distributions, monthly trends, and product rankings) directly into the model context.
- **Strict Out-of-Scope Refusal**: System prompts enforce that the assistant only answers questions derived from the sales dataset. If a query asks about external facts, competitors, or topics not in the data, it strictly refuses with:
  > _"I can only answer questions based on the provided sales data, and that information is not available in the dataset."_
- **Floating UI Widget**: An interactive, responsive chat widget in the bottom-right corner matching the dashboard's `#151927` navy and `#FF901E` orange design system with quick starter questions and message history.

---

## 🛠️ NPM Scripts

| Script                  | Command              | Purpose                                                                                               |
| :---------------------- | :------------------- | :---------------------------------------------------------------------------------------------------- |
| `npm run check`         | Unified Quality Gate | Runs secret scan, a11y audit, typecheck, lint, test suite, production build, and bundle budget check. |
| `npm run dev`           | Development Mode     | Concurrently starts Express backend (`:5000`) and Vite frontend (`:5173`).                            |
| `npm run build`         | Production Build     | Builds production frontend client with Vite and Rollup code-splitting.                                |
| `npm run test`          | Test Suite           | Runs pure function unit tests with coverage gate, backend API tests, and E2E verification.            |
| `npm run test:coverage` | Coverage Gate        | Verifies that pure business logic meets or exceeds 80% line coverage (currently 100%).                |
| `npm run typecheck`     | TypeScript           | Strict typecheck across both client and server codebases.                                             |
| `npm run lint`          | ESLint               | Lints JavaScript and React components with a zero-warning threshold.                                  |
| `npm run a11y`          | Accessibility Audit  | Automated axe-core WCAG 2.1 AA audit on 390x844 and 1280x800 viewports.                               |
| `npm run budget`        | Bundle Budget        | Enforces sub-100 KB entry JS and sub-50 KB CSS bundles.                                               |
| `npm run secret-scan`   | Security Scan        | Scans all git-tracked files for exposed credentials and secrets.                                      |
| `npm run seed`          | Database Seed        | Re-seeds SQLite database with realistic 12-month sample transactions.                                 |

---

## 🏗️ Architecture & Documentation

- [ARCHITECTURE.md](file:///c:/Users/hp/Downloads/sales/ARCHITECTURE.md) — System architecture, module map, data flow, and technical specifications.
- [AUDIT.md](file:///c:/Users/hp/Downloads/sales/AUDIT.md) — Initial codebase audit, categorized and ranked by priority.
- [PERF.md](file:///c:/Users/hp/Downloads/sales/PERF.md) — Performance metrics, bundle budget analysis, and Core Web Vitals.
- [DEPLOY.md](file:///c:/Users/hp/Downloads/sales/DEPLOY.md) — Deployment instructions for Docker containers and Node runtimes.
- [DECISIONS.md](file:///c:/Users/hp/Downloads/sales/DECISIONS.md) — Chronological log of architectural decisions and rationale.
- [CHANGELOG.md](file:///c:/Users/hp/Downloads/sales/CHANGELOG.md) — Release notes and version history.
- [CONTRIBUTING.md](file:///c:/Users/hp/Downloads/sales/CONTRIBUTING.md) — Development workflow and contribution guidelines.
- [SECURITY.md](file:///c:/Users/hp/Downloads/sales/SECURITY.md) — Responsible vulnerability disclosure policy.

---

## 📡 REST API Summary

Base URL: `/api`

- `GET /api/health` — Service health and application version.
- `GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&category=All` — Overall KPI summary and previous period percentage deltas.
- `GET /api/sales-trend?range=monthly|weekly` — Time series revenue, profit, units, and margin trajectory.
- `GET /api/products/performance?sortBy=revenue&order=desc&search=...` — Product performance metrics with ranking badges.
- `GET /api/categories` — Departmental revenue share and margins.
- `GET /api/products` — Product catalog for transaction entry.
- `POST /api/sales` — Record a new sale transaction (validated via Zod schema).
- `POST /api/chat` — AI sales chatbot endpoint powered by NVIDIA NIM (`nemotron-3.5-parse`).
- `POST /api/sales/upload` — Direct bulk Excel (`.xlsx`, `.xls`) and CSV dataset import.
- `POST /api/sales/reset-sample` — Restore default 12-month sample dataset.
- `POST /api/sales/clear-all` — Wipe database for clean-slate testing.
