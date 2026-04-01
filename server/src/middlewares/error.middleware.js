/**
 * Global error handler middleware
 * Catches all unhandled errors and returns consistent JSON response
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
};