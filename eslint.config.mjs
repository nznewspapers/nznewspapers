import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "off"
    }
  },
  {
    ignores: ["docs/", "node_modules/", "data/"]
  }
];
