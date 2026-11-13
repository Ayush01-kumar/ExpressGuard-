'use strict';
const express = require('express');
const { apiKeyAuth } = require('expressguard-toolkit');
function createApp(key = process.env.API_KEY) {
  if (!key) throw new Error('Set API_KEY in the environment before running this example.');
  const app = express();
  app.get('/protected', apiKeyAuth({ apiKeys: [key] }), (_req, res) => res.json({ message: 'Authenticated successfully' }));
  return app;
}

module.exports = { createApp };
if (require.main === module) createApp().listen(3001, () => console.log('Protected example listening on http://localhost:3001'));
