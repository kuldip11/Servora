import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const m84 = read("apps/api/src/db/migrations/0082_phase_g_advanced_restaurant_models.sql");
const m85 = read("apps/api/src/db/migrations/0083_phase_g_completion.sql");
const journal = JSON.parse(read("apps/api/src/db/migrations/meta/_journal.json"));
const pricing = read("apps/api/src/modules/orders/pricing/pricing-pipeline.ts");
const orders = read("apps/api/src/modules/orders/order.service.ts");
const orderRepo = read("apps/api/src/modules/orders/order.repository.ts");
const availability = read("apps/api/src/modules/menu/availability/availability.service.ts");
const billing = read("apps/api/src/modules/billing/billing-split.ts");
const org = read("apps/api/src/modules/organizations/organization.service.ts");
const menuResolver = read("apps/api/src/modules/menu/menus/menu-resolver.service.ts");
const priceRules = read("apps/api/src/modules/menu/pricing/price-rule.service.ts");
const typesMenu = read("packages/types/src/menu.ts");
const typesOrder = read("packages/types/src/orders.ts");
const validationMenu = read("packages/validation/src/menu.ts");
const validationOrder = read("packages/validation/src/orders.ts");
const webItem = read("apps/web/src/features/menu/components/ItemFormModal.tsx");
const webVariant = read("apps/web/src/features/menu/components/VariantModifierPricingPanel.tsx");
const webGroups = read("apps/web/src/features/menu/components/CustomerGroupsSection.tsx");
const webOrg = read("apps/web/src/features/menu/components/OrganizationManagementSection.tsx");
const webBuffet = read("apps/web/src/features/menu/components/BuffetPricingSection.tsx");
const waiter = read("apps/waiter-app/src/features/menu/pages/MenuPage.tsx");
const waiterDetail = read("apps/waiter-app/src/features/orders/pages/OrderDetailPage.tsx");
const customer = read("apps/customer-app/src/features/menu/ItemCustomization.tsx");
const kds = read("apps/kitchen-display/src/features/kitchen/components/TicketItems.tsx");
const pricingTests = read("apps/api/src/modules/orders/test/pricing-pipeline.test.ts");
const orderTests = read("apps/api/src/modules/orders/test/order.service.test.ts");
const repoTests = read("apps/api/src/modules/orders/test/order.repository.test.ts");
const inventoryTests = read("apps/api/src/modules/inventory/test/inventory.service.test.ts");
const availabilityTests = read("apps/api/src/modules/menu/availability/test/availability.service.test.ts");
const billingTests = read("apps/api/src/modules/billing/test/billing-split.test.ts");
const orgTests = read("apps/api/src/modules/organizations/test/organization.service.test.ts");
const priceRuleTests = read("apps/api/src/modules/menu/pricing/test/price-rule.service.test.ts");
const kdsTests = read("apps/kitchen-display/src/features/kitchen/components/test/presentational.test.tsx");

const failures = [];
const requireText = (source, text, label) => { if (!source.includes(text)) failures.push(label); };

// Deployment/migration integrity.
for (const tag of ["0082_phase_g_advanced_restaurant_models", "0083_phase_g_completion"]) {
  if (!journal.entries?.some((entry) => entry.tag === tag)) failures.push(`Drizzle journal missing ${tag}`);
}
requireText(m84, 'DROP CONSTRAINT IF EXISTS "menus_tenant_name_unique"', "G7 migration must replace the owned menu unique constraint safely");
requireText(m84, 'CREATE TABLE IF NOT EXISTS "modifier_option_variant_prices"', "G1 table missing");
requireText(m84, '"supports_zones" boolean NOT NULL DEFAULT false', "G2 supports_zones default missing");
requireText(m84, "'WEIGHT_BASED'", "G3 pricing mode missing");
requireText(m84, '"manual_stock_count" integer', "G4 manual stock count missing");
requireText(m84, 'CREATE TABLE IF NOT EXISTS "order_item_seat_shares"', "G5 seat-share table missing");
requireText(m84, '"is_unlimited_refill" boolean NOT NULL DEFAULT false', "G6 refill flag missing");
requireText(m84, '"organization_id" uuid', "G7 organization scope missing");
requireText(m84, 'CREATE TABLE IF NOT EXISTS "customer_groups"', "G8 customer groups missing");
requireText(m84, "'PER_COVER'", "G9 per-cover mode missing");
requireText(m85, "orders_billing_mode_idx", "Phase G completion indexes missing");

// Authoritative server paths.
requireText(pricing, "option.variantPrices?.find", "G1 variant modifier resolution is not authoritative server-side");
for (const rule of ['"HIGHER"', '"AVERAGE"', '"SUM_HALF"']) requireText(pricing, rule, `G2 pricing rule ${rule} missing`);
requireText(pricing, '(item.pricingMode ?? "FIXED") === "WEIGHT_BASED"', "G3 weight pricing branch missing");
requireText(pricing, '(item.pricingMode ?? "FIXED") === "OPEN"', "G3 open pricing branch missing");
requireText(availability, "Manual stock count depleted", "G4 availability precedence missing");
requireText(availability, "const countDepleted", "G4 count-depletion precedence guard missing");
requireText(availabilityTests, "does not let ACTIVE branch/channel overrides resurrect a depleted count", "G4 branch/channel resurrection regression test missing");
requireText(orderRepo, "gte(menuItems.manualStockCount, need.quantity)", "G4 atomic item compare/decrement missing");
requireText(orderRepo, "gte(menuItemVariants.manualStockCount, need.quantity)", "G4 atomic variant compare/decrement missing");
requireText(billing, "buildFractionalSeatAllocationPlan", "G5 fractional billing planner missing");
requireText(orders, "async refillItem", "G6 refill service missing");
requireText(orders, 'refireType: "REFILL"', "G6 refill lineage missing");
requireText(menuResolver, "inheritedOrganizationMenus", "G7 organization menu fallback missing");
requireText(priceRules, 'requirePermission(auth, "organization:manage")', "G7 organization price authorization missing");
requireText(pricing, "rule.customerGroupId == null || rule.customerGroupId === context.customerGroupId", "G8 group pricing context missing");
requireText(orders, 'billingMode === "PER_COVER"', "G9 order billing branch missing");
requireText(orders, "billingExcluded: true", "G9 server-enforced excluded kitchen lines missing");
requireText(orders, "perCoverRate", "G9 cover rate snapshot missing");

// Shared contracts / validation.
for (const token of ["pricingMode", "supportsZones", "manualStockCount", "variantPrices"]) requireText(typesMenu, token, `shared menu type missing ${token}`);
for (const token of ["billingMode", "coverCount", "customerGroupId", "billingExcluded", "zoneLabel", "refireType"]) requireText(typesOrder, token, `shared order type missing ${token}`);
requireText(validationMenu, "advancedMenuItemPricingSchema", "shared Phase G menu validation missing");
for (const token of ["billingMode", "coverCount", "perCoverPriceRuleId", "weightQuantity", "manualPrice", "zoneLabel"]) requireText(validationOrder, token, `shared order validation missing ${token}`);

// Affected client surfaces.
for (const token of ["pricingMode", "supportsZones", "manualStockCount"]) requireText(webItem, token, `POS item editor missing ${token}`);
requireText(webVariant, "variant", "POS variant modifier pricing editor missing");
requireText(webGroups, "Customer", "POS customer-group management missing");
requireText(webOrg, "Organization", "POS organization management missing");
requireText(webBuffet, "cover", "POS buffet pricing management missing");
for (const token of ["customerGroupId", "billingMode", "coverCount", "zoneLabel", "weightQuantity", "manualPrice"]) requireText(waiter, token, `waiter order flow missing ${token}`);
requireText(waiterDetail, "Refill", "waiter refill action missing");
requireText(waiterDetail, "seat", "waiter fractional seat-share action missing");
requireText(customer, "zoneLabel", "customer split-zone customization missing");
for (const token of ["zoneLabel", "weightQuantity", '"REFILL"', '"REFIRE"']) requireText(kds, token, `KDS rendering missing ${token}`);

// Acceptance/regression tests required by G1-G9.
for (const token of ["G1", "G2", "G3", "G7", "G8"]) requireText(pricingTests, token, `pricing acceptance tests missing ${token}`);
requireText(inventoryTests, "G3 weight-based recipe consumption", "G3 inventory scaling test missing");
requireText(availabilityTests, "G4 manual stock-count availability", "G4 availability test missing");
requireText(repoTests, "G4 atomic manual-stock depletion", "G4 concurrency/last-unit test missing");
requireText(billingTests, "G5 fractional shared-dish splitting", "G5 allocation tests missing");
requireText(orderTests, "G6 produces a zero-priced REFILL", "G6 refill service test missing");
requireText(orderTests, "G9 creates PER_COVER", "G9 order creation test missing");
requireText(orgTests, "G7 organization inheritance authorization", "G7 organization authorization tests missing");
requireText(priceRuleTests, "G7 organization price-rule authorization", "G7 price-rule security tests missing");
requireText(kdsTests, "G2/G3/G6 renders zones", "G2/G3/G6 KDS rendering test missing");

// Guardrail: Phase G must not introduce app-local `any` annotations in changed production files.
const productionFiles = [
  "apps/api/src/modules/orders/pricing/pricing-pipeline.ts",
  "apps/api/src/modules/orders/order.service.ts",
  "apps/api/src/modules/orders/order.repository.ts",
  "apps/web/src/features/menu/components/ItemFormModal.tsx",
  "apps/web/src/features/menu/components/VariantModifierPricingPanel.tsx",
  "apps/waiter-app/src/features/menu/components/ItemCustomiser.tsx",
  "apps/customer-app/src/features/menu/api.ts",
  "apps/kitchen-display/src/features/kitchen/components/TicketItems.tsx",
];
for (const path of productionFiles) {
  const source = read(path);
  if (/\bany\b/.test(source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""))) failures.push(`new any detected in Phase G production surface: ${path}`);
}

if (failures.length) {
  console.error("❌ Phase G acceptance structure failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log("✅ Phase G G1-G9 client-surface, security, and acceptance-test structure verified");
