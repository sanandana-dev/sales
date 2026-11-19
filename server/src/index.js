const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    }
  });
  next();
});

// Auto-seed database if empty
seedDatabase(false);

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Sales Analytics API server running at http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
