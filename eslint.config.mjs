export default {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint"
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: ".",
    ecmaVersion: 2018,
    sourceType: "module"
  },
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
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
    ]
  }
}
