'use strict';
const express = require('express');
const { rateLimit } = require('expressguard-toolkit');
const app = express();
app.use(rateLimit({ windowMs: 15 * 60_000, max: 50, skip: (req) => req.path === '/health' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api', (_req, res) => res.json({ message: 'Limited endpoint' }));
module.exports = app;
if (require.main === module) app.listen(3003, () => console.log('Rate limit example listening on http://localhost:3003'));
