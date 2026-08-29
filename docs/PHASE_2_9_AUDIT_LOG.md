# Phase 2.9 — Audit log

The audit subsystem is now a first-class append-only security and operations record.

- Audit rows are tenant-scoped and append-only at the PostgreSQL layer; UPDATE and DELETE are rejected.
- `branch_id` is a first-class column with tenant/branch integrity instead of relying on JSON metadata filtering.
- `request_id` and client IP can be captured from authenticated request context.
- Sensitive tenant, branch, staff, role, permission, and refund mutations use the centralized audit writer.
- Audit reads are tenant-scoped and branch-scoped when a branch is active.
- Audit API supports action, entity, user and cursor-style `before` filtering with bounded page size.
- Role lifecycle and permission assignment actions are included in the typed audit action contract.
