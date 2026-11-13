'use strict';

const { randomUUID } = require('node:crypto');
const { optionsObject, headerName } = require('../utils/validation.cjs');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Assign a validated or newly generated UUID to each request and response. */
function requestId(options) {
  const config = optionsObject(options, 'requestId');
  const name = headerName(config.headerName, 'X-Request-ID', 'headerName');
  return function expressGuardRequestId(req, res, next) {
    const supplied = req.get(name);
    const id = typeof supplied === 'string' && UUID_PATTERN.test(supplied) ? supplied : randomUUID();
    req.id = id;
    res.setHeader(name, id);
    next();
  };
}

module.exports = requestId;
