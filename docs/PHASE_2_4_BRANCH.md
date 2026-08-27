# Phase 2.4 — Branch

Implemented as the fourth sequential Identity & Tenancy item.

## Branch identity

Every branch remains owned by exactly one franchise (`tenant_id`) and now has stable operational identity metadata:

- `code` — unique within the franchise and normalized to uppercase.
- `timezone` — an IANA timezone used as the branch-local business clock.
- `currency` — a normalized three-letter currency code.

Migration `0035_branch_identity.sql` backfills existing branches with deterministic codes and defaults existing branches to `Asia/Kolkata` / `INR`, matching Servora's current deployment assumptions.

## Authorization and isolation

Branch reads and mutations continue to use the authenticated server-issued franchise/branch context. Branch-locked users cannot mutate branches outside their authorized branch set, while tenant-wide users can manage all branches in the active franchise.

## Lifecycle rules

The API now enforces the same invariants regardless of which client calls it:

- A branch code cannot be duplicated inside the same franchise.
- A branch must keep at least one order intake type enabled.
- Tables cannot be enabled while dine-in is disabled.
- Dine-in cannot be disabled while open dine-in orders exist.
- The last active branch cannot be archived.
- A branch with open orders cannot be archived.
- Invalid IANA timezones are rejected.

## Web application

The Branch create/edit form now manages branch code, timezone and currency in addition to the existing location/contact/capability fields. Branch cards expose these identity fields so operators can distinguish similarly named outlets.

All new component styling uses Tailwind utilities and the existing shared Tailwind design tokens.
