/**
 * Custom error class for operational errors
 * Distinguishes between programming errors and operational errors
 */
class AppError extends Error {
  /**
   * Create an operational error
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx for client errors, 5xx for server errors)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // 4xx status codes indicate client errors ("fail"), 5xx indicate server errors ("error")
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Flags this as an expected/handled error

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
