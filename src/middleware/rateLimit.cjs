'use strict';

const { optionsObject } = require('../utils/validation.cjs');

/** Create a process-local fixed-window rate limiter. */
function rateLimit(options) {
  const config = optionsObject(options, 'rateLimit');
  const windowMs = config.windowMs === undefined ? 60_000 : config.windowMs;
  const max = config.max === undefined ? 100 : config.max;
  const keyGenerator = config.keyGenerator === undefined ? (req) => req.ip : config.keyGenerator;
  const skip = config.skip === undefined ? () => false : config.skip;
  const message = config.message === undefined ? 'Too many requests. Please try again later.' : config.message;
  const statusCode = config.statusCode === undefined ? 429 : config.statusCode;
  const maxKeys = config.maxKeys === undefined ? 10_000 : config.maxKeys;
  if (!Number.isSafeInteger(windowMs) || windowMs < 1) throw new TypeError('rateLimit windowMs must be a positive safe integer.');
  if (!Number.isSafeInteger(max) || max < 1) throw new TypeError('rateLimit max must be a positive safe integer.');
  if (typeof keyGenerator !== 'function') throw new TypeError('rateLimit keyGenerator must be a function.');
  if (typeof skip !== 'function') throw new TypeError('rateLimit skip must be a function.');
  if (typeof message !== 'string' || message.length === 0) throw new TypeError('rateLimit message must be a non-empty string.');
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) throw new TypeError('rateLimit statusCode must be an HTTP error status from 400 to 599.');
  if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) throw new TypeError('rateLimit maxKeys must be a positive safe integer.');
  const buckets = new Map();
  let lastCleanup = 0;
  return function expressGuardRateLimit(req, res, next) {
    let skipped;
    try { skipped = skip(req); } catch (error) { return next(error); }
    if (skipped) return next();
    let key;
    try { key = keyGenerator(req); } catch (error) { return next(error); }
    if (typeof key !== 'string' || key.length === 0) return next(new TypeError('rateLimit keyGenerator must return a non-empty string.'));
    const now = Date.now();
    if (now - lastCleanup >= Math.min(windowMs, 60_000)) {
      for (const [storedKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(storedKey);
      lastCleanup = now;
    }
    let bucket = buckets.get(key);
    if (!bucket && buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    if (!bucket || bucket.resetAt <= now) { bucket = { count: 0, resetAt: now + windowMs }; buckets.set(key, bucket); }
    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    const retrySeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(retrySeconds));
      return res.status(statusCode).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message } });
    }
    return next();
  };
}

module.exports = rateLimit;
