'use strict';

const { optionsObject } = require('../utils/validation.cjs');

/** Log one structured, query-free record when the response finishes. */
function requestLogger(options) {
  const config = optionsObject(options, 'requestLogger');
  const logger = config.logger === undefined ? console.log : config.logger;
  const skip = config.skip === undefined ? () => false : config.skip;
  if (typeof logger !== 'function') throw new TypeError('requestLogger logger must be a function.');
  if (typeof skip !== 'function') throw new TypeError('requestLogger skip must be a function.');
  return function expressGuardRequestLogger(req, res, next) {
    let shouldSkip;
    try { shouldSkip = Boolean(skip(req)); } catch (error) { return next(error); }
    if (!shouldSkip) {
      const startedAt = process.hrtime.bigint();
      const timestamp = new Date().toISOString();
      res.once('finish', () => {
        const record = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
          timestamp
        };
        if (typeof req.id === 'string') record.requestId = req.id;
        try { logger(record); } catch { /* Logging must not affect a completed response. */ }
      });
    }
    next();
  };
}

module.exports = requestLogger;
