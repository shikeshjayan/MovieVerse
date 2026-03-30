import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    if (!req.body) {
      req.body = {};
    }
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues?.map((err) => err.message).join(", ") || "Validation error";
      return next(new AppError(messages, 400));
    }
    next(error);
  }
};
