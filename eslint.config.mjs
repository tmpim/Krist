// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import mochaPlugin from "eslint-plugin-mocha";
import codegenPlugin from "eslint-plugin-codegen";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "static",
      "views",
      "data",
      "dist",
      "coverage",
      "mochawesome-report",
      ".nyc_output",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  mochaPlugin.configs.flat.recommended,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "codegen": codegenPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true
      },
    }
  },
  {
    files: [
      "src/**/*.ts",
      "test/**/*.ts",
    ],
    rules: {
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      semi: "error",
      indent: ["error", 2, {
        FunctionDeclaration: { parameters: "first" }
      }],
      "prefer-arrow-callback": "warn",
      "eol-last": ["error", "always"],
      "object-shorthand": ["error", "always"],
      "no-unused-vars": 0,
      "no-lonely-if": "warn",
      "no-trailing-spaces": "warn",
      "no-whitespace-before-property": "warn",
      "no-multiple-empty-lines": "warn",
      "space-before-blocks": "warn",
      "space-in-parens": ["warn", "never"],
      "space-infix-ops": "warn",
      "eqeqeq": "warn",
      "no-shadow": ["error"],
      "no-var": ["error"],
      "prefer-const": ["error"],
      "one-var": ["error", { separateRequires: true }],

      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/explicit-module-boundary-types": ["warn", {
        allowArgumentsExplicitlyTypedAsAny: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowedNames: [],
        allowHigherOrderFunctions: true,
        allowTypedFunctionExpressions: true
      }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/member-delimiter-style": ["error", {
        multiline: { delimiter: "semi", requireLast: true },
        singleline: { delimiter: "semi", requireLast: false }
      }],
      "@typescript-eslint/no-unused-vars": ["warn", {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/space-before-function-paren": ["warn", {
        anonymous: "never",
        named: "never",
        asyncArrow: "always"
      }],

      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["StrictPascalCase"] },
        { selector: "variable", format: ["strictCamelCase", "UPPER_CASE", "StrictPascalCase"] },
        { selector: "variable", modifiers: ["destructured"], format: null }
      ],

      "codegen/codegen": "error"
    }
  },
  {
    files: [
      "test/**/*.ts"
    ],
    rules: {
      "prefer-arrow-callback": "off",
      "mocha/no-identical-title": "off",
      "mocha/no-setup-in-describe": "off",
      "mocha/max-top-level-suites": "off",
    }
  }
);
