'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('CommonJS and ESM exports expose all six functions', async () => {
  const names = ['requestId', 'requestLogger', 'rateLimit', 'apiKeyAuth', 'errorHandler', 'asyncHandler'];
  const cjs = require('expressguard-toolkit');
  const esm = await import('expressguard-toolkit');
  for (const name of names) { assert.equal(typeof cjs[name], 'function'); assert.equal(typeof esm[name], 'function'); }
  assert.equal(typeof esm.default.rateLimit, 'function');
});

