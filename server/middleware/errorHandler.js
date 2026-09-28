const { ZodError } = require('zod');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.details;

  if (err instanceof ZodError) {
    status = 400;
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    message = errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join('; ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with these details already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  const unexpected = status >= 500 && !(err instanceof AppError);
  if (unexpected) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    // Never leak internals (DB errors, stack traces, third-party messages) in production.
    if (env.isProd) message = 'Something went wrong. Please try again later.';
  } else if (status >= 500) {
    // Expected outages (e.g. a free API is busy): the message is already user-friendly.
    console.warn(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(!env.isProd && unexpected && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
