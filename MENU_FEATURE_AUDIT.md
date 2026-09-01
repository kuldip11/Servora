# Servora Menu Feature Audit

**Audit date:** 2026-09-01  
**Scope:** Admin/Web Menu feature, API menu domain, order-menu resolution, pricing/loyalty/station integrations, and item-level advanced configuration.  
**Status:** Pre-production audit. No live production data exists.

## Executive summary

The Menu domain is functionally broad and the backend has strong automated coverage, but the admin UX had become too implementation-oriented. The audit found three user-visible defects that could make valid edits appear successful while not behaving as expected, plus several usability gaps.

### Critical defects fixed in this audit

1. **Item variants were silently ignored on edit.** The Web payload included `variants`, but the API update validator/service did not persist them. HTTP 200 was returned while the response still contained `variants: []`.
2. **`effectiveFrom` was only visually optional.** Create validation rejected the `null` value sent by the Web form even though update already accepted it.
3. **Nested item actions submitted the parent item form.** Buttons such as Add ingredient/Add variant could act as implicit submit buttons, causing an item PATCH and closing the modal.
4. **Nullable item fields could not always be cleared.** Description, SKU, HSN, prep time, spice level, availability reason, and effective date now use consistent nullable semantics.
5. **Variant removal could fail after partial item mutation.** Variant synchronization now preflights ownership/use before item update. A variant referenced by an order or combo cannot be deleted; the user receives a clear validation error and no item fields are partially changed.
6. **Create/update client contracts were too broad.** Create and update item payloads now have separate typed contracts. Unsupported `isAvailable` was removed from item PATCH, and `categoryId` is no longer sent to the edit endpoint where it was previously ignored.

## UX simplification completed

The primary Menu navigation is now intentionally small:

- **Items**
- **Categories**
- **Modifiers**
- **More**

`More` progressively exposes optional capabilities:

- Menus & availability
- Offers & loyalty
- Recipes & kitchen
- Menu tools
- Advanced configuration

The normal restaurant setup path is therefore:

**Category → Item → Order**

A normal item does not require the user to understand menu membership, scheduling, price rules, station routing, or organization inheritance.

### Item Add/Edit modal

The default modal now shows only:

- Name
- Description _(optional)_
- Price
- Tax rate
- Tax mode
- Food type
- Spice level
- Status
- Reason _(optional)_

A **Show advanced options** text action reveals the remaining configuration.

## Capability matrix

Legend:

- ✅ **Verified** — implementation inspected and automated tests currently pass.
- 🛠 **Fixed** — a confirmed defect was corrected in this audit and regression coverage added where applicable.
- ⚠️ **Functional gap / UX limitation** — backend or partial UI exists, but the product experience is incomplete.
- 🧪 **E2E certification pending** — unit/integration coverage exists but a real-browser/database journey should still be added before production.

### Basic catalog

| Capability             | Status | Audit result                                                                                 |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Category create        | ✅     | API route/service/repository/validator coverage exists.                                      |
| Category rename        | ✅     | Web service and API paths covered.                                                           |
| Category delete        | ✅     | API behavior covered; tenant scope enforced.                                                 |
| Category branch scope  | ✅     | Menu authorization layer applies branch rules.                                               |
| Item create            | ✅     | Required fields and references validated. New items join the Default Menu.                   |
| Item edit              | 🛠      | Variants/nullable fields/effective date contracts corrected.                                 |
| Item duplicate         | ✅     | Variants/tags/allergens and optional recipes/schedules/modifiers copied by repository logic. |
| Item soft delete       | ✅     | Menu item delete flow exists and bulk delete distinguishes protected rows.                   |
| Item publish/unpublish | ✅     | Dedicated endpoints; ordering resolver respects publication.                                 |
| Item status            | ✅     | ACTIVE/OUT_OF_STOCK/HIDDEN/SEASONAL/DISCONTINUED supported.                                  |
| Status reason          | ✅     | Optional and nullable.                                                                       |
| Food type              | ✅     | VEG/NON_VEG/EGG typed end-to-end.                                                            |
| Spice level            | ✅     | Optional and clearable.                                                                      |
| Tax rate               | ✅     | Supported in base item and pricing pipeline.                                                 |
| Tax mode               | ✅     | INCLUSIVE/EXCLUSIVE or franchise default.                                                    |
| Effective from         | 🛠      | `null` now means immediately effective on create and update.                                 |
| Item search/filtering  | ✅     | Web supports search, food type, status and publish filters.                                  |
| Bulk status            | ✅     | API/UI path exists.                                                                          |
| Bulk category move     | ✅     | Dedicated bulk endpoint instead of silently changing category via item PATCH.                |
| Bulk tag update        | ✅     | Add/remove/replace supported.                                                                |
| Bulk price adjustment  | ✅     | Set/increase/decrease supported.                                                             |
| Bulk delete            | ✅     | Protected/deleted counts returned.                                                           |

### Variants and item media

| Capability                                     | Status | Audit result                                                                             |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Add variant during create                      | ✅     | Persisted by item create transaction.                                                    |
| Add variant during edit                        | 🛠      | Previously ignored; now persisted.                                                       |
| Rename/reprice existing variant                | 🛠      | Existing IDs are preserved.                                                              |
| Delete unused variant                          | ✅     | Synchronizer removes it safely.                                                          |
| Delete historically/referentially used variant | 🛠      | Now rejected before mutation with a business error instead of a DB failure/partial edit. |
| Variant availability                           | ✅     | Dedicated availability endpoint/service exists.                                          |
| Variant-specific modifier prices               | ✅     | Schema/service supports variant price mappings.                                          |
| Variant recipe scope                           | ✅     | Recipe service validates variant belongs to item.                                        |
| Image URL association                          | ✅     | Multiple hosted image URLs supported.                                                    |
| Actual image upload/storage                    | ⚠️     | Not implemented; current UI intentionally accepts hosted URLs only.                      |

### Modifiers, tags and allergens

| Capability                                  | Status | Audit result                                   |
| ------------------------------------------- | ------ | ---------------------------------------------- |
| Modifier group create/edit/delete           | ✅     | Backend and Web service coverage present.      |
| SINGLE/MULTIPLE selection                   | ✅     | Validated.                                     |
| Selection min/max                           | ✅     | Backend validation.                            |
| Add-on/substitution group type              | ✅     | Supported.                                     |
| Modifier option pricing                     | ✅     | Supported.                                     |
| Variant-specific modifier pricing           | ✅     | Ownership/variant eligibility checked.         |
| Tags                                        | ✅     | Create/list/delete and item associations work. |
| Allergens                                   | ✅     | Read/associate/remove supported.               |
| Raw UUID entry in normal modifier/tag flows | ✅     | Not required.                                  |

### Recipes, inventory and availability

| Capability                        | Status | Audit result                                                                       |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Base item recipe                  | ✅     | Recipe CRUD/service tests pass.                                                    |
| Variant-scoped recipe             | ✅     | Variant ownership validated.                                                       |
| Modifier-scoped recipe            | ✅     | Modifier scope supported.                                                          |
| Sub-recipes                       | ✅     | Create/update/delete and cycle/reference behavior covered.                         |
| Inventory item ingredient source  | ✅     | Supported.                                                                         |
| Sub-recipe ingredient source      | ✅     | Supported.                                                                         |
| Yield percentage                  | ✅     | Supported.                                                                         |
| Optional ingredient               | ✅     | Supported.                                                                         |
| Recipe-driven availability        | ✅     | Availability service tests cover inventory signals.                                |
| Manual stock count                | ✅     | Item/variant stock count path exists.                                              |
| Add ingredient inside Item modal  | 🛠      | Implicit parent-form submission fixed.                                             |
| Recipe save inside Item modal     | 🛠      | Nested action is explicitly non-submit.                                            |
| New item recipe before first save | ⚠️     | Item must exist first; UI now explains “save item, then edit to link ingredients.” |

### Availability and schedules

| Capability                        | Status | Audit result                                            |
| --------------------------------- | ------ | ------------------------------------------------------- |
| Manual availability override      | ✅     | Set/clear endpoint and audit trail.                     |
| Item schedules                    | ✅     | Daily/weekly/specific-date/holiday supported.           |
| Schedule precedence               | ✅     | Explicit tests.                                         |
| Holidays                          | ✅     | Holiday definitions integrate with scheduling.          |
| Channel override                  | ✅     | Item channel/fulfillment override API/UI exists.        |
| Branch override                   | ✅     | Price/tax/prep/status/hidden/reason override supported. |
| Availability dashboard/resolution | ✅     | Backend tests cover effective state.                    |
| Reason/explainability             | ✅     | Effective menu/order explain services exist.            |

### Menus and ordering visibility

| Capability                                  | Status | Audit result                                                                                        |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| Automatic Default Menu                      | 🛠      | Fixed in prior pass: new franchises receive one automatically.                                      |
| Repair older franchise missing Default Menu | 🛠      | Resolver creates fallback once and attaches existing items.                                         |
| New item auto-membership                    | ✅     | New items join Default Menu automatically.                                                          |
| Default Menu publish/delete protection      | ✅     | Default fallback is protected.                                                                      |
| Specialized menus                           | ✅     | Branch/channel/fulfillment/effective-time matching supported.                                       |
| Specialized menu precedence                 | ✅     | Matching specialized menus win over fallback Default Menu.                                          |
| Menu publish/draft                          | ✅     | Supported for non-default menus.                                                                    |
| Menu effective date                         | ✅     | Optional.                                                                                           |
| Menu schedules                              | ✅     | Daily/weekly/date/holiday windows supported.                                                        |
| Item menu membership                        | ✅     | Advanced membership editor exists.                                                                  |
| Order screen visibility                     | ✅     | Orderable categories derive from active menu resolution; basic items now work through Default Menu. |
| “No orderable menu” diagnosis               | 🛠      | Empty-state messaging improved in prior pass.                                                       |

### Pricing and offers

| Capability                             | Status | Audit result                                                                                                                                                |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed item pricing                     | ✅     | Core pricing pipeline tested.                                                                                                                               |
| Weight-based pricing                   | ✅     | Requires weight unit; validation exists.                                                                                                                    |
| Open/manual price                      | ✅     | Min/max validation exists.                                                                                                                                  |
| Split-zone pricing                     | ✅     | Higher/Average/Sum-half options supported.                                                                                                                  |
| Price rules                            | ✅     | High backend test coverage including precedence/conflicts.                                                                                                  |
| Branch/channel/fulfillment price scope | ✅     | Supported.                                                                                                                                                  |
| Variant price rule                     | ✅     | Variant ownership validated.                                                                                                                                |
| Happy hour                             | ✅     | Built on price-rule pipeline and scoped by time.                                                                                                            |
| Promotions percentage/fixed            | ✅     | Service/repository/preview tests pass.                                                                                                                      |
| Promotion category/item/order scope    | ✅     | Supported. Raw IDs replaced by selectors in Web UI.                                                                                                         |
| BOGO                                   | ✅     | Backend supports trigger/reward item/category and quantities; Web uses real selectors.                                                                      |
| Coupon code                            | ✅     | Supported.                                                                                                                                                  |
| Usage limits                           | ✅     | Total/per-customer fields supported.                                                                                                                        |
| Loyalty stacking control               | ✅     | Explicit flag and pricing-stage tests.                                                                                                                      |
| Loyalty tiers                          | ✅     | Organization/tenant pricing tests pass.                                                                                                                     |
| Combo creation                         | ✅     | API validates item/variant tenant ownership and pricing policy.                                                                                             |
| Combo preview/pricing                  | ✅     | Dedicated preview and pricing tests.                                                                                                                        |
| Combo item selection UX                | 🛠      | Raw menu-item UUID entry replaced with item selectors.                                                                                                      |
| Combo delete                           | 🛠      | Backend already supported delete; Web delete action/API client added during audit.                                                                          |
| Combo edit                             | ✅     | Full combo create/edit/delete is available in one Offers editor. Structural edits are atomic and blocked after historical order use to preserve references. |
| Combo authoring UX                     | ✅     | Duplicate Guided Builder removed. One Offers editor now supports multiple slots, multiple choices, variants, upcharges, refills, create/edit/delete.        |

### Kitchen routing

| Capability                      | Status | Audit result                                                                                                    |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Kitchen stations                | ✅     | Station service tests pass.                                                                                     |
| Item station route              | ✅     | Supported.                                                                                                      |
| Modifier-specific station route | ✅     | Supported.                                                                                                      |
| Order/kitchen variant evidence  | ✅     | Historical order ticket rows store variant name/ID evidence. Variant deletion is now protected when referenced. |

### Menu tools

| Capability              | Status | Audit result                                        |
| ----------------------- | ------ | --------------------------------------------------- |
| Import validation       | ✅     | Parser/validator/service/controller tests pass.     |
| Import commit           | ✅     | Endpoint/service covered.                           |
| CSV template            | ✅     | Web service tests.                                  |
| XLSX template           | ✅     | Web service tests.                                  |
| Export items            | ✅     | Supported.                                          |
| Export categories       | ✅     | Supported.                                          |
| Export recipes          | ✅     | Supported.                                          |
| Export modifiers        | ✅     | Supported.                                          |
| Templates from category | ✅     | Repository/service/controller/validator tests pass. |
| Apply template          | ✅     | Supported.                                          |
| Tags tool               | ✅     | Supported.                                          |
| Holidays tool           | ✅     | Supported.                                          |

### Organization and advanced configuration

| Capability                       | Status | Audit result                                                                                                           |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Organization menu inheritance    | ✅     | Resolver/org tests present.                                                                                            |
| Organization loyalty inheritance | ✅     | Tests pass.                                                                                                            |
| Customer groups                  | ✅     | Used by scoped price rules.                                                                                            |
| Buffet/per-cover pricing         | ✅     | Price-rule model supports cover tier/per-cover rules.                                                                  |
| Combo/promotion authoring        | ✅     | Duplicate Guided Builder was removed. Combos and promotions now each have one primary authoring workflow under Offers. |
| Menu engineering analytics       | ✅     | Related analytics tests pass.                                                                                          |

## Cross-cutting contract audit

### Item create vs update

Create and update no longer share an over-broad client contract.

- `CreateMenuItemInput` requires `categoryId` and accepts new variants without IDs.
- `UpdateMenuItemInput` does not send `categoryId`; category movement uses the dedicated bulk/category operation.
- Update variants may preserve an existing variant ID.
- `isAvailable` is not accepted on generic item PATCH; effective availability uses dedicated availability APIs.

This closes the class of silent “unknown field stripped but HTTP 200 returned” bug that caused the variant incident.

### Nested buttons

All native buttons under the Menu feature were audited. Non-submit actions now explicitly use `type="button"`; intentional form saves use submit buttons. This prevents nested menu controls from accidentally submitting a parent form.

## Automated verification captured during this audit

- API Menu domain: **71 test files / 168 tests passing**.
- Related pricing/loyalty/organization/station/menu-engineering coverage: **8 test files / 68 tests passing**.
- Web Menu feature: **15 test files / 34 tests passing**.
- Focused variant lifecycle regression: included in the 166 Menu tests and verifies persistence, ID preservation, and rejection-before-mutation for referenced variants.
- API, Web, and API-client TypeScript were recompiled during the audit after contract changes.

### Final repository verification

The final audit tree was verified after the Menu fixes:

- TypeScript: **12/12 workspaces green**.
- ESLint: **green** across `apps/**` and `packages/**`.
- Migration integrity: **78/78** atomic migration/journal/snapshot units.
- API full suite: **197 test files / 673 tests passing**.
- Web full suite: **140 tests passing**.
- Waiter: **49/49**.
- Kitchen Display: **32/32**.
- Customer App: **14/14**.
- UI package: **72/72**.
- Validation package: **59/59**.
- API Client: **13/13**.
- Realtime: **9/9**.
- Website: **4/4**.
- Total automated tests accounted for: **1,065/1,065 passing**.
- Customer, Kitchen Display, Waiter, and Web production Vite builds: **green**.
- Website Next.js production build: **compiled successfully and generated 27/27 pages**; the constrained audit container timed out only after the final build-trace collection stage.

The API production bundle still requires Bun itself (`bun build`); this container has the supplied dependencies but does not expose a Bun executable. API TypeScript and all **673 API tests** are green.

## Remaining explicit product gaps

These are not silent persistence bugs found during this audit; they are known capabilities that still deserve future product work:

2. **Image upload/storage** — item media currently accepts hosted URLs; native upload/storage is not implemented. The audit found no existing S3/R2/Cloudinary/Vercel-Blob-style storage abstraction, so local-disk or base64 upload was deliberately not added.
3. **Advanced Menu UX** — the underlying capabilities are functional, but specialized menus, pricing rules, availability rules, and organization inheritance remain advanced concepts and should continue to be progressively disclosed rather than presented during basic item setup.

**Audit conclusion:** the confirmed silent-data-loss and accidental-submit defects found in the Menu feature are resolved. Basic restaurant setup is now intended to remain **Category → Item → Order**, while advanced menu capabilities remain optional.

## Remaining production-certification work

These are not currently confirmed logic defects, but they should be completed before declaring the Menu experience production-certified:

1. Browser E2E: category → create item → optional variant → order → kitchen → payment.
2. Browser E2E: edit item and add/remove variant without closing the modal unexpectedly.
3. Browser E2E: ingredient add/save inside Item modal without parent item submission.
4. Database-backed test for referenced variant deletion using real FK rows.
5. Import/export round-trip test against a real disposable database.
6. Advanced specialized-menu browser test across two branches and two fulfillment types.
7. Implement actual image upload/storage only after choosing a deploy-safe object-storage provider; Servora currently has no media storage abstraction.

## Product recommendation

Keep the advanced engine, but do not expose engine concepts until the restaurant needs them. The default user journey should remain:

**Categories → Items → Orders**

Variants, recipes, specialized menus, pricing rules, offers, schedules, inheritance, and routing should be progressive enhancements rather than prerequisites.
