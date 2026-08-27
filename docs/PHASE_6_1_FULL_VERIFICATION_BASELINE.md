# Phase 6.1 — Full Verification Baseline

Status: **COMPLETE**  
Completed: 2026-08-28

## Goal

Provide one reproducible release gate for the entire Servora monorepo so a partial test run cannot be mistaken for release certification.

## Implemented

- Added `scripts/release/verify-baseline.mjs`.
- Made root `bun run verify` delegate to the Phase 6 release baseline.
- Added:
  - `bun run verify:baseline`
  - `bun run verify:baseline:all`
  - `bun run verify:baseline:plan`
- Added a standard `test` script to `apps/waiter-app`; previously `turbo run test` could skip Waiter because it exposed only `test:unit`.
- Added `.verification/` to `.gitignore`.
- Verification writes `.verification/phase6-baseline.json` with pass/fail/blocked status, step exit codes and durations.
- The normal runner refuses to claim success when dependencies or Bun are unavailable.

## Canonical release gate

From repository root:

```bash
bun install --frozen-lockfile
bun run verify
```

For a complete diagnostic pass that continues after failures:

```bash
bun run verify:baseline:all
```

To inspect the exact gate without executing it:

```bash
bun run verify:baseline:plan
```

## Gate order

1. Database migration integrity
2. Environment example contract
3. Monorepo lint
4. All workspace typechecks
5. All workspace production builds
6. All workspace unit/integration tests
7. Coverage suites
8. POS/Admin browser E2E
9. Website browser E2E and accessibility

## Verification performed in the implementation sandbox

The following checks were executable and passed:

- `node --check scripts/release/verify-baseline.mjs`
- `node scripts/release/verify-baseline.mjs --plan`
- `node scripts/foundation/validate-env-examples.mjs`

A normal baseline execution correctly returned **BLOCKED** because this extracted source tree has no `node_modules` and the execution environment has no Bun installation. This is an environment blocker, not a release pass.

## Release rule

Phase 6.1 establishes the gate; a deployment should not be certified until `bun run verify` returns exit code `0` in a clean environment with the locked dependencies installed and the Playwright browsers available.

## Next

Phase 6.2 — Database & migration hardening (completed in this Phase 6 implementation).
