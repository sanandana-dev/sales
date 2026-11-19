# Deployment Guide

This guide details how to build and deploy the Small Business Sales Analytics Dashboard in containerized and bare-metal environments.

---

## 1. Containerized Deployment (Docker)

The repository provides a multi-stage, non-root Alpine Dockerfile optimized for production.

### Build Container

```bash
docker build -t sales-analytics-dashboard:1.0.0 .
```

### Run Container

```bash
docker run -d \
  --name sales-dashboard \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e CORS_ORIGIN="*" \
  sales-analytics-dashboard:1.0.0
```

### Container Healthcheck

The image includes an automated healthcheck against `/api/health`:

```bash
docker inspect --format='{{json .State.Health}}' sales-dashboard
```

---

## 2. Bare-Metal / Virtual Machine (Node.js)

### Prerequisites

- Node.js >= 18.0.0 (Node 20 or 22 recommended)
- SQLite3 runtime headers

### Production Build & Launch

```bash
# 1. Install production dependencies and build frontend
npm ci
npm run build

# 2. Start the unified production server
NODE_ENV=production PORT=5000 npm run server
```

The server automatically detects `client/dist` and serves:

- Static hashed client assets from `/assets` with 1-year immutable caching.
- Dynamic SPA routes falling back to `index.html`.
- REST endpoints under `/api/*` with anti-cache headers to ensure accurate live reporting.

---

## 3. Environment Configuration

| Variable       | Default                 | Purpose                                                                                |
| :------------- | :---------------------- | :------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `development`           | Set to `production` to silence verbose debug logs and enable optimized asset handling. |
| `PORT`         | `5000`                  | Port on which the Express server listens.                                              |
| `CORS_ORIGIN`  | `*`                     | Allowed origins for CORS (e.g., `https://dashboard.example.com`).                      |
| `VITE_API_URL` | `http://localhost:5000` | Frontend backend API base URL (used during development).                               |

---

## 4. Reverse Proxy Setup (Nginx Example)

```nginx
server {
    listen 80;
    server_name sales.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
