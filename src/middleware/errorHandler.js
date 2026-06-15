/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // GitHub not found
  if (err.message.includes('not found')) {
    return res.status(404).json({ success: false, message: err.message });
  }

  // GitHub rate limit
  if (err.message.includes('rate limit')) {
    return res.status(429).json({ success: false, message: err.message });
  }

  // Database errors
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
