# Phase 2.5 — Role

Implemented tenant-owned custom roles without weakening Servora's bootstrap/system roles.

- System roles remain global reference data and cannot be edited or archived.
- A custom role belongs to exactly one franchise (`tenant_id`).
- Custom roles may be `TENANT` or `BRANCH` scoped; custom `GLOBAL` roles are forbidden.
- Role names are unique case-insensitively within `(franchise, scope)`, while different franchises may use the same role name.
- Role CRUD is server-authorized with tenant-wide role-administration access.
- Assigned roles cannot be archived.
- Staff role assignment only accepts active system roles or active roles owned by the active franchise.
- Role create/update/archive actions are written to the audit log.
- The Staff page exposes Tailwind-styled role management.

Permission selection for custom roles is deliberately Phase 2.6 and is not marked complete here.
