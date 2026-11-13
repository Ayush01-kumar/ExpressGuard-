# ExpressGuard

ExpressGuard is a lightweight, reusable middleware toolkit for Express applications. It packages common request identification, structured logging, process-local rate limiting, API key protection, and error handling into a small dependency-free runtime library.

## Features

- Per-request UUIDs with validated incoming request ID support.
- Structured finish-time logs that omit query strings and request bodies.
- Fixed-window in-memory rate limiting with bounded storage.
- API key middleware using constant-time comparisons.
- Safe centralized JSON errors and an async route wrapper.
- CommonJS and ES module entry points; TypeScript declarations included.

## Requirements and installation

Node.js 22 or newer and Express 4.18 or 5 are supported. Node 22, 24, and 26 are LTS lines as of November 2026 ([Node.js release schedule](https://nodejs.org/en/about/previous-releases)). This package was authored and checked on Node 24.7.0.

```sh
npm install expressguard-toolkit
```

Express is a peer dependency and must be installed by the consuming application. ExpressGuard has no mandatory runtime dependency besides that peer relationship.

## Quick start

```js
const express = require('express');
const { requestId, requestLogger, rateLimit, errorHandler } = require('expressguard-toolkit');

const app = express();
app.use(express.json());
app.use(requestId());
app.use(requestLogger());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler()); // after routes
app.listen(3000);
```

ES modules can use named imports:

```js
import express from 'express';
import { requestId, errorHandler } from 'expressguard-toolkit';
```

## Recommended middleware order

```js
app.use(express.json());       // parse the body if the app needs it
app.use(requestId());          // make the ID available to later middleware
app.use(requestLogger());      // record response status and duration
app.use(rateLimit());          // limit before expensive route work
// routes; put apiKeyAuth(...) on the routes that need protection
app.use(errorHandler());       // last error middleware
```

Use `asyncHandler` on async Express 4 route handlers. Express 5 forwards rejected route promises itself, but this wrapper remains compatible with both versions. Neither version makes ordinary callback errors automatic; pass errors to `next(err)`. Register the error handler after the routes and ordinary middleware.

## API reference

### `requestId(options?)`

Returns Express middleware. It puts a UUID in `req.id` and the response header. Incoming values are accepted only if they match a UUID format; any other value is replaced with `crypto.randomUUID()`.

| Option | Default | Meaning |
| --- | --- | --- |
| `headerName` | `X-Request-ID` | Valid HTTP response/request header name. |

```js
app.use(requestId({ headerName: 'X-Correlation-ID' }));
```

### `requestLogger(options?)`

Returns middleware that calls the logger once after the response emits `finish`. The record has `method`, query-free `path`, `statusCode`, `durationMs`, ISO `timestamp`, and `requestId` when available. It deliberately omits headers and bodies, which may hold secrets. Logger and skip callback errors are contained so they do not affect the response.

| Option | Default | Meaning |
| --- | --- | --- |
| `logger` | `console.log` | Function receiving one record object. |
| `skip` | `() => false` | Function receiving `req`; truthy skips logging. |

```js
app.use(requestLogger({ logger: (record) => console.log(JSON.stringify(record)), skip: (req) => req.path === '/health' }));
```

### `rateLimit(options?)`

Returns a fixed-window limiter keyed by `req.ip`. Exceeding the limit returns 429 by default with a JSON `RATE_LIMIT_EXCEEDED` error and `RateLimit-*` and `Retry-After` headers.

| Option | Default | Meaning |
| --- | --- | --- |
| `windowMs` | `60000` | Window duration, positive safe integer milliseconds. |
| `max` | `100` | Requests allowed per key in each window. |
| `maxKeys` | `10000` | Maximum number of active client keys stored. Oldest bucket is evicted at capacity. |
| `keyGenerator` | `req => req.ip` | Function returning a non-empty string key. |
| `skip` | `() => false` | Function receiving `req`; truthy bypasses counting. |
| `message` | `Too many requests. Please try again later.` | JSON error message. |
| `statusCode` | `429` | HTTP error status from 400 to 599. |

```js
app.use(rateLimit({ windowMs: 60_000, max: 30, skip: (req) => req.path === '/health' }));
```

This in-memory store is intended for development and single-process use. It does not share limits across worker processes, containers, or servers. For distributed enforcement, use a dedicated shared store in the application layer. When behind a reverse proxy, configure Express `trust proxy` only for proxies you trust; otherwise `req.ip` may identify the proxy or may rely on spoofable forwarding data.

### `apiKeyAuth(options)`

Returns route middleware. A valid key calls `next()` and sets `req.auth` to `{ type: 'apiKey', keyIndex }`; this index identifies the matching configured entry without exposing the secret. A missing or invalid key returns 401.

| Option | Default | Meaning |
| --- | --- | --- |
| `apiKeys` | required | Non-empty array of non-empty strings. |
| `headerName` | `X-API-Key` | Header used to read the key. |
| `message` | `Missing or invalid API key` | Unauthorized response message. |

```js
app.get('/private', apiKeyAuth({ apiKeys: [process.env.API_KEY] }), (req, res) => res.json({ auth: req.auth }));
```

Load keys from environment variables or a secrets manager. Never commit real keys to GitHub. This middleware is API key protection, not user authentication, authorization, rotation, or revocation management. Empty/missing environment values should be filtered before passing the array.

### `errorHandler(options?)`

Returns Express error middleware. Valid 400–599 `status`/`statusCode` values are respected; unexpected errors produce a generic 500. Responses include a safe code/message and `requestId` when present. Server error details are never returned to clients.

| Option | Default | Meaning |
| --- | --- | --- |
| `logger` | `console.error` | Function receiving a structured error record. |
| `includeStack` | `false` | Include stack for non-500 errors only; enable only in development. |
| `exposeMessage` | `true` | Show valid 4xx messages; set false for generic client text. |

```js
app.use(errorHandler());
```

If headers were already sent it delegates with `next(err)`. Logging callback failures are contained. Errors must still reach Express through `next(err)`; this middleware cannot catch every asynchronous error by itself.

### `asyncHandler(handler)`

Returns a route wrapper that forwards synchronous throws and promise rejections to `next(err)`. The handler must be a function.

```js
app.get('/users', asyncHandler(async (_req, res) => {
  const users = await loadUsers();
  res.json(users);
}));
```

## Examples

The runnable consumer-style examples import the package by its public name. After `npm install`, run any example with `node examples/basic-usage.cjs` (or `protected-routes.cjs`, `custom-rate-limit.cjs`, `error-handling.cjs`). The protected example needs `API_KEY` in its environment. `.env.example` is a placeholder only; do not put real credentials in it.

## Common problems

- **`req.ip` is the proxy address:** configure Express `trust proxy` to match your actual trusted proxy topology.
- **A request ID was replaced:** only UUID-formatted IDs are accepted, to avoid trusting arbitrary client values.
- **401 on a protected route:** send the exact configured key in `X-API-Key` (or the chosen header).
- **An async error does not reach the handler:** wrap Express 4 async routes in `asyncHandler` or call `next(err)`.
- **Rate limits differ across workers:** the store is process-local and intentionally has no shared backend.
- **Invalid options:** middleware factories validate their configuration and throw a `TypeError` during app setup.

## Development

```sh
npm install
npm test
npm run lint
npm run check
npm pack --dry-run
```

The test suite uses Node's built-in `node:test` runner and Supertest for HTTP integration tests. Express is a development dependency for tests and remains a peer dependency for consumers.

## Project status

Version 1.0.0 implements and tests all six middleware/utilities. CommonJS, ESM, TypeScript declarations, and four examples are included. The rate limiter is intentionally process-local; no Redis or other shared store is bundled.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under the MIT License; see [LICENSE](LICENSE).

## Publishing checklist

The package is prepared for publication but has not been published. Before publishing, confirm the npm name is available, update version/changelog, run the full checks, inspect `npm pack --dry-run`, then use `npm publish`. To publish source, create or select a GitHub repository, review `.env` and `git status`, then commit and push with your own repository remote. No registry publication or push has been performed.
