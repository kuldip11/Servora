#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail=0
require_pattern() {
  local file="$1" pattern="$2" label="$3"
  if ! grep -Fq "$pattern" "$file"; then
    echo "RBAC FAIL: $label ($file missing: $pattern)" >&2
    fail=1
  fi
}

# Money-management surfaces must remain behind explicit permissions.
require_pattern apps/api/src/modules/menu/pricing/price-rule.service.ts 'requirePermission(auth, "menu:read")' 'PriceRule reads require menu:read'
require_pattern apps/api/src/modules/menu/pricing/price-rule.service.ts 'requirePermission(auth, "menu:pricing:write")' 'PriceRule writes require menu:pricing:write'
require_pattern apps/api/src/db/migrations/0002_create_permissions.sql "'menu:pricing:write'" 'Pricing permission is seeded'
require_pattern apps/api/src/modules/menu/promotions/promotion.service.ts 'requirePermission(auth, "menu:read")' 'Promotion reads require menu:read'
require_pattern apps/api/src/modules/menu/promotions/promotion.service.ts 'requirePermission(auth, "menu:pricing:write")' 'Promotion writes require menu:pricing:write'
require_pattern apps/api/src/modules/loyalty/loyalty.service.ts 'requirePermission(auth, "menu:read")' 'Loyalty reads require menu:read'
require_pattern apps/api/src/modules/loyalty/loyalty.service.ts 'requirePermission(auth, "menu:update")' 'Loyalty writes require menu:update'
require_pattern apps/api/src/modules/tenants/tenant.service.ts 'requirePermission(auth, "tenant:update")' 'Pricing/tax tenant settings require tenant:update'
require_pattern apps/api/src/modules/orders/create-order.service.ts 'requireOrdersPermission(auth, "orders:create")' 'Order creation requires orders:create'
require_pattern apps/api/src/modules/orders/order-fire.service.ts 'requireOrdersPermission(auth, "orders:update")' 'Later-round fire requires orders:update'
require_pattern apps/api/src/modules/orders/order-adjustment.service.ts 'requireOrdersPermission(auth, "orders:void")' 'Voids require orders:void'
require_pattern apps/api/src/modules/orders/order-adjustment.service.ts 'requireOrdersPermission(auth, "orders:comp")' 'Comps require orders:comp'

# Inventory-intelligence surfaces. Route authentication is supplied by
# requireAuthPlugin; service-level checks pin the actual permissions.
require_pattern apps/api/src/modules/menu/recipes/recipes.service.ts 'requirePermission(auth, "menu:read")' 'Recipe reads require menu:read'
require_pattern apps/api/src/modules/menu/recipes/recipes.service.ts 'requirePermission(auth, "menu:update")' 'Recipe writes require menu:update'
require_pattern apps/api/src/modules/menu/sub-recipes/sub-recipe.service.ts 'requirePermission(auth, "menu:read")' 'Sub-recipe reads require menu:read'
require_pattern apps/api/src/modules/menu/sub-recipes/sub-recipe.service.ts 'requirePermission(auth, "menu:update")' 'Sub-recipe writes require menu:update'
require_pattern apps/api/src/modules/inventory/inventory-recipe.service.ts 'requireInventoryPermission(auth, "inventory:read")' 'Recipe-impact reads require inventory:read'
require_pattern apps/api/src/modules/inventory/inventory-stock.service.ts 'requireInventoryPermission(auth, "inventory:read")' 'Waste-reason reads require inventory:read'
require_pattern apps/api/src/modules/inventory/inventory-stock.service.ts 'requireInventoryPermission(auth, "inventory:update")' 'Waste and inventory writes require inventory:update'
require_pattern apps/api/src/modules/inventory/inventory-stock.service.ts 'requireInventoryTransactionPermission(auth, input.transactionType)' 'Waste stock transactions use transaction RBAC'

# Kitchen-operations surfaces.
require_pattern apps/api/src/modules/kitchen-tickets/ticket.service.ts 'requireKitchenPermission(auth, "kitchen:read")' 'Station-filtered KDS reads require kitchen:read'
require_pattern apps/api/src/modules/kitchen-tickets/ticket.service.ts 'requireKitchenStatusPermission(auth, newStatus)' 'Kitchen ticket status changes use transition-specific RBAC'
require_pattern apps/api/src/modules/kitchen-tickets/ticket-authorization.ts 'auth.permissions.includes("orders:update_status")' 'Waiter SERVED transition accepts orders:update_status'
require_pattern apps/api/src/modules/kitchen-tickets/ticket-authorization.ts 'newStatus === "FIRED" && auth.permissions.includes("orders:update")' 'Waiter held-course fire accepts orders:update'
require_pattern apps/api/src/modules/kitchen-tickets/ticket-authorization.ts 'auth.permissions.includes("kitchen:update")' 'Kitchen production transitions require kitchen:update'
require_pattern apps/api/src/modules/orders/order-kitchen.service.ts 'requireOrdersPermission(auth, "orders:update")' 'Refire item writes require orders:update'
require_pattern apps/api/src/modules/orders/order-fire.service.ts 'requireOrdersPermission(auth, "orders:update")' 'Later-round course writes require orders:update'
require_pattern apps/api/src/modules/orders/order-kitchen.service.ts 'if (alsoCompOriginal) requireOrdersPermission(auth, "orders:comp")' 'Refire comp-original path requires orders:comp'
require_pattern apps/api/src/modules/tenants/tenant.service.ts 'requirePermission(auth, "tenant:update")' 'Course sequencing tenant setting requires tenant:update'

# Advanced restaurant-model surfaces.
require_pattern apps/api/src/modules/organizations/organization.service.ts 'requirePermission(auth, "organization:manage")' 'Organization inheritance administration requires organization:manage'
require_pattern apps/api/src/modules/menu/pricing/price-rule.service.ts 'requirePermission(auth, "organization:manage")' 'Organization-scoped price rules require organization:manage'
require_pattern apps/api/src/modules/customer-groups/customer-group.service.ts 'requirePermission(auth, "menu:pricing:write")' 'Customer-group pricing administration requires menu:pricing:write'
require_pattern apps/api/src/modules/menu/availability/availability.controller.ts 'requirePermission(auth, "menu:update")' 'Manual stock-count adjustment requires menu:update'
require_pattern apps/api/src/modules/billing/billing.service.ts 'requireBillingPermission(auth, "billing:create")' 'Fractional seat-share writes require billing:create'
require_pattern apps/api/src/modules/orders/order-kitchen.service.ts 'async refillItem' 'Unlimited-refill operation exists on kitchen-order service'
require_pattern apps/api/src/modules/orders/order.service.ts 'refillItem: orderKitchenService.refillItem' 'Unlimited-refill operation remains exposed by order facade'
require_pattern apps/api/src/modules/orders/order-kitchen.service.ts 'requireOrdersPermission(auth, "orders:update")' 'Unlimited-refill/order mutation requires orders:update'
require_pattern apps/api/src/db/migrations/0002_create_permissions.sql "'organization:manage'" 'Organization permission is seeded'

if (( fail )); then exit 1; fi
echo "RBAC static audit OK: protected surfaces have explicit permission gates and canonical permissions are seeded."
