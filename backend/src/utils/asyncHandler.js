// Wraps an async route handler so any error is passed to the error middleware
// in server.js instead of crashing the request or hanging it.
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = asyncHandler;