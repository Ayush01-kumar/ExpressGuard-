'use strict';

const { optionsObject } = require('../utils/validation.cjs');

/** Return a centralized Express error handler with safe production responses. */
function errorHandler(options) {
  const config = optionsObject(options, 'errorHandler');
  const logger = config.logger === undefined ? console.error : config.logger;
  const includeStack = config.includeStack === undefined ? false : config.includeStack;
  const exposeMessage = config.exposeMessage === undefined ? true : config.exposeMessage;
  if (typeof logger !== 'function') throw new TypeError('errorHandler logger must be a function.');
  if (typeof includeStack !== 'boolean' || typeof exposeMessage !== 'boolean') throw new TypeError('errorHandler includeStack and exposeMessage must be booleans.');
  return function expressGuardErrorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);
    let rawStatus;
    let rawCode;
    let rawMessage;
    let rawStack;
    try {
      rawStatus = err && (err.statusCode || err.status);
      rawCode = err && err.code;
      rawMessage = err && err.message;
      rawStack = err && err.stack;
    } catch { /* Treat hostile or malformed error objects as internal errors. */ }
    let status = 0;
    try { status = Number(rawStatus); } catch { status = 0; }
    if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
    const isServerError = status >= 500;
    const code = typeof rawCode === 'string' && /^[A-Z0-9_]{1,64}$/.test(rawCode)
      ? rawCode
      : (isServerError ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR');
    const message = isServerError || !exposeMessage || typeof rawMessage !== 'string'
      ? (isServerError ? 'Internal Server Error' : 'Request failed')
      : rawMessage;
    const body = { error: { code, message } };
    if (typeof req.id === 'string') body.error.requestId = req.id;
    if (includeStack && !isServerError && typeof rawStack === 'string') body.error.stack = rawStack;
    try { logger({ error: err, requestId: req.id, statusCode: status, timestamp: new Date().toISOString() }); } catch { /* Logging cannot change error handling. */ }
    return res.status(status).json(body);
  };
}

module.exports = errorHandler;
