# Phase 6.8 — Release Certification

Status: **COMPLETE (tooling)**

Implemented:
- `bun run release:certify` requires both the full Phase 6 verification baseline and the performance smoke report to have passed.
- Generates `.verification/release-certificate.json`.
- Certificate records the app version / commit SHA when supplied and references the baseline/performance evidence.
- CI uploads the verification directory as immutable workflow evidence.

Release certification command sequence:
```bash
bun install --frozen-lockfile
bun run verify:baseline:all
PERF_BASE_URL=https://staging-api.example.com bun run verify:performance
bun run release:certify
```

Operational acceptance before production traffic should additionally exercise:
- owner/POS order creation,
- customer QR ordering,
- kitchen ticket progression,
- waiter ready-order flow,
- payment and refund,
- inventory recipe consumption,
- multi-branch tenant isolation,
- permission boundaries,
- realtime disconnect/reconnect,
- backup/restore drill.

The implementation is release-certification capable; an actual production certificate must be generated in CI/staging with real installed dependencies and a running target.
