'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { requestId, requestLogger } = require('../src/index.cjs');

test('emits a structured finish record without query parameters', async () => {
  const records = []; const app = express(); app.use(requestId()); app.use(requestLogger({ logger: (record) => records.push(record) }));
  app.get('/user', (_req, res) => res.status(201).send('ok'));
  await request(app).get('/user?token=secret');
  assert.equal(records.length, 1); assert.equal(records[0].method, 'GET'); assert.equal(records[0].path, '/user');
  assert.equal(records[0].statusCode, 201); assert.equal(typeof records[0].durationMs, 'number');
  assert.equal(records[0].requestId.length, 36); assert.ok(!JSON.stringify(records[0]).includes('secret'));
});
test('supports skip and contains logger failures', async () => {
  let calls = 0; const app = express();
  app.use(requestLogger({ logger: () => { calls += 1; throw new Error('logger failed'); }, skip: (req) => req.path === '/skip' }));
  app.use((_req, res) => res.send('ok'));
  await request(app).get('/skip'); await request(app).get('/logged');
  assert.equal(calls, 1);
});
test('validates callbacks', () => {
  assert.throws(() => requestLogger({ logger: true }), /logger must be a function/);
  assert.throws(() => requestLogger({ skip: 1 }), /skip must be a function/);
});
