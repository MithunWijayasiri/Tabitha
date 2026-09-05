import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.svelte"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
