/**
 * Request validation middleware using Zod schemas
 * Validates request body against defined schema rules
 */
import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

/**
 * Create validation middleware from Zod schema
 * @param {Object} schema - Zod schema for validation
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => (req, res, next) => {
  try {
    if (!req.body) {
      req.body = {};
    }
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues?.map((err) => err.message).join(", ") || "Validation error";
      return next(new AppError(messages, 400));
    }
    next(error);
  }
};
