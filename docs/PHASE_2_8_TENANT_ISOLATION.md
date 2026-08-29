# Phase 2.8 — Tenant isolation

Tenant isolation is enforced at both request authorization and database integrity layers.

- Active franchise/branch headers are selectors only; `requireAuthPlugin` resolves membership and branch authorization from the database.
- Tenant-owned custom roles cannot be assigned to memberships from another franchise.
- Global roles must remain application-owned and cannot point at a tenant-owned custom role.
- Composite `(branch_id, tenant_id)` foreign keys protect the primary branch-scoped operational tables from cross-tenant references.
- Staff role lookup accepts only system roles or custom roles owned by the active franchise.
- Franchise bootstrap role lookup now explicitly resolves the application-owned system role, so duplicate custom names in other franchises cannot affect provisioning.
- Cross-tenant authorization continues to return access-denied/not-found semantics rather than exposing foreign resource details.
