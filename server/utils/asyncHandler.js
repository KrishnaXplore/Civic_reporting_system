// Eliminates try/catch in every controller.
// Catches thrown errors (including AppError) and forwards to Express error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
