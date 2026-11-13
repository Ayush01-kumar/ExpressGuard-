'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const basic = require('../examples/basic-usage.cjs');
const protectedRoutes = require('../examples/protected-routes.cjs');
const customRateLimit = require('../examples/custom-rate-limit.cjs');
const errorHandling = require('../examples/error-handling.cjs');

test('basic example responds with request ID and health status', async () => {
  const originalLog = console.log;
  console.log = () => {};
  let response;
  try { response = await request(basic).get('/health'); } finally { console.log = originalLog; }
  assert.equal(response.status, 200); assert.equal(response.body.status, 'ok'); assert.ok(response.headers['x-request-id']);
});
test('protected route example enforces its API key', async () => {
  const app = protectedRoutes.createApp('example-only-test-key');
  assert.equal((await request(app).get('/protected')).status, 401);
  assert.equal((await request(app).get('/protected').set('X-API-Key', 'example-only-test-key')).status, 200);
});
test('custom rate limit example serves health and API endpoints', async () => {
  assert.equal((await request(customRateLimit).get('/health')).status, 200);
  assert.equal((await request(customRateLimit).get('/api')).status, 200);
});
test('error handling example serves async success and error routes', async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await request(errorHandling).get('/users')).status, 200);
    assert.equal((await request(errorHandling).get('/fail')).status, 404);
  } finally { console.error = originalError; }
});
