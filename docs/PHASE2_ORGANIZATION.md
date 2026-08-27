# Phase 2.2 — Organization

Implemented the explicit organization layer above franchises/tenants.

## Data model

- `organizations` is the top-level business container.
- `organization_memberships` connects users to organizations.
- A user may belong to multiple organizations.
- Existing tenants/franchises now have nullable `organization_id` so existing data remains valid during the staged rollout.
- The franchise phase will make organization selection mandatory when creating a new tenant.

## API

Authenticated endpoints:

- `GET /api/organizations`
- `POST /api/organizations`
- `PATCH /api/organizations/:id`
- `DELETE /api/organizations/:id`

Creating an organization requires the global `OWNER` role and creates the creator's active organization membership atomically.

Updates and archive operations require an active organization membership, so users cannot modify an organization they do not belong to.

## Migration

`apps/api/src/db/migrations/0033_organizations.sql`

The migration is backward-compatible with existing tenant records.
