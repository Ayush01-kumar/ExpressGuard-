'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { requestId } = require('../src/index.cjs');

test('generates a UUID, sets req.id, and returns the default header', async () => {
  const app = express(); app.use(requestId()); app.get('/', (req, res) => res.json({ id: req.id }));
  const response = await request(app).get('/');
  assert.match(response.body.id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  assert.equal(response.headers['x-request-id'], response.body.id);
});
test('accepts only validated UUIDs and replaces invalid client IDs', async () => {
  const app = express(); app.use(requestId()); app.get('/', (req, res) => res.send(req.id));
  const valid = '550e8400-e29b-41d4-a716-446655440000';
  assert.equal((await request(app).get('/').set('X-Request-ID', valid)).text, valid);
  assert.notEqual((await request(app).get('/').set('X-Request-ID', 'not-a-uuid')).text, 'not-a-uuid');
});
test('supports a custom header and validates options', async () => {
  const app = express(); app.use(requestId({ headerName: 'X-Correlation-ID' })); app.get('/', (req, res) => res.send('ok'));
  assert.ok((await request(app).get('/')).headers['x-correlation-id']);
  assert.throws(() => requestId({ headerName: 'bad header' }), /header name/);
});
