'use strict';

/** Wrap an Express route so synchronous throws and rejected promises reach next. */
function asyncHandler(handler) {
  if (typeof handler !== 'function') throw new TypeError('asyncHandler requires a function.');
  return function expressGuardAsyncHandler(req, res, next) {
    try { return Promise.resolve(handler(req, res, next)).catch(next); }
    catch (error) { return next(error); }
  };
}

module.exports = asyncHandler;
