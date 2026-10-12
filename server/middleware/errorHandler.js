/** 404 for unknown API routes. */
export function notFound(_req, res) {
  res.status(404).json({ error: 'not_found', message: 'Route not found' });
}

/**
 * Central error handler. Express 5 forwards rejected async handlers here.
 * We log the full error server-side but only return a safe message.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    error: err.code || (status === 500 ? 'internal_error' : 'request_error'),
    message: status === 500 ? 'Something went wrong on our side. Please try again.' : err.message,
  });
}

/** Helper to throw HTTP errors from route handlers: throw httpError(400, 'bad_url', 'Invalid URL') */
export function httpError(status, code, message) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}
