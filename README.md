# ExpressGuard

ExpressGuard is a lightweight middleware toolkit for Express applications. It packages common request tracking, logging, rate limiting, API key protection, and error handling so developers can reuse them instead of rebuilding them for every project.

Install it with `npm install expressguard-toolkit`. Express 4.18 and Express 5 are supported, and Node.js 22 or newer is required. Express is a peer dependency, so your application should install Express as well.

Import the functions you need with `const { requestId, requestLogger, rateLimit, apiKeyAuth, errorHandler, asyncHandler } = require('expressguard-toolkit')`, or use named imports in an ES module. CommonJS and ESM entry points are included.

`requestId()` assigns each request a UUID, stores it at `req.id`, and returns it in the `X-Request-ID` response header. It accepts incoming IDs only when they match the supported UUID format; invalid values are replaced with generated IDs.

`requestLogger()` emits a structured record when a response finishes, including its method, path, status, duration, timestamp, and request ID when available. Query strings, headers, and request bodies are omitted by default to reduce the chance of logging sensitive data.

`rateLimit()` limits requests per client IP by default and returns HTTP 429 with rate limit headers when a client exceeds its allowance. Configure its window, request maximum, skip callback, or key generator as needed; the in-memory store is bounded but only shares limits within one process.

`apiKeyAuth({ apiKeys })` protects routes using the `X-API-Key` header by default and uses timing-safe comparisons. Store keys in environment variables or a secrets manager, never in source control; this middleware provides API key protection, not user authentication.

`asyncHandler(handler)` forwards synchronous exceptions and rejected promises to Express error middleware, which is especially useful for async routes in Express 4. `errorHandler()` returns consistent JSON errors, includes a request ID when available, and hides internal server error details from clients.

Register body parsing first if needed, then `requestId()`, `requestLogger()`, and `rateLimit()`. Add `apiKeyAuth()` to protected routes, wrap async route handlers with `asyncHandler()` when needed, and register `errorHandler()` after routes. When using a reverse proxy, configure Express `trust proxy` only for proxies you trust.

The `examples/` directory contains runnable basic, protected-route, rate limit, and error-handling applications. Run one with `node examples/basic-usage.cjs` after installing dependencies. Run `npm test`, `npm run lint`, `npm run check`, and `npm pack --dry-run` to check the package; CI also covers Node.js 22, 24, and 26 with Express 4 and 5. ExpressGuard is MIT licensed; see [LICENSE](LICENSE) and [CONTRIBUTING.md](CONTRIBUTING.md).
