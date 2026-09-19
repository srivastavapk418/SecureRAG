const multer = require("multer");
const ApiError = require("../utils/ApiError");

function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: messages.join(", ") || "Validation failed",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  console.error("Unhandled server error:", error);

  return res.status(500).json({
    message: "Internal server error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

