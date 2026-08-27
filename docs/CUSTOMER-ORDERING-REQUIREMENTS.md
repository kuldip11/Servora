# Servora Customer Ordering — Product & Implementation Requirements

**Status:** Proposed implementation specification  
**Scope:** Customer QR ordering, dine-in tabs, order status, payment timing, takeaway, public ordering QR, and customer UI theme.  
**Primary apps:** `apps/customer-app`, `apps/web`, `apps/waiter-app`, `apps/kitchen-display`, `apps/api`  
**Audience:** Engineering agents, developers, QA, and product reviewers.

---

## 1. Purpose

This document defines the required customer-ordering behavior for Servora. It is intentionally implementation-oriented so another engineering agent can use it as the source of truth without needing to infer the intended workflow from the existing UI.

The central design decision is:

> A customer sitting at a table has one active dining **tab/order** for the sitting. Every additional round is added to that same order and creates a new kitchen ticket/round. The customer pays once when the meal is finished.

A public/non-table QR creates a **TAKEAWAY** ordering session. Takeaway orders are paid before they are accepted for preparation.

A customer already sitting at a table may also add takeaway items to the same active table order. Those items are fulfilled as takeaway but remain on the same final bill.

---

## 2. Current Problems

The current customer flow has several major product and architecture problems:

1. The customer app does not expose a theme selector.
2. There is no permanent customer-facing order-status experience.
3. A table can remain `AVAILABLE` after a customer order exists, while staff ordering correctly rejects another order because an active order already exists.
4. Every customer order submission currently creates a new order instead of adding a new round to the existing active order.
5. Customer QR dine-in ordering currently invokes checkout/payment after each order submission. This is incorrect for table ordering: payment should happen once at the end.
6. There is no customer-facing takeaway flow.
7. The web app needs a public takeaway QR that is not associated with a restaurant table.
8. A customer already dining at a table needs the ability to add takeaway items and settle them together with dine-in consumption on one bill.

The existing backend already supports `DINE_IN` and `TAKEAWAY` order types and has an order-service concept for firing a new ticket on an existing order. The implementation should build on those concepts rather than introducing a second parallel order model.

---

# 3. Core Domain Model

## 3.1 Customer session

A customer session represents the customer's current interaction with a restaurant.

For a table QR:

```text
Customer Session
  branchId
  tableId = table
  sessionToken
  activeOrderId
```

For a public takeaway QR:

```text
Customer Session
  branchId
  tableId = null
  sessionToken
  activeOrderId
```

The session must be recoverable after a page refresh while the session is still valid.

## 3.2 Active customer tab/order

For dine-in QR ordering, the active order is the customer's tab for the sitting.

```text
Order #101
  type = DINE_IN
  tableId = T5
  customerSessionId = S1

  Round/Ticket 1
  Round/Ticket 2
  Round/Ticket 3
```

The customer must not receive a new order ID every time they tap **Order More**.

## 3.3 Rounds / kitchen tickets

Every submission after the initial order is a new kitchen round/ticket attached to the same order.

Example:

```text
Order #101
├── Ticket #1 — initial order
├── Ticket #2 — order more
└── Ticket #3 — order more
```

The order total is the aggregate of all active items/rounds.

The kitchen must be able to process each ticket independently while staff and customer billing continue to reference the same parent order.

## 3.4 Fulfillment mode

An order item needs a fulfillment intent when mixed dine-in/takeaway ordering is supported:

```text
DINE_IN
TAKEAWAY
```

This is different from the order's overall type.

For example:

```text
Order #101
Order type: DINE_IN
Table: T5

Items:
  Butter Chicken  -> DINE_IN
  Naan            -> DINE_IN
  Biryani         -> TAKEAWAY
  Samosa          -> TAKEAWAY
```

This allows one bill and one payment while allowing the kitchen to distinguish dine-in and takeaway fulfillment.

---

# 4. Requirement: Customer Theme

## 4.1 Goal

The customer app must provide a theme selector rather than forcing one appearance.

## 4.2 Required themes

Reuse the existing Servora theme infrastructure where possible. Do not create a second theme implementation just for the customer app.

At minimum expose:

- Light
- Dark
- High Contrast, if supported by the shared theme system

## 4.3 UI

Provide a compact theme action in the customer header or More menu.

Example:

```text
Restaurant Name                    Theme
Table T5
```

Selecting Theme opens:

```text
Theme

○ Light
○ Dark
○ High Contrast
```

## 4.4 Persistence

Persist the customer's theme choice locally so a refresh does not reset it.

## 4.5 Acceptance criteria

- Theme selector is reachable from every major customer screen.
- Switching theme updates the customer app immediately.
- Refresh preserves the selected theme.
- Theme controls remain usable on mobile.
- Existing shared theme tokens/components are reused where possible.

---

# 5. Requirement: Customer Order Status

## 5.1 Goal

Customers must always be able to see the state of their active order without relying on the post-order confirmation screen.

## 5.2 Navigation

Provide a persistent **Order** destination in the customer UI.

Recommended navigation:

```text
[ Menu ]    [ Order ]    [ More ]
```

## 5.3 Order screen

The order screen should show:

- Restaurant
- Table number/name for dine-in
- Order number
- Current order status
- Kitchen ticket/round statuses
- Ordered items
- Quantities
- Item/round fulfillment mode where relevant
- Current subtotal
- Tax
- Total
- Payment state
- Bill state
- Request Bill action when applicable
- Estimated preparation time if available

Example:

```text
Your order

Order #101
Table T5

₹1,240

Order status
✓ Order received
✓ Preparing
○ Ready
○ Served

Rounds

Round 1     ✓ Served
Round 2     ✓ Served
Round 3     🔥 Preparing

Items
Butter Chicken      ₹220
Naan                 ₹60
Biryani             ₹180

Payment
Pay when you're done

[ Order More ]
[ Request Bill ]
```

## 5.4 Realtime behavior

The customer order screen must update from the existing realtime infrastructure where available.

It should respond to at least:

- Order created/updated
- Kitchen ticket created/updated
- Customer request acknowledged/resolved
- Bill/payment state changes

Polling may remain as a fallback, but realtime should be the primary update mechanism when connected.

## 5.5 No active order state

If the customer has not placed anything yet:

```text
No active order

Add items from the menu to start your order.

[ Browse Menu ]
```

## 5.6 Acceptance criteria

- Customer can reach order status after leaving checkout.
- Status survives navigation and refresh when the session/order is recoverable.
- Multiple rounds appear under one order.
- Status changes are reflected without requiring a full page reload.
- Payment status is clearly separated from kitchen/order status.

---

# 6. Requirement: Table Lifecycle Must Match Active Orders

## 6.1 Problem

A table can currently appear `AVAILABLE` even though a customer-created dine-in order exists and staff cannot create another order because the table already has an active order.

This is contradictory and must be fixed at the service/domain level, not merely hidden in the UI.

## 6.2 Required lifecycle

For a dine-in table:

```text
AVAILABLE
   │
   │ first active dine-in order
   ▼
OCCUPIED
   │
   │ order more
   ▼
OCCUPIED
   │
   │ order more
   ▼
OCCUPIED
   │
   │ bill/payment closes final active order
   ▼
AVAILABLE
```

## 6.3 Rules

### First dine-in order

When the first active dine-in order is successfully created for a table:

- Set table status to `OCCUPIED`.
- Publish the existing table update realtime event.
- Ensure waiter/web applications receive the update.

### Additional round

Adding another round to an existing order:

- Must not create a second active order.
- Must not change table status away from `OCCUPIED`.
- Must not run the first-order occupancy transition again.

### Final settlement

When the final active order is successfully settled/closed:

- Table becomes `AVAILABLE`.
- Publish the table update event.
- Do not make the table available merely because a customer requested the bill; it remains occupied until the business's final order/payment lifecycle says it is closed.

## 6.4 Concurrency requirement

The database/service logic must prevent two independent dine-in orders from being created for the same table at the same time.

The following must be consistent:

- `hasOpenOrders()`
- table status
- order creation
- table occupancy update

The preferred implementation should use transactional/constraint-level protection where appropriate rather than relying solely on sequential application checks.

## 6.5 Acceptance criteria

- After first customer order, web/waiter shows table as occupied.
- Staff cannot create another independent active order for that table.
- Customer Order More does not trigger a table-occupied error.
- Table becomes available only after the final active order is closed according to business rules.
- Realtime table state updates are emitted.

---

# 7. Requirement: Order More Must Reuse the Existing Order

## 7.1 Goal

The customer must have one tab/order for the sitting and add additional rounds to it.

Incorrect:

```text
First order  -> Order #101
Order More   -> Order #102
Order More   -> Order #103
```

Correct:

```text
Order #101
  ├── Round 1
  ├── Round 2
  └── Round 3
```

## 7.2 Initial order

When the customer submits their first cart:

- Create the active dine-in order.
- Associate it with the customer session and table.
- Create/fire the first kitchen ticket.
- Mark the table occupied.
- Do not create a payment just because the round was submitted.

## 7.3 Order More

When an active order exists and the customer chooses **Order More**:

- Reuse the existing `activeOrderId`.
- Validate the new items against current availability/pricing/tax rules.
- Add the items as a new ticket/round.
- Recalculate order totals.
- Deduct inventory for the new items.
- Publish order updated and kitchen ticket created events.
- Keep the order open.
- Keep the table occupied.
- Do not create a new parent order.
- Do not create a payment.

The existing order-service/repository `fireNewTicket()` capability should be reused where it fits.

## 7.4 Order state restriction

Order More is allowed only while the parent order is open and accepting new rounds.

Once the order has entered a final/non-orderable state such as closed/cancelled, the customer must not be able to add another round.

If bill request locks ordering, the UI and API must both enforce it.

## 7.5 Acceptance criteria

- Repeated Order More actions keep the same order ID.
- Each submission creates a distinct kitchen ticket/round.
- Customer sees one cumulative order.
- Staff sees one order with multiple tickets/rounds.
- Totals accumulate correctly.
- A new independent order is never created for a normal Order More action.

---

# 8. Requirement: Dine-In Payment Happens Once at the End

## 8.1 Current incorrect behavior

The customer QR flow currently calls checkout/payment as part of placing an order. This creates a pending payment after each submitted round.

This is not acceptable for table dining.

## 8.2 Required behavior

For table QR dine-in:

```text
Scan table QR
   ↓
Browse menu
   ↓
Place round 1
   ↓
Kitchen
   ↓
Order More
   ↓
Kitchen
   ↓
Order More
   ↓
Kitchen
   ↓
Request Bill
   ↓
Final bill
   ↓
Pay once
   ↓
Order closes
   ↓
Table becomes available
```

## 8.3 Place Order semantics

The **Place Order** action means:

> Send this round to the restaurant/kitchen.

It does **not** mean:

> Start payment.

Therefore:

- No payment row should be created merely by placing a dine-in round.
- No checkout endpoint should be invoked by the normal dine-in Place Order action.
- The order remains open.

## 8.4 Request Bill semantics

Provide a clear **Request Bill** action.

This means:

> I am finished ordering. Prepare my final bill.

The order should transition to the appropriate bill-requested state supported by the existing order lifecycle.

After bill request, the customer should normally no longer be able to add additional rounds unless the business explicitly supports reopening the tab.

## 8.5 Payment semantics

Payment should be initiated only when the customer is settling the final bill.

The system must prevent:

- duplicate payment rows from repeated taps
- payment for an outdated order total
- payment of a round before it is part of the final bill

Existing payment idempotency/locking behavior should be retained or improved.

## 8.6 Acceptance criteria

- Placing round 1 creates no payment.
- Placing round 2 creates no payment.
- Placing round 3 creates no payment.
- Customer sees cumulative unpaid balance.
- Request Bill produces the final bill workflow.
- One final payment settles the entire tab.
- After successful settlement, the order closes and the table can become available.

---

# 9. Requirement: Takeaway Ordering

There are two different takeaway scenarios and they must not be confused.

1. Public takeaway ordering from a non-table QR.
2. Takeaway items added by a customer who is already dining at a table.

---

# 10. Public Takeaway QR

## 10.1 Goal

The web app must allow restaurant staff to generate a customer-ordering QR that is **not tied to a table**.

Customers scan it from outside/inside the restaurant, browse the menu, add items, and pay for a takeaway order.

## 10.2 QR types

The system should distinguish at least:

```text
TABLE QR
  branchId = B1
  tableId = T5
  mode = DINE_IN

PUBLIC TAKEAWAY QR
  branchId = B1
  tableId = null
  mode = TAKEAWAY
```

Do not create a fake table for public takeaway QR codes.

## 10.3 Web app UI

Provide a customer-ordering/QR management area in the web app.

Example:

```text
Customer Ordering

Table QR Codes
  Table 1   [View QR] [Print]
  Table 2   [View QR] [Print]
  Table 3   [View QR] [Print]

Public Takeaway QR

  [ QR CODE ]

  Customers can scan this QR to place a takeaway order.

  [Print QR]
  [Regenerate QR]
```

The exact placement can follow existing web QR/table management patterns.

## 10.4 Customer flow

```text
Scan Public Takeaway QR
        ↓
Start takeaway session
        ↓
Browse menu
        ↓
Add items
        ↓
Review cart
        ↓
Enter required customer/pickup information
        ↓
Pay
        ↓
Payment verified
        ↓
Takeaway order accepted
        ↓
Kitchen ticket
        ↓
Pickup/status screen
```

## 10.5 Order data

A public takeaway order must have:

- `type = TAKEAWAY`
- `tableId = null`
- branch association
- customer session association
- order items
- customer/pickup details as required by product configuration
- verified payment state before the order is considered paid/accepted

## 10.6 Payment

Public takeaway orders require online payment before final acceptance into the paid order workflow.

Do not fake successful payment based only on client-side state.

The final implementation must use the configured payment provider's server-side verification/webhook flow.

The current code's cash-pending checkout behavior is not sufficient for this requirement.

## 10.7 Acceptance criteria

- Web app can generate a non-table takeaway QR.
- QR does not reference a restaurant table.
- Customer scanning it enters takeaway mode.
- Customer can add menu items.
- Customer can pay online.
- Server verifies payment.
- Paid takeaway order reaches kitchen.
- Customer can track takeaway order status.
- Staff can identify the order as takeaway.

---

# 11. Mixed Dine-In + Takeaway on One Bill

## 11.1 Goal

A customer already eating at a table can order additional food to take away and pay for both the food eaten at the table and the takeaway items in one final bill.

Example:

```text
Table T5

DINE-IN
  Butter Chicken   ₹220
  Naan              ₹60
  Coke              ₹40

TAKEAWAY
  Biryani          ₹180
  Samosa × 2       ₹100

ONE BILL
Subtotal           ₹600
Tax                ...
Total              ...

ONE FINAL PAYMENT
```

## 11.2 Recommended model

Do not create a second order and merge bills later.

Keep one active table order:

```text
Order #101
  type = DINE_IN
  tableId = T5

  Items
    item A -> DINE_IN
    item B -> DINE_IN
    item C -> TAKEAWAY
    item D -> TAKEAWAY
```

Add item-level fulfillment mode to the order-item domain if the existing schema does not already provide an equivalent field.

## 11.3 Customer UI

When adding an item from an active table session, customer should be able to choose:

```text
Add to table
Add as takeaway
```

The exact UI can be a compact selector rather than two large buttons.

The default should remain `DINE_IN` for a normal table customer.

## 11.4 Cart

Cart should group items clearly:

```text
For here
  Butter Chicken ×1
  Naan ×2

Takeaway
  Biryani ×1
  Samosa ×2
```

Changing fulfillment mode should not duplicate the item silently. The user must understand which quantity is assigned to which fulfillment mode.

## 11.5 Kitchen

Kitchen ticket/order views must distinguish fulfillment:

```text
TABLE T5

DINE-IN
  Butter Chicken
  Naan

TAKEAWAY
  Biryani
  Samosa
```

This is important operationally because takeaway packaging and table service have different fulfillment expectations.

## 11.6 Billing

All items on the active table order contribute to the same final bill.

There must be:

- one order
- one bill
- one final payment

unless a future explicit split-bill feature is introduced.

## 11.7 Acceptance criteria

- Existing table customer can add takeaway items.
- Takeaway items are visually identifiable in cart.
- Kitchen receives the correct fulfillment intent.
- Dine-in and takeaway items remain on the same order.
- Final bill includes both.
- Customer pays once.
- Table remains occupied until the final order is settled/closed.

---

# 12. Customer Session Persistence

Although not a separate UI feature, persistence is required to make the above flow reliable.

## 12.1 Persist

Persist enough information to restore the active customer experience, including:

- session token
- session expiration metadata where useful
- active order ID
- theme preference
- table/public ordering mode

Do not trust client-persisted prices or totals as authoritative financial data.

## 12.2 Restore flow

On customer app startup:

```text
Read local session
      ↓
Is session present and usable?
      ↓ yes
Restore session
      ↓
Is active order present?
      ↓ yes
Fetch order from API
      ↓
Show menu/order state
```

If the session is invalid/expired:

- clear stale session data
- show the appropriate QR/session error
- do not silently create a new unrelated table session if that would make an existing order invisible

---

# 13. Customer Requests

The existing realtime pipeline supports customer request updates. The customer UI should consume them.

For example:

```text
Call waiter
    ↓
Request sent
    ↓
Waiter acknowledges
    ↓
Customer sees
"A waiter is on the way"
    ↓
Waiter resolves
    ↓
Customer sees resolved state
```

This should use realtime when available and not remain a permanently static "Request sent" message.

---

# 14. API / Backend Requirements

The final implementation should expose clear domain operations rather than forcing the frontend to simulate the workflow.

Recommended conceptual operations:

```text
POST /customer/sessions
GET  /customer/session
GET  /customer/menu
GET  /customer/orders/:id
POST /customer/orders
POST /customer/orders/:id/tickets       # or equivalent existing order-service route
POST /customer/orders/:id/request-bill
POST /customer/orders/:id/checkout
```

Exact routes may differ if equivalent existing endpoints already exist. Do not create duplicate endpoints unnecessarily.

## 14.1 Create order

Used only for the first parent order of a session/tab.

## 14.2 Add round

Used when an active parent order already exists.

Must:

- validate session ownership
- validate order ownership
- require order to be open
- validate menu availability
- resolve current pricing/tax
- create a new ticket/round
- update cumulative totals
- emit realtime events
- handle inventory

## 14.3 Request bill

Must transition the active order into the appropriate bill-requested lifecycle state and prevent additional ordering if that is the chosen business rule.

## 14.4 Checkout

Must only be used for final settlement.

For dine-in customer QR:

- checkout is not called after each round
- checkout uses the latest cumulative order total

For public takeaway:

- checkout/payment is required before final acceptance

---

# 15. Payment Rules Matrix

| Scenario | Order type | Table | Payment timing |
|---|---|---|---|
| Table first round | DINE_IN | Yes | End of meal |
| Table Order More | DINE_IN | Yes | End of meal |
| Table multiple rounds | DINE_IN | Yes | One final payment |
| Public QR takeaway | TAKEAWAY | No | Before order acceptance |
| Table customer adds takeaway | DINE_IN parent + TAKEAWAY items | Yes | One final payment with table bill |

---

# 16. Order Lifecycle Matrix

| Event | Parent order | Table | Payment |
|---|---|---|---|
| First table order | Create OPEN order | AVAILABLE → OCCUPIED | None |
| Order More | Same OPEN order | Remains OCCUPIED | None |
| Another Order More | Same OPEN order | Remains OCCUPIED | None |
| Request Bill | BILL_REQUESTED or equivalent | OCCUPIED | None until settlement |
| Final payment success | CLOSED | OCCUPIED → AVAILABLE | SUCCESS |
| Public takeaway order | TAKEAWAY | No table | Payment before acceptance |
| Table + takeaway item | Same DINE_IN order | OCCUPIED | Final single payment |

Exact status names must follow the existing domain enums where possible; do not invent incompatible duplicate statuses.

---

# 17. Web App Requirements

The web app must provide staff controls for customer ordering configuration.

## 17.1 Table QR

Existing table QR functionality should continue to work.

A table QR must identify:

- tenant/branch context through a secure token
- table
- customer ordering mode = dine-in

## 17.2 Public takeaway QR

Provide:

- create/generate
- view
- print
- regenerate/revoke if supported by the security model
- clear indication that it is not tied to a table

Do not expose internal table IDs in the customer-facing QR URL if the existing secure token mechanism can avoid it.

## 17.3 Configuration

Respect branch capabilities such as:

- dine-in enabled
- takeaway enabled
- customer ordering enabled
- tables enabled
- payment provider configured

The UI should not offer a flow that the branch has disabled.

---

# 18. Waiter App Requirements

Waiter screens must correctly reflect customer-created orders.

## 18.1 Table identity

Customer requests must show the table name/number.

Example:

```text
Table 5 · Water
Table 8 · Bill
Table 2 · Cutlery
```

Do not show multiple indistinguishable rows such as:

```text
Table request · water
Table request · water
Table request · water
```

## 18.2 Order More

A new customer round must appear as a new kitchen/order ticket attached to the existing order, not as a completely unrelated table order.

---

# 19. Kitchen Display Requirements

Kitchen must distinguish:

- parent order
- ticket/round
- dine-in fulfillment
- takeaway fulfillment
- table identity when applicable

Example:

```text
Order #101 · Table 5

Ticket #3 · New Round

DINE-IN
  Butter Chicken ×1
  Naan ×2

TAKEAWAY
  Biryani ×1
```

A new round must not overwrite the history/status of previous tickets.

---

# 20. Error Handling

Customer-facing errors must be actionable and must not expose raw database errors.

Examples:

### Expired session

```text
This ordering session has expired.
Please scan the restaurant QR code again.
```

### Order no longer accepts items

```text
This order is already being closed.
You can no longer add items.
```

### Payment unavailable

```text
Online payment is currently unavailable.
Please ask a waiter for assistance.
```

### Takeaway disabled

```text
Takeaway ordering is currently unavailable.
```

Malformed UUIDs/order IDs must be rejected at validation level and must not reach PostgreSQL as invalid UUID casts that become generic HTTP 500 errors.

---

# 21. Security Requirements

Public customer ordering endpoints are internet-facing and require abuse protection.

At minimum:

- rate-limit session creation
- rate-limit order creation/add-round operations
- validate QR/session tokens
- validate that the order belongs to the session
- validate branch association
- validate table association for dine-in
- never trust client-side prices/taxes/totals
- verify payment server-side
- prevent duplicate payment creation
- prevent concurrent duplicate active table orders

Do not expose sensitive tenant data through public QR/session endpoints.

---

# 22. Inventory Requirements

Every initial order and every additional round must perform the same server-side inventory validation/deduction rules.

Inventory failure must not silently disappear into a console-only log with no operational visibility.

If the current product decision remains that an inventory failure should not block a customer order, the failure should at minimum be:

- structured
- traceable to the order/ticket/item
- visible to an operational/admin surface or alerting mechanism

The implementation must not double-deduct inventory when an Order More request is retried.

---

# 23. Testing Requirements

The implementation is not complete until the critical workflows have automated coverage.

## 23.1 Customer session tests

- Create table session.
- Restore valid session.
- Reject expired session.
- Public takeaway session has no table.

## 23.2 Order tests

- First dine-in round creates one order.
- Second round reuses the same order.
- Third round reuses the same order.
- New ticket is created for every additional round.
- Order totals accumulate correctly.
- Tax accumulates correctly.
- Invalid/unavailable items are rejected.

## 23.3 Table tests

- First active customer order changes table to OCCUPIED.
- Second round leaves table OCCUPIED.
- Staff cannot create an independent order while active order exists.
- Final close makes table AVAILABLE.
- Concurrent first-order attempts cannot create two active table orders.

## 23.4 Payment tests

- Dine-in round does not create payment.
- Multiple rounds do not create multiple payments.
- Request Bill does not itself create a successful payment.
- Final checkout creates/uses one payment.
- Repeated checkout calls are idempotent.
- Public takeaway requires verified payment.

## 23.5 Mixed fulfillment tests

- Dine-in item can be added.
- Takeaway item can be added to the same table order.
- Cart separates fulfillment modes.
- Kitchen receives correct fulfillment mode.
- Both fulfillment modes appear on one final bill.

## 23.6 Customer UI tests

- Theme switching.
- Theme persistence.
- Order status rendering.
- Realtime status update.
- Order More flow.
- Request Bill flow.
- Refresh/recovery flow.

---

# 24. Implementation Plan

Implement in the following order. Do not start with cosmetic work before the order/tab model is stable.

## Phase 1 — Domain and data model

1. Confirm current order/ticket/status schema.
2. Confirm whether order items already have a fulfillment field.
3. Add item-level fulfillment mode if required.
4. Define the active customer tab/session relationship.
5. Define exact status transitions.
6. Add/strengthen database protection against duplicate active table orders.

**Deliverable:** stable domain model and migration(s), if needed.

## Phase 2 — Customer session + one active order

1. Persist session token and active order ID.
2. Restore session/order after refresh.
3. Change customer first-order logic to create the parent order only when no active order exists.
4. Implement add-round behavior using the existing ticket mechanism.
5. Ensure cumulative totals are recalculated.
6. Ensure inventory is handled once per round.

**Deliverable:** one order with multiple rounds.

## Phase 3 — Table lifecycle

1. Mark table OCCUPIED on first active dine-in order.
2. Emit table realtime event.
3. Keep table OCCUPIED during Order More.
4. Transition to AVAILABLE only after final order closure.
5. Add concurrency tests.

**Deliverable:** table state and active order state cannot contradict each other.

## Phase 4 — Payment lifecycle

1. Remove automatic dine-in checkout from Place Order.
2. Implement Request Bill.
3. Implement final settlement.
4. Preserve payment idempotency.
5. Ensure the final payment uses the complete cumulative order.

**Deliverable:** one final dine-in payment.

## Phase 5 — Customer Order screen

1. Add persistent Order navigation.
2. Show cumulative order.
3. Show rounds/tickets.
4. Show current kitchen/order status.
5. Add Request Bill.
6. Add Order More.
7. Connect realtime updates.

**Deliverable:** customer can understand exactly what has been ordered and its current state.

## Phase 6 — Public takeaway QR

1. Add branch-level public takeaway QR/token model if required.
2. Add web UI to generate/print/revoke/regenerate.
3. Add customer session mode for public takeaway.
4. Add takeaway cart/checkout.
5. Integrate real payment provider verification.
6. Send paid takeaway order to kitchen.
7. Add takeaway status view.

**Deliverable:** customer can scan a non-table QR, pay, and place a takeaway order.

## Phase 7 — Mixed dine-in + takeaway

1. Add item-level fulfillment.
2. Add customer UI selector.
3. Update cart grouping.
4. Update kitchen display.
5. Update waiter/web order displays.
6. Ensure one bill includes all items.
7. Ensure one final payment settles the table order.

**Deliverable:** one table tab can contain both dine-in and takeaway items.

## Phase 8 — Theme and polish

1. Expose theme selector.
2. Persist theme.
3. Audit mobile layout.
4. Ensure all states use shared theme tokens.
5. Remove duplicated customer UI patterns.

**Deliverable:** consistent customer UI with selectable theme.

## Phase 9 — Full verification

Run:

- typecheck
- unit tests
- API tests
- customer app tests
- web app tests
- production builds
- migration validation

Then manually test all acceptance scenarios in this document.

---

# 25. End-to-End Scenarios for QA

## Scenario A — Normal table meal

```text
1. Scan Table 5 QR.
2. Customer sees Table 5.
3. Add food.
4. Place order.
5. Table 5 becomes OCCUPIED.
6. No payment is requested.
7. Customer opens Order.
8. Sees Preparing/Ready/Served state.
9. Customer orders more.
10. Same order number remains.
11. New kitchen ticket appears.
12. No payment is requested.
13. Customer requests bill.
14. Final cumulative bill is displayed.
15. Customer pays once.
16. Order closes.
17. Table 5 becomes AVAILABLE.
```

## Scenario B — Public takeaway

```text
1. Customer scans Public Takeaway QR.
2. No table is assigned.
3. Customer browses menu.
4. Adds items.
5. Reviews takeaway cart.
6. Pays online.
7. Server verifies payment.
8. Takeaway order is accepted.
9. Kitchen receives takeaway ticket.
10. Customer tracks status.
11. Customer collects order.
```

## Scenario C — Table customer orders takeaway

```text
1. Customer scans Table 5 QR.
2. Orders dine-in food.
3. Customer remains at Table 5.
4. Customer chooses Add as takeaway.
5. Adds Biryani and Samosa.
6. Cart shows separate DINE-IN and TAKEAWAY groups.
7. Both remain on Order #101.
8. Kitchen sees takeaway fulfillment.
9. Customer continues dining.
10. Customer requests bill.
11. One bill contains dine-in + takeaway items.
12. Customer pays once.
13. Order closes.
14. Table becomes AVAILABLE.
```

## Scenario D — Two customers/staff try to order at the same table

```text
1. Customer A has Table 5 active order.
2. Table 5 is OCCUPIED.
3. Customer/staff B attempts to create an independent dine-in order.
4. Server rejects the second independent order.
5. Customer A can still use Order More.
6. Order More adds a ticket to Order #101 instead of being rejected as a new table order.
```

## Scenario E — Refresh during active meal

```text
1. Customer has active Table 5 order.
2. Customer refreshes browser.
3. Session is restored.
4. Active Order #101 is restored.
5. Customer can view status.
6. Customer can continue Order More.
7. Customer does not receive a brand-new unrelated session/order.
```

---

# 26. Non-Goals / Explicitly Deferred

The following are not required by this document unless separately requested:

- loyalty programs
- coupons
- favorites
- customer order history across visits
- split billing
- multi-table shared ordering
- customer account registration
- cross-restaurant customer identity
- international currency support

These can be designed later without changing the core one-tab/multiple-round model if the implementation keeps the domain boundaries clean.

---

# 27. Important Implementation Rules for Engineering Agents

1. **Do not create a second parent order for Order More.**
2. **Do not create a payment for each dine-in round.**
3. **Do not mark a table AVAILABLE while an active dine-in order exists.**
4. **Do not trust client-side prices or payment success.**
5. **Do not merge two independent orders after the fact for the mixed dine-in/takeaway use case; use one parent table order with item-level fulfillment.**
6. **Reuse existing order/ticket/realtime infrastructure where possible.**
7. **Use existing status enums and domain concepts rather than inventing incompatible duplicates.**
8. **Every critical rule must be enforced by the API/domain layer, not only by frontend controls.**
9. **Every new flow needs automated tests before being considered complete.**
10. **Keep customer-facing errors clean and actionable; never expose raw database errors.**

---

# 28. Definition of Done

This work is complete only when all of the following are true:

- [ ] Customer can choose and persist a theme.
- [ ] Customer has a permanent Order/Status screen.
- [ ] Customer can see current kitchen/order status.
- [ ] First table order changes table to OCCUPIED.
- [ ] Table cannot remain AVAILABLE while an active order exists.
- [ ] Order More reuses the same parent order.
- [ ] Every additional round gets its own kitchen ticket.
- [ ] Dine-in Place Order never starts payment.
- [ ] Customer pays once at the end of the dine-in meal.
- [ ] Request Bill is explicit and works against the cumulative tab.
- [ ] Public takeaway QR can be generated from the web app.
- [ ] Public takeaway QR is not associated with a table.
- [ ] Public takeaway customers can pay online and place orders.
- [ ] Paid takeaway orders reach the kitchen.
- [ ] Table customers can add takeaway items.
- [ ] Dine-in and takeaway items can coexist on one parent order.
- [ ] Kitchen can distinguish fulfillment mode.
- [ ] One final bill contains all items in the table tab.
- [ ] One final payment settles that bill.
- [ ] Table becomes AVAILABLE only after final order closure.
- [ ] Session/order state survives refresh appropriately.
- [ ] Realtime customer/order/table updates work.
- [ ] Rate limiting protects public customer write endpoints.
- [ ] Critical flows have automated tests.
- [ ] Typecheck and production builds pass.

---

## 29. Source Context

This specification was prepared from the current Servora codebase and the customer-app review supplied with the project. The review specifically identified the broken Order More flow, table identity issue, malformed order ID handling, missing customer deployment target, missing customer allergen/food information, session persistence gap, shared-table limitation, lack of rate limiting, customer request realtime gap, waiter request cap, quick-add opportunity, inventory visibility issue, and customer-app test configuration gap. The present requirements additionally incorporate the newly requested customer ordering, table lifecycle, payment, and takeaway workflows.


## Phase 6 implementation note — mixed fulfilment

A table customer may classify each cart line as `DINE_IN` or `TAKEAWAY`. Both fulfilment types remain under the same parent dine-in order/tab and therefore settle on one final bill. Public takeaway sessions are forced to `TAKEAWAY`. The database stores the fulfilment choice on each order item, while the kitchen ticket remains the round-level unit.
