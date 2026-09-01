# Business, Profile & Order Operations — Implementation Status

Source plan: `BUSINESS_PROFILE_ORDER_OPERATIONS_PLAN.md`

## Current checkpoint

### 1. Menu item cost model + margin semantics — COMPLETE

- Nullable manual item cost is implemented and exposed in Add/Edit Item beside Selling price.
- Effective-cost precedence is recipe → manual → unknown.
- Unknown cost no longer produces fake 100% margin and Menu Engineering surfaces `COST_MISSING`.

### 2. Business domain fields + validators — COMPLETE

Implemented the domain foundation for the `/business` workstream while keeping existing signup/context flows backward-compatible until their scheduled migration steps.

#### Organization

Added schema fields for:

- business type
- country, timezone, currency
- primary contact name, business email, business phone
- address line 1/2, city, state/province, postal code
- legal name, website
- tax registration number, GSTIN, PAN, company registration number
- logo URL

Added `organizationBusinessFormSchema` with required-field validation, country/currency normalization, email/URL validation, and optional GSTIN/PAN/legal registration fields.

#### Franchise (current `tenants` domain)

Added schema fields for:

- display name, description
- cuisine types
- business model
- default currency/timezone
- support email/phone, website, logo and primary brand image
- default tax rate
- dine-in, takeaway, delivery, Customer QR, table management, KDS, and waiter-service capability defaults

Existing tax mode, service charge, rounding, and course-sequencing fields remain the authoritative existing settings.

Added `franchiseBusinessFormSchema` with required cuisine/business-model/default-operating fields and validation for optional percentages and contact/brand data.

#### Branch

Added schema fields for:

- structured address: line 1/2, city, state/province, postal code, country
- manager name and email
- opening/closing time and weekly operating days
- tax/service-charge overrides
- invoice prefix and receipt footer
- inventory tracking and negative-stock policy
- Customer QR, KDS, and waiter-app capability flags

Existing `address`, `onlineEnabled`, and other legacy fields remain for compatibility during the staged `/business` migration.

Added `businessBranchFormSchema` with operational required fields, normalization, fulfillment validation, and dine-in/table-management consistency checks.

#### API compatibility

Organization, Franchise/Tenant, and Branch request validators now understand the new domain fields without forcing incomplete legacy signup/context calls to supply the whole profile before Items 3–6 migrate those flows.

#### Canonical migration baseline

The canonical create migrations and all downstream Drizzle snapshots were updated in-place, preserving Servora's v1 migration policy. No compatibility/ALTER migration was added.

### Verification

- `packages/types` TypeScript: PASS
- `packages/validation` TypeScript: PASS
- `apps/api` TypeScript: PASS
- Validation package: 63/63 PASS
- Focused Branch/Tenant/Organization API tests: 17/17 PASS
- Migration integrity: 78/78 PASS

## Remaining implementation order

3. `/business` CRUD and hierarchy UI — NEXT
4. Signup onboarding → `/business` — PENDING
5. Persisted/default Franchise + Branch context — PENDING
6. Remove `/context` from normal UX — PENDING
7. Shared Franchise/Branch selector styling — PENDING
8. Top-right Profile menu + `/profile` — PENDING
9. Remove Profile from Settings — PENDING
10. Owner/Admin/Manager order permissions — PENDING
11. Order Details round progression UI — PENDING
12. Realtime synchronization — PENDING
13. Cost/margin + Business/Profile/Order adversarial tests — PENDING
14. Full repository certification — PENDING
