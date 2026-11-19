class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Redact sensitive patterns in logs
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'apikey', 'credit_card'];
  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function safeLog(level, message, metadata = null) {
  const timestamp = new Date().toISOString();
  const safeMeta = metadata ? sanitizeData(metadata) : null;
  const logObj = { timestamp, level, message, ...(safeMeta ? { meta: safeMeta } : {}) };

  if (level === 'error') {
    console.error(JSON.stringify(logObj));
  } else if (process.env.NODE_ENV !== 'test') {
    console.log(JSON.stringify(logObj));
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  sanitizeData,
  safeLog
};
