'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { asyncHandler, errorHandler } = require('../src/index.cjs');

test('handles successful async handlers and forwards rejected promises', async () => {
  const app = express(); app.get('/ok', asyncHandler(async (_req, res) => res.json({ ok: true })));
  app.get('/bad', asyncHandler(async () => { throw new Error('failed'); })); app.use(errorHandler({ logger: () => {} }));
  assert.deepEqual((await request(app).get('/ok')).body, { ok: true });
  assert.equal((await request(app).get('/bad')).status, 500);
});
test('forwards synchronous throws and rejects invalid handlers', async () => {
  assert.throws(() => asyncHandler(null), /requires a function/);
  const app = express(); app.get('/', asyncHandler(() => { throw new Error('sync'); })); app.use(errorHandler({ logger: () => {} }));
  assert.equal((await request(app).get('/')).status, 500);
});
