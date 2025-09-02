module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "commonjs": true,
    "es2021": true,
    "mocha": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2021
  },
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    "max-len": ["warn", { "code": 120 }],
    "arrow-parens": ["error", "always"],
    "arrow-spacing": ["error", { "before": true, "after": true }],
    "prefer-const": "error",
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", {
      "arrays": "only-multiline",
      "objects": "only-multiline",
      "imports": "only-multiline",
      "exports": "only-multiline",
      "functions": "never"
    }]
  },
  "overrides": [
    {
      "files": ["*.test.js", "test/**/*.js"],
      "rules": {
        "no-unused-expressions": "off",
        "no-console": "off"
      }
    },
    {
      "files": ["public/**/*.js"],
      "env": {
        "browser": true,
        "node": false
      },
      "globals": {
        "fetch": "readonly",
        "document": "readonly",
        "window": "readonly",
        "alert": "readonly"
      }
    }
  ]
}
