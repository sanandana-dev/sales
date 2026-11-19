# SalesPulse — Small Business Sales Analytics Dashboard

A modern, full-stack Small Business Sales & Margin Intelligence Dashboard built with React (Vite), Tailwind CSS, Recharts, Express, and an embedded SQLite database seeded with 12 months of realistic transaction data.

---

## 🚀 Key Features

- **Executive KPI Metric Cards**: Total Sales, Revenue, Gross Profit, and Profit Margin with comparative percentage deltas (`% change vs previous period`).
- **Interactive Visualizations**:
  - **Revenue vs Profit Trend**: Area/Line chart with monthly/weekly interval toggle and custom tooltips.
  - **Top 5 Products by Revenue**: Ranked horizontal bar chart highlighting primary revenue drivers.
  - **Revenue Share by Category**: Donut chart with breakdown of department contributions and margins.
- **Product Performance Table**: Search by product name, sortable by any column (Revenue, Profit, Units, Margin, Price), with `Best Seller`, `Moderate`, and `Slow Mover` badges.
- **Granular Filtering**: Quick date range presets (_All Time_, _Last 30 Days_, _Last 90 Days_, _Last 12 Months_, _Custom_) and Category filter dropdown.
- **Transaction Entry (Add Sale)**: Interactive modal with live calculations of revenue, COGS, gross profit, and margin before submission.
- **Modern UX**: Light/Dark mode with local storage persistence, responsive layout, loading states, and error handling.
- **Zero-Setup Database**: Embedded SQLite (`database.sqlite`) seeded automatically with ~12 months of realistic small-business sales records.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, CORS
- **Database**: SQLite (via `better-sqlite3`)
- **Tooling**: Concurrently (to start backend & frontend simultaneously)

---

## 📁 Project Structure

```
sales/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddSaleModal.jsx     # Modal form for recording new sales
│   │   │   ├── CategoryPieChart.jsx # Donut chart of category distribution
│   │   │   ├── FilterBar.jsx        # Range & category filter toolbar
│   │   │   ├── KpiCards.jsx         # Executive KPI summary cards
│   │   │   ├── Navbar.jsx           # Header bar, logo, dark mode switch
│   │   │   ├── ProductBarChart.jsx  # Top 5 products bar chart
│   │   │   ├── ProductTable.jsx     # Sortable, searchable product table
│   │   │   └── TrendChart.jsx       # Revenue vs Profit area chart
│   │   ├── context/
│   │   │   └── ThemeContext.jsx     # Dark/Light theme provider
│   │   ├── api.js                   # Client API methods
│   │   ├── App.jsx                  # Main dashboard view
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express Backend
│   ├── data/
│   │   └── database.sqlite      # SQLite database file
│   ├── src/
│   │   ├── db.js                # Database connection & schema setup
│   │   ├── seed.js              # 12-month sample dataset generator
│   │   ├── routes.js            # REST API route handlers
│   │   └── index.js             # Express application entrypoint
│   ├── package.json
│   └── test.js                  # Automated API verification test suite
├── package.json                 # Root script runner (concurrently)
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- npm

### 2. Installation

Install all dependencies (root, backend, and frontend):

```bash
npm run install:all
```

_(Or navigate to `/server` and `/client` and run `npm install` in each)._

### 3. Run Development Environment

Start both the backend server (port 5000) and frontend client (port 5173) with a single command:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000/api](http://localhost:5000/api)

### 4. (Optional) Re-Seed Database

To re-seed the SQLite database with a fresh 12-month transaction dataset:

```bash
npm run seed
```

### 5. Automated Backend Tests

Run the test suite to verify all endpoints and validations:

```bash
npm test
```

---

## 📡 REST API Documentation

### Base URL: `http://localhost:5000/api`

| Endpoint                | Method | Query Parameters                                                    | Description                                                                                                                    |
| ----------------------- | ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/summary`              | `GET`  | `startDate`, `endDate`, `category`                                  | Returns total transactions, units sold, total revenue, gross profit, profit margin, plus previous period delta percentages.    |
| `/sales-trend`          | `GET`  | `range` (`monthly` \| `weekly`), `startDate`, `endDate`, `category` | Returns aggregated time series data for revenue, profit, units, and margin.                                                    |
| `/products/performance` | `GET`  | `search`, `category`, `sortBy`, `order`, `startDate`, `endDate`     | Returns product performance metrics with sorting, search, and dynamic status badges (`Best Seller`, `Moderate`, `Slow Mover`). |
| `/categories`           | `GET`  | `startDate`, `endDate`                                              | Returns revenue, profit, unit volume, and revenue share percentage per department.                                             |
| `/products`             | `GET`  | None                                                                | Returns list of products with current standard selling and cost prices for the selector.                                       |
| `/sales`                | `POST` | JSON body                                                           | Records a new sale transaction.                                                                                                |

---

### Request & Response Examples

#### 1. GET `/api/summary`

```json
{
  "totalSales": 2380,
  "totalUnits": 3810,
  "totalRevenue": 385107.16,
  "totalProfit": 227063.66,
  "profitMargin": 58.96,
  "previousPeriod": {
    "totalSales": 195,
    "totalRevenue": 31400.0,
    "totalProfit": 18500.0,
    "profitMargin": 58.92
  },
  "changes": {
    "salesChangePct": 12.5,
    "revenueChangePct": 14.2,
    "profitChangePct": 15.1,
    "marginChangePct": 0.4
  }
}
```

#### 2. POST `/api/sales`

**Request Body**:

```json
{
  "productId": 1,
  "quantity": 2,
  "sellingPrice": 119.99,
  "saleDate": "2026-11-19"
}
```

**Response (201 Created)**:

```json
{
  "success": true,
  "message": "Sale created successfully",
  "sale": {
    "id": 2381,
    "productId": 1,
    "productName": "Pro Wireless Mechanical Keyboard",
    "category": "Electronics",
    "quantity": 2,
    "unitCost": 45,
    "unitPrice": 119.99,
    "revenue": 239.98,
    "profit": 149.98,
    "saleDate": "2026-11-19"
  }
}
```
