const express = require('express');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env if present
const envFiles = [path.join(__dirname, '..', '..', '.env'), path.join(__dirname, '..', '.env')];
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed
            .slice(eqIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (_e) {
      /* ignore env read error */
    }
  }
}

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { seedDatabase } = require('./seed');
const { safeLog } = require('./errors');
const packageJson = require('../../package.json');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: [
          "'self'",
          'http://localhost:*',
          'ws://localhost:*',
          'http://127.0.0.1:*',
          'ws://127.0.0.1:*'
        ]
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// CORS configuration (support both localhost and 127.0.0.1 for Vite dev server)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || CORS_ORIGIN === '*') return callback(null, true);
      const allowed = CORS_ORIGIN.split(',').map(s => s.trim());
      if (
        allowed.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      callback(null, true); // Permissive in hackathon mode to never break demo
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Payload size limit to support large Excel/CSV batch imports
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiting: general API limiter (generous for live hackathon testing)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', apiLimiter);

// Mutating endpoints rate limiter
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many transaction submissions. Please slow down.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/sales', (req, res, next) => {
  if (req.method === 'POST') {
    return mutationLimiter(req, res, next);
  }
  next();
});

// Sanitized structured request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      safeLog('info', `${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration
      });
    }
  });
  next();
});

// Auto-seed database if empty
seedDatabase(false);

// Health check endpoint with version info
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: packageJson.version,
    timestamp: new Date().toISOString()
  });
});

// Cache-Control headers for dynamic API endpoints (prevent stale analytics)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// API Routes
app.use('/api', routes);

// Serve static frontend assets if built
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  // Static assets with hash in filename -> cache for 1 year immutable
  app.use(
    '/assets',
    express.static(path.join(clientDistPath, 'assets'), {
      maxAge: '1y',
      immutable: true
    })
  );

  // General static directory with HTML revalidation
  app.use(
    express.static(clientDistPath, {
      maxAge: 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    })
  );

  // Fallback to index.html for SPA routes
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});

// Global error handler with structured responses and safe logging
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isProd = process.env.NODE_ENV === 'production';

  safeLog('error', err.message || 'Internal server error', {
    code,
    statusCode,
    stack: isProd ? undefined : err.stack,
    details: err.details
  });

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    code,
    ...(err.details ? { details: err.details } : {})
  });
});

let server = null;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    safeLog('info', `🚀 Sales Analytics API server running at http://0.0.0.0:${PORT}`);
  });
}

module.exports = { app, server };
