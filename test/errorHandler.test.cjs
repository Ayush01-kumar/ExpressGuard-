'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { requestId, errorHandler } = require('../src/index.cjs');

test('returns safe standardized 500 with request ID and logs structured data', async () => {
  const logs = []; const app = express(); app.use(requestId()); app.get('/', (_req, _res, next) => next(new Error('db password secret')));
  app.use(errorHandler({ logger: (entry) => logs.push(entry) }));
  const response = await request(app).get('/');
  assert.equal(response.status, 500); assert.equal(response.body.error.code, 'INTERNAL_SERVER_ERROR');
  assert.equal(response.body.error.message, 'Internal Server Error'); assert.equal(response.body.error.requestId, response.headers['x-request-id']);
  assert.ok(!JSON.stringify(response.body).includes('password')); assert.equal(logs.length, 1);
});
test('respects valid 4xx status and optionally includes stack in development', async () => {
  const app = express(); app.get('/', (_req, _res, next) => next(Object.assign(new Error('No access'), { status: 403 })));
  app.use(errorHandler({ logger: () => {}, includeStack: true }));
  const response = await request(app).get('/');
  assert.equal(response.status, 403); assert.equal(response.body.error.message, 'No access'); assert.match(response.body.error.stack, /No access/);
});
test('safely handles malformed error objects', async () => {
  const app = express(); app.get('/', (_req, _res, next) => next({ get statusCode() { throw new Error('bad getter'); } }));
  app.use(errorHandler({ logger: () => {} }));
  const response = await request(app).get('/');
  assert.equal(response.status, 500); assert.equal(response.body.error.message, 'Internal Server Error');
});
test('forwards when headers are sent and validates options', async () => {
  assert.throws(() => errorHandler({ includeStack: 'yes' }), /must be booleans/);
  let forwarded = false; const handler = errorHandler({ logger: () => {} });
  handler(new Error('late'), {}, { headersSent: true }, (err) => { forwarded = Boolean(err); });
  assert.equal(forwarded, true);
});
