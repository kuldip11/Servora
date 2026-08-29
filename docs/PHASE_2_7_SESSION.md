# Phase 2.7 — Session

Implemented first-class authenticated sessions.

- `user_sessions` tracks active login sessions separately from refresh-token records.
- Every new refresh token belongs to one session.
- Refresh rotates tokens atomically while retaining and touching the same session.
- Legacy unbound refresh tokens are revoked by migration.
- Logout revokes the entire current session and all of its refresh tokens.
- `GET /api/auth/sessions` lists active sessions for the authenticated user.
- `DELETE /api/auth/sessions/:id` revokes one of the authenticated user's sessions.
- Session ownership is enforced server-side.
