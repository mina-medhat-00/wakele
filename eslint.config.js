const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tseslint = require("typescript-eslint");
const reactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "modules/**",
      "android/**",
      "ios/**",
      ".expo/**",
      "expo-env.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        { allowString: false, allowNumber: false, allowNullableObject: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/return-await": ["error", "always"],
      // Metro needs `require()` for static assets (images, fonts, sounds)
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["\\.(png|jpe?g|gif|otf|ttf|wav|mp3)$"] },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-native": reactNative },
    languageOptions: {
      globals: { __DEV__: "readonly" },
    },
    rules: {
      "react-native/no-unused-styles": "error",
      "react-native/split-platform-components": "error",
      "react-native/no-inline-styles": "error",
      "react-native/no-color-literals": "error",
      "react-native/no-raw-text": ["error", { skip: ["Text"] }],
      "react-native/no-single-element-style-arrays": "error",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      "react/jsx-no-useless-fragment": "error",
      "react/no-array-index-key": "error",
      "react/no-unstable-nested-components": "error",
      "react/jsx-no-leaked-render": "error",
      "react/self-closing-comp": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": ["error", "never"],
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-console": "error",
      "no-param-reassign": "error",
      "no-nested-ternary": "error",
      "no-implicit-coercion": "error",
      "no-else-return": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "writable",
        require: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
