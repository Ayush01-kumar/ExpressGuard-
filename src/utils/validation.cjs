'use strict';

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

function optionsObject(options, name) {
  if (options === undefined) return {};
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`${name} options must be an object.`);
  }
  return options;
}

function headerName(value, fallback, optionName) {
  const result = value === undefined ? fallback : value;
  if (typeof result !== 'string' || !HEADER_NAME.test(result)) {
    throw new TypeError(`${optionName} must be a valid HTTP header name.`);
  }
  return result;
}

module.exports = { optionsObject, headerName };
