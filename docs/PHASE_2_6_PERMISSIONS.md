# Phase 2.6 — Permissions

Implemented the permission catalog and custom-role permission assignment.

- Canonical permission catalog is exposed read-only through `GET /api/permissions`.
- Custom role permissions are read via `GET /api/roles/:id/permissions`.
- Custom role permissions are replaced atomically via `PUT /api/roles/:id/permissions`.
- Permission assignment validates every permission ID and is restricted to tenant-wide authorized administrators.
- System-role permissions remain immutable application reference data.
- New dedicated role-management permissions are seeded and granted to OWNER and FRANCHISE_ADMIN.
- Permission changes are audit logged.
- The Staff role manager provides a Tailwind permission editor grouped by module.
