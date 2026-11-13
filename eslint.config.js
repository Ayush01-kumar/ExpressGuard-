export default [
  {
    files: ["**/*.cjs", "**/*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { Buffer: "readonly", console: "readonly", process: "readonly", setInterval: "readonly", setTimeout: "readonly", clearInterval: "readonly", Date: "readonly", Math: "readonly", Number: "readonly", Object: "readonly", Array: "readonly", String: "readonly", Error: "readonly", Promise: "readonly", Map: "readonly", Set: "readonly", RegExp: "readonly", JSON: "readonly", Reflect: "readonly", require: "readonly", module: "readonly", exports: "readonly", __dirname: "readonly", test: "readonly", assert: "readonly", express: "readonly", request: "readonly" } },
    rules: { "no-undef": "error", "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }], "no-console": "off", "no-constant-condition": "error", "eqeqeq": ["error", "always"], "no-throw-literal": "error" }
  }
];
