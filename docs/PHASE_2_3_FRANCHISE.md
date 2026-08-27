# Phase 2.3 — Franchise

Implemented and validated as the next sequential identity/tenancy item.

## Data model

- `tenants.organization_id` is mandatory.
- Legacy tenants are backfilled into organizations during migration `0034_franchise_organization_required.sql`.
- The foreign key uses `ON DELETE RESTRICT`; an organization cannot be deleted while franchises reference it.

## API contract

`POST /api/tenants` requires both `name` and `organizationId`.

The server verifies that the authenticated user has an active membership in the requested organization and that the organization is active before creating the franchise.

## Mutation authorization

Franchise update and archive operations load the franchise first and verify the caller has an active membership in the franchise's organization before proceeding.

## Compatibility

- Existing tenant UUIDs remain unchanged.
- Tenant names are still not unique.
- Existing tenant memberships and branch relationships remain intact.
- The web context flow now selects an active organization before creating a franchise.
