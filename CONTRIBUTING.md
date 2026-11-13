# Contributing

Issues and pull requests are welcome. Keep changes focused and explain the behavior being changed.

## Development setup

1. Use Node.js 22 or newer.
2. Run `npm install`.
3. Make changes in `src/` and add HTTP integration coverage in `test/`.
4. Run `npm test`, `npm run lint`, `npm run check`, and `npm pack --dry-run`.
5. Update README and CHANGELOG when public behavior changes.

Please do not include real API keys, credentials, or personal data in source, examples, logs, or test fixtures. Keep the package dependency-light and preserve both CommonJS and ESM exports.
