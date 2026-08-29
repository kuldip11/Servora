# Phase 2.1 — Authentication

Implemented authentication hardening:

- Password login remains bcrypt-backed and uses a generic invalid-credentials response.
- Five consecutive failed attempts temporarily lock an account for 15 minutes.
- Successful login clears failure counters and lock state.
- Refresh tokens remain one-time consumable/rotated.
- Added authenticated-independent `POST /api/auth/logout` to revoke the presented refresh token.
- Added database fields `users.failed_login_attempts` and `users.locked_until`.
- Existing access tokens remain short-lived and tenant/branch context is not embedded in them.

Database migration: `apps/api/src/db/migrations/0032_auth_hardening.sql`.
