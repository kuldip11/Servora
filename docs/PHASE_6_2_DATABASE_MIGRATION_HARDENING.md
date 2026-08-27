# Phase 6.2 — Database & Migration Hardening

Status: **COMPLETE**

Implemented:
- Added an ordered SQL migration integrity audit (`bun run verify:migrations`).
- The audit rejects gaps, duplicate numeric prefixes, empty migrations and destructive public-schema resets.
- Confirmed the current chain contains 42 sequential migrations (`0000` through `0041`).
- Migration execution now fails closed when the migrations directory is missing instead of exiting successfully.
- Existing production database-reset protection remains in place.
- Migration integrity is part of the canonical Phase 6 verification baseline.
- Added guarded PostgreSQL backup and restore commands for release operations.

Commands:
```bash
bun run verify:migrations
bun run db:backup
RESTORE_CONFIRMATION=RESTORE_SERVORA_DATABASE BACKUP_FILE=... bun run db:restore
```
