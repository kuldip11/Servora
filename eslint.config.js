// Flat config (ESLint 9+/10). There was no working ESLint config in this
// repo before this change — see AGENTS.md / docs/accessibility/README.md
// for why. CommonJS (`module.exports`), matching this package.json's
// default (no `"type": "module"`), so it loads without extra config.
//
// Scope, deliberately narrow for now: `eslint-plugin-jsx-a11y`'s
// recommended rule set, applied to every `.tsx`/`.jsx` file across
// `apps/*` and `packages/*`, plus a handful of explicit rules called out
// by name in the accessibility engineering rules (no positive
// `tabIndex`, keyboard handlers must have a matching interactive
// role/element). This is NOT yet a full lint setup (no
// `@typescript-eslint`, no `react-hooks`, no per-app overrides) — adding
// those is a separate, non-accessibility task. Run with:
//   bunx eslint 'apps/**/*.{ts,tsx}' 'packages/**/*.{ts,tsx}'
// (not `npm run lint` / `turbo run lint` yet — nothing wires this config
// into the workspace scripts in this change; see docs/accessibility/README.md
// "Not done" for why.)

const jsxA11y = require('eslint-plugin-jsx-a11y');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
    ],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    languageOptions: {
      // TS-syntax-aware parser (`interface`, `import type`, generics,
      // etc.) — without this, every `.tsx` file in this repo fails to
      // parse before jsx-a11y ever sees it. `project: false` (the
      // default when unset): syntax-only parsing, no type-checking
      // service — jsx-a11y's rules are all AST/prop-shape based and
      // don't need type info, so skipping it keeps this fast and avoids
      // needing a working `tsconfig.json` project reference per file.
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      // Explicit per the project's accessibility engineering rules
      // (docs/accessibility/00-PLAN.md §3), stated here rather than left
      // implicit in the "recommended" preset:

      // "Never use positive tabindex." `no-noninteractive-tabindex`
      // (in recommended) catches misuse on non-interactive elements;
      // this catches the positive-integer case specifically, on *any*
      // element, interactive or not — a positive tabIndex reorders the
      // whole page's tab sequence and is never the right fix.
      'jsx-a11y/tabindex-no-positive': 'error',

      // "ARIA should never replace semantic HTML." Forces a real
      // interactive element (or an explicit, deliberate exception) over
      // e.g. `<div role="button" onClick={...}>`.
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',

      // Every keyboard handler needs a real interactive target so it's
      // actually reachable by keyboard, not just mouse/pointer.
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
];
