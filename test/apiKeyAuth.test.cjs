'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { apiKeyAuth } = require('../src/index.cjs');

test('rejects missing and invalid keys and accepts configured keys', async () => {
  const app = express(); app.get('/', apiKeyAuth({ apiKeys: ['secret-one', 'secret-two'] }), (req, res) => res.json(req.auth));
  assert.equal((await request(app).get('/')).status, 401);
  assert.equal((await request(app).get('/').set('X-API-Key', 'wrong')).body.error.code, 'UNAUTHORIZED');
  const accepted = await request(app).get('/').set('X-API-Key', 'secret-two');
  assert.equal(accepted.status, 200); assert.deepEqual(accepted.body, { type: 'apiKey', keyIndex: 1 });
  assert.ok(!JSON.stringify(accepted.body).includes('secret'));
});
test('supports custom header and validates configured keys', async () => {
  assert.throws(() => apiKeyAuth({ apiKeys: [] }), /non-empty array/);
  assert.throws(() => apiKeyAuth({ apiKeys: ['a'], headerName: 'bad name' }), /header name/);
  const app = express(); app.get('/', apiKeyAuth({ apiKeys: ['abc'], headerName: 'X-Service-Key' }), (_req, res) => res.send('ok'));
  assert.equal((await request(app).get('/').set('X-Service-Key', 'abc')).status, 200);
});
