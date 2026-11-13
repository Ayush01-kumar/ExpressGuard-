import type { RequestHandler, ErrorRequestHandler } from 'express';
import { requestId, requestLogger, rateLimit, apiKeyAuth, errorHandler, asyncHandler } from 'expressguard-toolkit';

const middleware: RequestHandler[] = [
  requestId(),
  requestLogger({ logger: (record) => record.statusCode, skip: (req) => req.path === '/health' }),
  rateLimit({ max: 20, windowMs: 30_000, keyGenerator: (req) => req.ip ?? 'unknown' }),
  apiKeyAuth({ apiKeys: ['typing-only-example'] }),
  asyncHandler(async (_req, res) => { res.send('ok'); })
];
const errors: ErrorRequestHandler = errorHandler({ includeStack: true });
void middleware;
void errors;
