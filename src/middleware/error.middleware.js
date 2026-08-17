// ─────────────────────────────────────────────
//  SmartStudy AI — Middleware: Error Handler
// ─────────────────────────────────────────────

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} →`, err.message);

  const status = err.status || err.statusCode || 500;

  const message =
    status < 500
      ? err.message
      : 'An internal error occurred. Please try again.';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
