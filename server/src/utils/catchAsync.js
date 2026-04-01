/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates need for try-catch blocks in every route handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches and forwards errors
 */
export default (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
