const rateLimit = require('express-rate-limit');

// Bypass rate limiting in test environment
if (process.env.NODE_ENV === 'test') {
  const passThrough = (req, res, next) => next();
  module.exports = { globalLimiter: passThrough, authLimiter: passThrough };
} else {
  const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again after 5 minutes' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  });

  module.exports = { globalLimiter, authLimiter };
}
