'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { rateLimit } = require('../src/index.cjs');

test('limits requests and includes standard headers plus Retry-After', async () => {
  const app = express(); app.use(rateLimit({ max: 1, windowMs: 60_000 })); app.get('/', (_req, res) => res.send('ok'));
  assert.equal((await request(app).get('/')).status, 200);
  const blocked = await request(app).get('/');
  assert.equal(blocked.status, 429); assert.equal(blocked.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(blocked.headers['ratelimit-limit'], '1'); assert.equal(blocked.headers['ratelimit-remaining'], '0');
  assert.ok(blocked.headers['retry-after']);
});
test('supports skip and custom keys', async () => {
  const app = express(); app.use(rateLimit({ max: 1, keyGenerator: (req) => req.get('x-client') || 'default', skip: (req) => req.path === '/health' }));
  app.get('*path', (_req, res) => res.send('ok'));
  assert.equal((await request(app).get('/health')).status, 200);
  assert.equal((await request(app).get('/a').set('x-client', 'a')).status, 200);
  assert.equal((await request(app).get('/b').set('x-client', 'b')).status, 200);
  assert.equal((await request(app).get('/c').set('x-client', 'a')).status, 429);
});
test('expires a bucket after its configured window', async () => {
  const app = express(); app.use(rateLimit({ max: 1, windowMs: 20 })); app.get('/', (_req, res) => res.send('ok'));
  assert.equal((await request(app).get('/')).status, 200);
  assert.equal((await request(app).get('/')).status, 429);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal((await request(app).get('/')).status, 200);
});
test('validates options and the key generator result', async () => {
  assert.throws(() => rateLimit({ max: 0 }), /max must/);
  assert.throws(() => rateLimit({ windowMs: 0 }), /windowMs must/);
  const app = express(); app.use(rateLimit({ keyGenerator: () => '' })); app.use((_err, _req, res, _next) => res.status(500).json({ failed: true }));
  app.get('/', (_req, res) => res.send('ok'));
  assert.equal((await request(app).get('/')).status, 500);
});
