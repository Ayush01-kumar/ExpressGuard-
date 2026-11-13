'use strict';

const { timingSafeEqual } = require('node:crypto');
const { optionsObject, headerName } = require('../utils/validation.cjs');

/** Protect a route using one or more configured API keys. */
function apiKeyAuth(options) {
  const config = optionsObject(options, 'apiKeyAuth');
  if (!Array.isArray(config.apiKeys) || config.apiKeys.length === 0 || config.apiKeys.some((key) => typeof key !== 'string' || key.length === 0)) {
    throw new TypeError('apiKeyAuth apiKeys must be a non-empty array of non-empty strings.');
  }
  const keys = config.apiKeys.map((key) => Buffer.from(key, 'utf8'));
  const name = headerName(config.headerName, 'X-API-Key', 'headerName');
  const unauthorizedMessage = config.message === undefined ? 'Missing or invalid API key' : config.message;
  if (typeof unauthorizedMessage !== 'string' || unauthorizedMessage.length === 0) throw new TypeError('apiKeyAuth message must be a non-empty string.');
  return function expressGuardApiKeyAuth(req, res, next) {
    const candidate = req.get(name);
    let matchedIndex = -1;
    if (typeof candidate === 'string') {
      const supplied = Buffer.from(candidate, 'utf8');
      for (let i = 0; i < keys.length; i += 1) {
        const expected = keys[i];
        const comparable = Buffer.alloc(expected.length);
        supplied.copy(comparable, 0, 0, expected.length);
        const equal = timingSafeEqual(expected, comparable) && supplied.length === expected.length;
        if (equal) matchedIndex = i;
      }
    }
    if (matchedIndex < 0) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: unauthorizedMessage } });
    req.auth = { type: 'apiKey', keyIndex: matchedIndex };
    return next();
  };
}

module.exports = apiKeyAuth;
