import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const requireText = (source, required, label) => {
  for (const value of required) {
    if (!source.includes(value)) throw new Error(`${label} missing contract: ${value}`);
  }
};
const expandOnly = (source, label) => {
  for (const forbidden of [/DROP TABLE/i, /DROP COLUMN/i, /ALTER TYPE.+RENAME/i]) {
    if (forbidden.test(source)) throw new Error(`${label} is not expand-only: ${forbidden}`);
  }
};

const hMigration = read("apps/api/src/db/migrations/0084_phase_h_differentiators.sql");
const replayMigration = read("apps/api/src/db/migrations/0085_phase_h_replay_snapshots.sql");
const resolverReplayMigration = read("apps/api/src/db/migrations/0086_historical_resolver_replay_evidence.sql");
expandOnly(hMigration, "Phase H migration 0086");
expandOnly(replayMigration, "Phase H migration 0087");
expandOnly(resolverReplayMigration, "Phase H migration 0086");
requireText(hMigration, [
  "organization_id",
  "void_comp_approval_thresholds",
  "manager_approval_tokens",
], "Phase H migration 0086");
requireText(replayMigration, [
  "resolution_as_of",
  "availability_snapshot",
], "Phase H replay migration 0087");
requireText(resolverReplayMigration, [
  "pricing_replay_evidence",
  "availability_replay_evidence",
], "Phase H resolver replay migration 0086");

// H1 — explanation must literally re-invoke the same resolvers against
// immutable fire-time inputs rather than consulting today's mutable rows.
const explain = read("apps/api/src/modules/menu/explain/order-explain.service.ts");
const snapshots = read("apps/api/src/modules/orders/order-line-snapshot.service.ts");
const pricing = read("apps/api/src/modules/orders/pricing/pricing-pipeline.ts");
requireText(explain, [
  "availabilitySnapshot",
  "availabilityService.getEffectiveItem",
  "pricingPipeline.price",
  "historicalReplay",
  "authoritativePricingReplay",
  "authoritativeAvailabilityReplay",
  "historicalEvidenceComplete",
], "H1 explain");
requireText(snapshots, [
  "availabilityService.getEffectiveItemWithEvidence",
  "resolutionAsOf",
  "availabilityReplayEvidence",
  "availabilitySnapshot",
], "H1 fire-time snapshots");
requireText(pricing, [
  "historicalReplay",
  "pricingReplayEvidence",
  "PRICE_SOURCE",
  'kind: "PRICE_RULE"',
  'kind: "BRANCH_OVERRIDE"',
  'kind: "MENU_ITEM"',
], "H1 pricing replay/attribution");
const orderSchema = read("apps/api/src/db/schema/kitchen.schema.ts");
const orderRepository = read("apps/api/src/modules/orders/order.repository.ts");
requireText(orderSchema, ["pricingReplayEvidence", "availabilityReplayEvidence"], "H1 replay schema");
requireText(orderRepository, ["pricingReplayEvidence", "availabilityReplayEvidence"], "H1 replay persistence");
const orderRepricing = read("apps/api/src/modules/orders/order-repricing.ts");
const orderRepricingTests = read("apps/api/src/modules/orders/test/order-repricing.test.ts");
requireText(orderRepricing, ["pricingReplayEvidence", "storedOrderLineToStage4Snapshot"], "H1 refire replay-evidence preservation");
requireText(orderRepricingTests, ["pricingReplayEvidence"], "H1 refire replay-evidence test");
const orderDetail = read("apps/web/src/features/orders/pages/OrderDetailPage.tsx");
const orderExplainDialog = read("apps/web/src/features/orders/components/OrderExplainDialog.tsx");
requireText(orderDetail, ["OrderExplainDialog", "Explain", "showExplanation"], "H1 order-detail Explain action");
requireText(orderExplainDialog, ["/explain", "Resolution time", "pricingReplay", "availabilityAtOrder"], "H1 human-readable explain dialog");

// H2 — dashboard must traverse the complete branch/channel/fulfillment scope
// and include base items, variants and modifier options with structured causes.
const availability = read("apps/api/src/modules/menu/availability/availability.service.ts");
requireText(availability, [
  '["STAFF", "CUSTOMER_QR"]',
  '["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"]',
  'entityType: "ITEM"',
  'entityType: "VARIANT"',
  'entityType: "MODIFIER_OPTION"',
  "availabilityCause",
], "H2 availability dashboard");
if (availability.includes("reason.toLowerCase().includes")) {
  throw new Error("H2 cause filtering must use structured resolver attribution, not reason-text matching");
}
const availabilityUi = read("apps/web/src/features/availability/pages/AvailabilityDashboardPage.tsx");
requireText(availabilityUi, ["/menu/availability/dashboard", "useRealtimeEvent", "menu.availability.updated", "All channels", "All fulfillment types"], "H2 dedicated live availability UI");

// H3 — engineering must exclude cancelled orders and expose a configurable window.
const analyticsRepo = read("apps/api/src/modules/analytics/analytics.repository.ts");
const analyticsService = read("apps/api/src/modules/analytics/analytics.service.ts");
const differentiatorsPage = read("apps/web/src/features/differentiators/pages/DifferentiatorsPage.tsx");
const engineeringUi = read("apps/web/src/features/analytics/pages/MenuEngineeringPage.tsx");
requireText(analyticsRepo, ["notInArray(orders.status", '"CANCELLED"'], "H3 sales aggregation");
requireText(analyticsService, ["getMenuEngineeringReport", "windowDays", "classifyMenuEngineering"], "H3 menu engineering service");
requireText(engineeringUi, ["/analytics/menu-engineering", "Analysis window", "Quadrant", "Sort by", "Suggested action"], "H3 analytics product surface");

// H4 — guided combo + promotion authoring and server-authoritative preview.
const comboRoute = read("apps/api/src/modules/menu/combos/combo.route.ts");
const comboBuilder = read("apps/api/src/modules/menu/combos/combo-builder.service.ts");
requireText(comboRoute, [
  'requirePermission(auth, "menu:read")',
  'requirePermission(auth, "menu:pricing:write")',
  'requirePermission(auth, "menu:create")',
  'requirePermission(auth, "menu:delete")',
  "itemRepository.findById(auth.tenantId",
], "H4 combo authorization");
requireText(comboBuilder, ["pricingPipeline.price", "priceCombo"], "H4 authoritative preview");
const promotionService = read("apps/api/src/modules/menu/promotions/promotion.service.ts");
const promotionStage = read("apps/api/src/modules/orders/pricing/promotion-stage.ts");
requireText(promotionService, ["candidatePromotions", "pricingPipeline.price", "pricingPipeline.finalize"], "H4 promotion preview");
requireText(promotionStage, ["candidatePromotions", "options.candidatePromotions"], "H4 promotion pricing-stage reuse");
requireText(differentiatorsPage, ["builderKind", 'setBuilderKind("combo")', 'setBuilderKind("promotion")', "/menu/combos/preview", "/menu/promotions/preview"], "H4 guided authoring UI");
const guidedBuilderUi = read("apps/web/src/features/menu/components/GuidedComboPromotionBuilder.tsx");
const menuPage = read("apps/web/src/features/menu/pages/MenuPage.tsx");
requireText(guidedBuilderUi, ["Guided combo builder", "Guided promotion builder", "/menu/combos/preview", "/menu/promotions/preview", "Choose an item"], "H4 menu guided-builder product surface");
requireText(menuPage, ["GuidedComboPromotionBuilder", 'value: "guided-builder"'], "H4 menu integration");

// H5 — organization tier CRUD, identity linking, and stage-6 lookup.
const loyaltyRepo = read("apps/api/src/modules/loyalty/loyalty.repository.ts");
const loyaltyService = read("apps/api/src/modules/loyalty/loyalty.service.ts");
const loyaltyStage = read("apps/api/src/modules/orders/pricing/loyalty-stage.ts");
const orgRoutes = read("apps/api/src/modules/organizations/organization.route.ts");
const orgUi = read("apps/web/src/features/menu/components/OrganizationManagementSection.tsx");
requireText(loyaltyRepo, ["findOrganizationCustomerIdentity", "organizationCustomerId", "findOrganizationTierForCustomer", "listOrganizationTiers", "first-visit recognition", ".insert(customers)"], "H5 loyalty repository");
requireText(loyaltyService, ["findOrganizationCustomerIdentity", "findApplicableTier"], "H5 loyalty service");
requireText(loyaltyStage, ["findOrganizationTierForCustomer"], "H5 pricing stage");
requireText(orgRoutes, ["/:id/loyalty-tiers", "/:id/loyalty-tiers/:tierId"], "H5 organization API");
requireText(orgUi, ["Organization loyalty tiers", "/loyalty-tiers", "CustomerLoyaltyTier"], "H5 organization UI");
if (orgUi.includes("interface OrgLoyaltyTier")) {
  throw new Error("H5 organization UI must consume the shared loyalty-tier type");
}

// H6 — one-time approval, configured role enforcement, combo-group value,
// and retry UIs in both staff ordering clients.
const approvalService = read("apps/api/src/modules/approvals/approval.service.ts");
const approvalPolicy = read("apps/api/src/modules/approvals/approval-policy.ts");
const orderService = read("apps/api/src/modules/orders/order.service.ts");
const webOrder = orderDetail;
const waiterOrder = read("apps/waiter-app/src/features/orders/pages/OrderDetailPage.tsx");
requireText(approvalService, ["requiresRole", "usedAt", "expiresAt", "approvalRoleMatches"], "H6 approval service");
requireText(approvalPolicy, ["approvalAdjustmentValue", "comboGroupId", "isApprovalRequired"], "H6 approval policy");
requireText(orderService, ["approvalAdjustmentValue"], "H6 order enforcement");
requireText(webOrder, ["ManagerApprovalDialog", "approvalToken", "Manager approval required"], "H6 POS retry UI");
requireText(waiterOrder, ["ManagerApprovalDialog", "approvalToken", "Manager approval required"], "H6 waiter retry UI");
const approvalSettings = read("apps/web/src/features/settings/components/ApprovalThresholdSettingsCard.tsx");
const settingsPage = read("apps/web/src/features/settings/pages/SettingsPage.tsx");
requireText(approvalSettings, ["/approvals/thresholds", "requiresRole", "Approval threshold", "full affected value"], "H6 tenant-admin threshold settings");
requireText(settingsPage, ["ApprovalThresholdSettingsCard", 'has("roles:manage")', 'has("orders:update")'], "H6 settings integration");

const webRoutes = read("apps/web/src/routes/index.tsx");
requireText(webRoutes, ['path: "/availability"', 'requirePermission("menu:read")', 'path: "/menu-engineering"', 'requirePermission("analytics:read")'], "Phase H product routes");

console.log("Phase H H1-H6 acceptance-contract checks passed.");
