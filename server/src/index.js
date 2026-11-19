const express = require('express');
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
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*']
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Payload size limit to prevent request entity flooding
app.use(express.json({ limit: '100kb' }));

// Rate limiting: general API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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
  max: 120,
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

// API Routes
app.use('/api', routes);

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
  server = app.listen(PORT, () => {
    safeLog('info', `🚀 Sales Analytics API server running at http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
