'use strict';
const express = require('express');
const { requestId, asyncHandler, errorHandler } = require('expressguard-toolkit');
const app = express();
app.use(requestId());
app.get('/users', asyncHandler(async (_req, res) => {
  const users = [{ id: 1, name: 'Ada' }];
  res.json(users);
}));
app.get('/fail', asyncHandler(async () => { throw Object.assign(new Error('User not found'), { status: 404 }); }));
app.use(errorHandler());
module.exports = app;
if (require.main === module) app.listen(3002, () => console.log('Error example listening on http://localhost:3002'));
