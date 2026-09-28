/**
 * An expected, client-facing error. Its message is always safe to return to the client.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }

  static notFound(entity = 'Resource') {
    return new AppError(`${entity} not found`, 404);
  }
}

module.exports = AppError;
