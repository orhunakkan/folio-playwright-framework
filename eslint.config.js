// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/** Code that runs under Playwright: the specs, the framework in src/, and the BDD steps. */
const PLAYWRIGHT_CODE = ['tests/**/*.ts', 'src/**/*.ts', 'bdd/**/*.ts'];

export default defineConfig(
  globalIgnores(['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/', 'playwright/.cache/', '.features-gen/', 'bdd-report/']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A leading underscore marks a deliberately unused binding, e.g. a fixture requested only for its
      // side effect: `async ({ page, testUser: _signedIn }) => …` signs the test in without reading the user.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // This file is plain JS (ESLint loads it without a TS loader), so it is outside the TS project.
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: PLAYWRIGHT_CODE,
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // Role and label locators only: resilient, and accessible by design.
      'playwright/no-raw-locators': 'error',
      'playwright/no-restricted-locators': [
        'error',
        [
          { type: 'getByText', message: 'Use getByRole or getByLabel.' },
          { type: 'getByTestId', message: 'Use getByRole or getByLabel.' },
          { type: 'getByPlaceholder', message: 'Use getByLabel.' },
          { type: 'getByAltText', message: 'Use getByRole("img", { name }).' },
          { type: 'getByTitle', message: 'Use getByRole or getByLabel.' },
        ],
      ],
      'playwright/no-element-handle': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-nth-methods': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/require-annotation-reason': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/missing-playwright-await': 'error',
    },
  },

  {
    // Mocking only for AGENTS.md's five cases, and only through src/mocking/, so every fake is in one small folder.
    files: PLAYWRIGHT_CODE,
    ignores: ['src/mocking/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^(route|routeFromHAR|routeWebSocket|unroute|setOffline|addInitScript)$/]',
          message: 'Fake the network, offline, read-aloud or time only through src/mocking/ (AGENTS.md).',
        },
        {
          selector: "MemberExpression[property.name='clock']",
          message: 'Control time only through src/mocking/ (AGENTS.md).',
        },
      ],
    },
  },

  {
    // Config meta-tests run on Node's own test runner, whose test() calls need no await.
    files: ['meta/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': ['error', { allowForKnownSafeCalls: [{ from: 'package', package: 'node:test', name: ['test', 'describe', 'it'] }] }],
    },
  },

  {
    // BDD steps (bdd/README.md): assertions go in `Then` steps only. The plugin treats `Then` as a test block, so
    // `expect` in a Given, a When or a hook is a standalone expect (an error), and a Then without one fails
    // `expect-expect`.
    files: ['bdd/steps/**/*.ts'],
    settings: { playwright: { globalAliases: { test: ['Then'] } } },
    rules: { 'playwright/expect-expect': 'error' },
  },

  {
    // Setup and teardown projects do work (e.g. the sweep) rather than check behaviour; the API client fails on a
    // bad status.
    files: ['tests/**/*.setup.ts', 'tests/**/*.teardown.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },

  // Turns off formatting rules that would fight Prettier. Keep last.
  prettier,
);
