# Business, Profile & Order Operations — Next Work Plan

> Status: **COMPLETE — IMPLEMENTED AND CERTIFIED 2026-09-01**
>
> Purpose: This document is the next implementation workstream after the certified RBAC/security and Menu audits. It defines the product, UX, authorization, persistence, and verification requirements for Business management, user Profile, context selection, and Order round operations.

All 14 implementation-order items and the acceptance criteria in this plan are implemented in this checkpoint.

## 1. Goals

This workstream has four primary goals:

1. Replace the current `/context` experience with a first-class `/business` module.
2. Make Organization → Franchise → Branch setup complete enough for a real restaurant POS onboarding flow.
3. Add a dedicated `/profile` experience accessed from the top-right user menu, while removing profile/account editing from Settings.
4. Give Owner, Franchise Admin, and Manager complete round-status controls from Order Details while preserving least-privilege behavior for Chef, Waiter, and other roles.

The intended user-facing business hierarchy remains:

```text
Organization
→ Franchise
→ Branch
```

The user-facing route and side-nav label will be **Business**, not Organization.

---

# Part A — Business module

## 2. `/business` as a first-class module

Add a new Web route:

```text
/business
```

Add **Business** to the side navigation for users with appropriate business-management access.

`/business` becomes the single place for:

```text
Organization CRUD
Franchise CRUD
Branch CRUD
Business hierarchy
Activation / deactivation
Archive operations where safe
```

The top-nav Franchise and Branch selectors remain **selection controls only**. They must not contain create actions.

## 3. Remove `/context` from the normal UX

The current `/context` page/modal flow should no longer be part of ordinary login or refresh behavior.

Temporary compatibility behavior:

```text
/context → /business
```

Once no runtime links depend on `/context`, the route and obsolete context-selection UI can be removed.

## 4. Signup onboarding

Fresh signup flow:

```text
Signup
→ /business
→ Create Organization
→ Create Franchise
→ Create Branch
→ Continue to Dashboard
```

`/business` must detect incomplete setup and become an onboarding surface.

Example:

```text
Set up your business

1. Organization       Required
2. Franchise          Required
3. Branch             Required
4. Ready
```

Rules:

- Franchise creation is unavailable until an Organization exists.
- Branch creation is unavailable until a Franchise exists.
- Dashboard continuation is unavailable until the minimum hierarchy is complete.
- Refreshing halfway through onboarding must resume at the first incomplete step.
- Existing users with complete setup must see the normal Business management experience, not onboarding.

---

## 5. Organization data model and required information

Organization represents the top-level legal/business group. It should contain enough information for a restaurant POS provider to understand the business rather than only storing a display name.

### Required Organization fields

```text
Organization / Business name *
Business type *
Country *
Timezone *
Currency *
Primary contact name *
Business email *
Business phone *
Address line 1 *
City *
State / Province *
Postal code *
```

### Optional Organization fields

```text
Legal name
Address line 2
Website
Tax registration number
GSTIN
PAN
Company registration number
Logo
```

### Suggested business-type options

```text
Restaurant Group
Independent Restaurant
Hospitality Group
Cloud Kitchen Group
Cafe Group
QSR Group
Food Service Company
Other
```

GSTIN/PAN must remain optional because not every business will have the same legal/tax registration profile.

---

## 6. Franchise data model and required information

A Franchise represents the restaurant brand/business operating under the Organization.

Example:

```text
Organization: KKS Hospitality Pvt Ltd
Franchise:    KKS Kitchen
```

### Required Franchise fields

```text
Franchise / Brand name *
Cuisine type *
Business model *
Default tax mode *
Default currency *
Default timezone *
Dine In enabled
Takeaway enabled
Delivery enabled
Customer QR enabled
Table management enabled
KDS enabled
Waiter service enabled
```

### Optional Franchise fields

```text
Display name
Description
Support email
Support phone
Website
Logo
Primary brand image
Default tax rate
Service charge percentage
Service charge taxable
Rounding policy
Course sequencing
```

### Suggested business-model values

```text
Restaurant
Cafe
Cloud Kitchen
QSR
Fine Dining
Food Court
Bakery
Bar / Pub
Other
```

Cuisine type may be multi-select.

Where possible, current tenant-level operational settings should be surfaced here rather than remaining hidden in unrelated Settings screens.

---

## 7. Branch data model and required information

Branch is the most operationally important business entity. A newly-created branch should have enough configuration for POS/KDS/Waiter behavior to work immediately.

### Required Branch fields

```text
Branch name *
Franchise *
Status *
Address line 1 *
City *
State *
Postal code *
Country *
Timezone *
Phone *
Dine In enabled
Takeaway enabled
Delivery enabled
Customer QR enabled
Table management enabled
KDS enabled
Waiter app enabled
```

### Optional Branch fields

```text
Branch code
Address line 2
Manager name
Email
Opening time
Closing time
Weekly operating days
Tax override
Service charge override
Invoice prefix
Receipt footer
Default kitchen station
Inventory tracking enabled
Negative stock policy
```

The first implementation does not need every optional field, but the required information must be enough for a usable restaurant branch rather than a bare name record.

---

## 8. Business page information architecture

Prefer a hierarchy-first management experience:

```text
KKS Hospitality
│
├── KKS Kitchen
│   ├── Main Branch
│   ├── Airport Branch
│   └── Sector 29 Branch
│
└── KKS Cafe
    ├── City Center
    └── Railway Station
```

Primary Business-page actions:

```text
+ Organization
+ Franchise
+ Branch
```

Entity-level actions:

### Organization

```text
View
Edit
Add Franchise
```

### Franchise

```text
View
Edit
Add Branch
Activate / deactivate
Archive where safe
```

### Branch

```text
View
Edit
Activate / deactivate
Archive where safe
```

Permanent deletion should be avoided for entities that already have operational history. Prefer archive/deactivate semantics.

---

## 9. Business permissions

Authorization must use concrete permissions and membership scope. Do not reintroduce generic OWNER bypasses.

### Organization

**Global Owner**

```text
Read       ✅
Create     ✅
Update     ✅
```

**Franchise Admin**

```text
Read parent organization                  ✅
Update parent organization                ❌ by default
Create/manage sibling franchises          ❌ by default
```

**Manager**

```text
Read basic business context               ✅ where needed
Organization management                   ❌
```

### Franchise

**Global Owner**

```text
Full management ✅
```

**Franchise Admin**

```text
Read own franchise     ✅
Update own franchise   ✅
Manage own branches    ✅
```

**Manager**

```text
Read assigned franchise context ✅
Franchise administration         ❌
```

### Branch

**Global Owner**

```text
Full management ✅
```

**Franchise Admin**

```text
Full within own franchise ✅
```

**Manager**

```text
Read assigned branches                   ✅
Operational branch settings where allowed
Create/archive other branches            ❌
```

Adversarial tests must verify cross-organization, cross-franchise, and cross-branch rejection.

---

# Part B — Context persistence and top navigation

## 10. Default context on login

Normal login must not redirect users to a context-selection page.

Bootstrap logic:

```text
Authenticate
↓
Load accessible memberships
↓
Restore previous valid Franchise if available
otherwise select first accessible Franchise
↓
Restore previous valid Branch if available
otherwise select first accessible Branch
↓
Open first authorized application route
```

Persist only non-sensitive identifiers such as:

```text
activeFranchiseId
activeBranchId
```

Do not persist access tokens, complete authorization state, or trust persisted IDs as security authority.

Every bootstrap must validate the stored Franchise/Branch against the current authenticated membership before restoring it.

## 11. Refresh behavior

Expected:

```text
KKS / Airport Branch selected
↓
Refresh
↓
KKS / Airport Branch remains selected
```

No modal.
No `/context` redirect.

If access changed:

```text
saved branch no longer accessible
→ select first valid branch
```

If the entire saved franchise is no longer accessible:

```text
→ select first accessible franchise
→ select first valid branch
```

Only users with genuinely incomplete business setup should be redirected to `/business` onboarding.

## 12. `All Branches`

Keep the current **All Branches** behavior for tenant-wide/multi-branch users.

Example:

```text
All Branches
Main Branch
Airport Branch
Sector 29
```

Branch-scoped users see only assigned branches.

`All Branches` must not appear when the active membership cannot operate tenant-wide.

Persist the All-Branches selection across refresh only when it is still authorized.

---

## 13. Unified Franchise and Branch selector UI

Franchise and Branch selectors must use one shared visual primitive, for example:

```text
ContextSwitcher
```

Both controls must use identical:

```text
height
border radius
border
background
padding
typography
icon sizing
chevron alignment
hover state
focus state
dropdown radius
dropdown spacing
shadow
```

Expected appearance:

```text
[ KKS Kitchen ▼ ]   [ Main Branch ▼ ]
```

There must be no inconsistent `rounded-lg` vs `rounded-xl` styling.

The dropdowns are **selection-only**. All create/edit operations belong in `/business`.

---

# Part C — User Profile

## 14. Top-right profile control

Add a user/avatar control in the top-right application navigation.

Example:

```text
[Kuldip KS ▼]
```

Dropdown:

```text
Profile
Logout
```

`Profile` routes to:

```text
/profile
```

There must be **no Profile entry in the side navigation**.

## 15. `/profile`

`/profile` is the logged-in user's personal account surface and supports Read/Update operations only.

### Profile fields

```text
First name
Last name
Display name
Email
Phone
Profile image
```

### Account actions

```text
Update profile
Change password
```

Password change should use a separate secure form:

```text
Current password
New password
Confirm password
```

Future optional profile preferences may include:

```text
Language
Timezone preference
Notification preference
```

If email editing is supported later, verification should be considered before changing the login identity.

## 16. Remove Profile from Settings

Move personal/profile/account editing out of Settings.

Settings should remain focused on business/application configuration, for example:

```text
Billing
Tax
Order settings
Approval thresholds
Notifications
Integrations
```

Profile belongs only at `/profile` and in the top-right user menu.

---

# Part D — Order creation and round operations

## 17. Order creation permissions

The following roles must be able to create orders in their authorized scope:

```text
OWNER
FRANCHISE_ADMIN
MANAGER
```

Required operational permissions:

```text
orders:create
orders:read
orders:update
orders:update_status
```

Branch and tenant scoping remain mandatory.

Manager must not gain unrelated destructive privileges merely because order operations are allowed.

---

## 18. Order Details round lifecycle

On:

```text
/orders/:orderId
```

Owner, Franchise Admin, and Manager must be able to progress each individual round through:

```text
FIRED
→ PREPARING
→ READY
→ SERVED
```

The existing pill/badge-style round action must be reused rather than introducing unrelated action buttons.

### FIRED

```text
Round 1                         [Start Preparing]
```

Click:

```text
status = PREPARING
```

Success changes the same control to:

```text
[Mark Ready]
```

### PREPARING

```text
Round 1                         [Mark Ready]
```

Click:

```text
status = READY
```

Success:

```text
[Mark Served]
```

### READY

```text
Round 1                         [Mark Served]
```

Click:

```text
status = SERVED
```

Success:

```text
[Served]
```

### SERVED

Status indicator only. No further action.

---

## 19. Round permission matrix

Target behavior:

| Role | Start Preparing | Mark Ready | Mark Served |
| --- | ---: | ---: | ---: |
| Owner | ✅ | ✅ | ✅ |
| Franchise Admin | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ |
| Chef | ✅ | ✅ | As current kitchen policy allows |
| Waiter | ❌ | ❌ | ✅ |
| Cashier | ❌ | ❌ | ❌ |
| Inventory Manager | ❌ | ❌ | ❌ |
| Receptionist | ❌ | ❌ | ❌ |

Waiter must retain the already-certified `READY → SERVED` behavior without gaining kitchen preparation permissions.

Chef/KDS retains the kitchen workflow.

Owner/Admin/Manager gain the full round progression from Order Details.

## 20. Transition authorization

Do not simply give broad `kitchen:update` to every management role if a narrower operational authorization can express the intent.

Target semantics:

```text
FIRED → PREPARING
    kitchen:update
    OR authorized management/order-operation capability

PREPARING → READY
    kitchen:update
    OR authorized management/order-operation capability

READY → SERVED
    kitchen:update
    OR orders:update_status
```

If the current permission catalog cannot express this cleanly, consider a dedicated permission such as:

```text
order_rounds:update_status
```

but avoid permission proliferation unless it materially improves authorization clarity.

## 21. Legal transitions

Backend must enforce the lifecycle:

```text
HELD → FIRED
FIRED → PREPARING
PREPARING → READY
READY → SERVED
```

Reject illegal direct transitions such as:

```text
FIRED → SERVED
PREPARING → SERVED
SERVED → PREPARING
```

unless Servora later adds an explicit corrective/manager override workflow.

## 22. Multiple rounds

Each round behaves independently.

Example:

```text
Round 1   SERVED
Round 2   PREPARING   [Mark Ready]
Round 3   HELD
```

The page must not collapse multiple kitchen rounds into one global ticket status.

## 23. Loading/error behavior

When a round action is clicked:

```text
Mark Ready
→ loading/disabled state
→ successful response
→ replace action with Mark Served
```

Requirements:

- Prevent duplicate clicks.
- Do not refresh the whole page.
- Do not close unrelated UI.
- Preserve previous state on API failure.
- Surface meaningful errors.

## 24. Realtime synchronization

Round-status changes must remain synchronized across apps.

Example:

```text
Chef/KDS marks READY
→ Web Order Details updates to [Mark Served]
→ Waiter receives READY state
```

And:

```text
Manager marks SERVED in Web
→ Waiter/KDS receive the update
```

No manual refresh should be required.

---

# Part E — Menu item cost and margin integrity

## 25. Add explicit item cost to the Menu item model

Servora currently derives item cost from recipe/inventory consumption. When an item has no recipe cost, the cost report falls back to `0`, which makes any positively-priced item appear to have a 100% gross margin.

Example:

```text
Selling price = ₹220
Resolved recipe cost = ₹0
Margin = ₹220
Margin % = 100%
```

That result is mathematically correct for a zero cost, but it is operationally misleading when the real issue is simply that no cost has been configured.

The Menu item model should therefore support an explicit **Cost** value for create and update.

Recommended data model:

```text
MenuItem
---------
basePrice / sellingPrice *
manualCost / itemCost
...
```

`Cost` should be nullable rather than defaulting to `0`. This lets Servora distinguish:

```text
Cost = null   → cost has not been configured
Cost = 0      → item genuinely has zero direct cost
Cost > 0      → explicit configured cost
```

This distinction is important for trustworthy analytics.

---

## 26. Cost must stay visible in the basic Item modal

`Cost` is not an advanced configuration field. It should be visible beside Price during both Add Item and Edit Item.

The default Item modal should therefore show:

```text
Name *
Description (optional)

Price *        Cost
Tax rate       Tax mode
Food type      Spice level
Status         Reason (optional)

Show advanced options
```

Recommended field labels:

```text
Selling price
Cost
```

or, if keeping the current shorter label:

```text
Price
Cost
```

The Cost field must not be hidden behind **Show advanced options**.

Validation:

```text
Price >= 0
Cost >= 0 when provided
Cost may be blank/null
```

Cost should be editable on both create and update. Clearing the field must persist `null`; it must not silently retain the previous value.

---

## 27. Define manual-cost versus recipe-cost precedence

Servora already calculates recipe cost from inventory ingredient quantities and `costPerUnit`. That capability should remain.

The application must explicitly define which cost is used for margin reporting. Recommended behavior:

```text
if a valid recipe cost exists:
    effective cost = recipe-derived cost
else if manual item cost is configured:
    effective cost = manual item cost
else:
    effective cost = unknown
```

This keeps recipe-backed costing authoritative where Servora has enough inventory data, while still supporting restaurants that have not configured recipes.

The API should ideally return both values where useful:

```text
manualCost
recipeCost
effectiveCost
costSource = RECIPE | MANUAL | UNKNOWN
```

That makes margin explainable instead of opaque.

A future UI may optionally allow an explicit override mode, but this workstream should not silently choose between conflicting configured values without exposing the source.

---

## 28. Margin analytics must not report unknown cost as 100% margin

The current fallback behavior effectively does:

```text
missing recipe cost → 0
```

which then produces 100% margin.

That must change. If neither recipe cost nor manual cost is configured:

```text
cost = unknown
margin = unknown
marginPercent = unknown
```

The UI should display something such as:

```text
Cost not configured
—
```

instead of:

```text
100% margin
```

Menu Engineering should either exclude unknown-cost items from margin quadrant calculations or clearly classify them as **Cost missing** until costing information exists. They should not influence median margin thresholds as if their margin were real.

---

## 29. Cost/margin tests

Add explicit coverage for:

```text
Item with manual cost and no recipe
→ uses manual cost

Item with recipe cost and no manual cost
→ uses recipe cost

Item with both recipe and manual cost
→ documented precedence is followed

Item with neither
→ margin is unknown, not 100%

Cost = 0 explicitly
→ 100% margin is valid and distinguishable from missing cost

Create item with cost
→ cost persists

Edit item cost
→ cost updates

Clear item cost
→ null persists

Variant cost behavior
→ explicitly defined/tested if variants need independent costing

Branch/tenant isolation
→ cost cannot be read or modified across scope
```

The cost/margin report, Menu Engineering report, item API contracts, and Item modal must all agree on the same semantics.

---

# Part F — Testing and certification

## 30. Business onboarding tests

Required flows:

```text
Signup
→ /business
→ Create Organization
→ Create Franchise
→ Create Branch
→ Dashboard
```

Partial onboarding:

```text
Organization exists
Franchise missing
→ resume at Franchise
```

```text
Organization + Franchise exist
Branch missing
→ resume at Branch
```

Existing complete business:

```text
login
→ restore valid context
→ no onboarding
```

## 31. Context persistence tests

Required:

```text
Select Franchise A / Branch 1
Refresh
→ same context
```

```text
Saved Branch removed from membership
Refresh
→ first accessible branch
```

```text
Saved Franchise removed
Refresh
→ first accessible franchise + branch
```

```text
All Branches selected
Refresh
→ All Branches restored when still authorized
```

## 32. Business authorization tests

Examples:

```text
Franchise Admin A
→ manage Franchise B under unrelated organization
→ denied
```

```text
Manager Branch A
→ archive Branch B
→ denied
```

```text
Branch-scoped custom role
→ manage unrelated branch
→ denied
```

## 33. Profile tests

Required:

```text
Top-right profile menu visible
/profile loads
profile read works
profile update works
password change works
Settings no longer contains Profile
Profile absent from side nav
```

Security:

```text
User A cannot update User B profile by ID
```

## 34. Order transition backend tests

Required:

```text
Owner
FIRED → PREPARING ✅
PREPARING → READY ✅
READY → SERVED ✅

Franchise Admin
same progression ✅

Manager
same progression ✅

Waiter
FIRED → PREPARING ❌
PREPARING → READY ❌
READY → SERVED ✅

Chef
FIRED → PREPARING ✅
PREPARING → READY ✅

Cashier
READY → SERVED ❌
```

Scope tests:

```text
Manager Branch A
→ update Branch B round
→ 403
```

```text
Franchise Admin Tenant A
→ update Tenant B round
→ 403
```

## 35. Order Details frontend tests

For Owner/Admin/Manager:

```text
FIRED       → Start Preparing visible
PREPARING   → Mark Ready visible
READY       → Mark Served visible
SERVED      → no action
```

Waiter:

```text
FIRED       → no prep action
PREPARING   → no ready action
READY       → Mark Served visible
```

Unauthorized roles:

```text
no round action
```

## 36. Realtime tests

Verify:

```text
KDS change → Web updates
KDS change → Waiter updates
Web change → KDS updates
Web change → Waiter updates
```

Also verify reconnect behavior and duplicate/stale event handling.

---

# Part G — Implementation order

Implement sequentially in this order:

```text
1. Menu item cost model + margin semantics
2. Business domain fields + validators
3. /business CRUD and hierarchy UI
4. Signup onboarding → /business
5. Persisted/default Franchise + Branch context
6. Remove /context from normal UX
7. Shared Franchise/Branch selector styling
8. Top-right Profile menu + /profile
9. Remove Profile from Settings
10. Owner/Admin/Manager order permissions
11. Order Details round progression UI
12. Realtime synchronization
13. Cost/margin + Business/Profile/Order adversarial tests
14. Full repository certification
```

---

# Acceptance criteria

This workstream is complete only when all of the following are true:

```text
✓ Menu item create/edit exposes Cost beside Price
✓ Cost is visible without opening Advanced options
✓ Cost is nullable and can be cleared
✓ recipe-derived and manual cost precedence is explicit
✓ missing cost never appears as a fake 100% margin
✓ analytics identifies RECIPE / MANUAL / UNKNOWN cost source
✓ Menu Engineering handles unknown-cost items safely
✓ /business exists in side nav for authorized users
✓ Organization stores meaningful required business information
✓ Franchise stores meaningful restaurant/brand configuration
✓ Branch stores meaningful operational configuration
✓ Fresh signup redirects to /business
✓ Organization → Franchise → Branch onboarding is guided and resumable
✓ Existing users are not forced through onboarding
✓ /context is removed from the normal UX
✓ refresh restores valid Franchise/Branch context
✓ first accessible Franchise + first accessible Branch are safe defaults
✓ All Branches remains available where authorized
✓ Franchise and Branch selectors use identical visual treatment
✓ selector dropdowns contain no create actions
✓ top-right Profile control routes to /profile
✓ Profile does not appear in side navigation
✓ Profile is removed from Settings
✓ /profile supports read/update and password change
✓ Owner can create orders
✓ Franchise Admin can create orders
✓ Manager can create orders
✓ Owner can FIRED → PREPARING → READY → SERVED
✓ Franchise Admin can FIRED → PREPARING → READY → SERVED
✓ Manager can FIRED → PREPARING → READY → SERVED
✓ Waiter remains SERVED-only for kitchen rounds
✓ Chef/KDS preparation workflow remains intact
✓ round actions use the existing badge/pill visual language
✓ realtime updates round action state across apps
✓ tenant/branch permission boundaries remain enforced
✓ RBAC/adversarial tests cover every new capability
✓ full typecheck, lint, tests, builds, migration integrity and permission audits are green
```
