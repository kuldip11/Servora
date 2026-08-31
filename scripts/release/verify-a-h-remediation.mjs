import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const failures = [];
const requireText = (source, values, label) => {
  for (const value of values) if (!source.includes(value)) failures.push(`${label}: missing ${value}`);
};

// C6 — dependency graph validation must be arbitrary-depth and the fields
// accepted by the API must actually be persisted.
const modifierService = read("apps/api/src/modules/menu/modifiers/modifier.service.ts");
const modifierRepository = read("apps/api/src/modules/menu/modifiers/modifier.repository.ts");
const modifierTests = read("apps/api/src/modules/menu/modifiers/test/modifier.service.test.ts");
requireText(modifierService, [
  "assertNoCircularDependency",
  "visitedGroupIds",
  "while (prerequisiteOptionId)",
  "findModifierOption",
  "findModifierGroup",
  'throw new Error("Circular modifier group dependency")',
], "C6 deep cycle validation");
requireText(modifierRepository, ["dependsOnOptionId: data.dependsOnOptionId", "groupType: data.groupType"], "C6/C7 persistence");
requireText(modifierTests, ["rejects an arbitrary-depth circular dependency at write time", "allows an acyclic dependency chain"], "C6 behavioral tests");

// C8 — both customer and waiter surfaces must honor GUIDED_BUILDER.
const waiterCustomizer = read("apps/waiter-app/src/features/menu/components/ItemCustomiser.tsx");
const waiterTests = read("apps/waiter-app/src/features/menu/components/test/remaining.test.tsx");
const customerCustomizer = read("apps/customer-app/src/features/menu/ItemCustomization.tsx");
requireText(waiterCustomizer, ['displayMode === "GUIDED_BUILDER"', "Build your dish", "guidedStep", "renderedGroups", "Next step"], "C8 waiter guided builder");
requireText(waiterTests, ["renders build-your-own items as a guided step flow", "Step 1 of 2", "Next step"], "C8 waiter UI test");
requireText(customerCustomizer, ['displayMode === "GUIDED_BUILDER"'], "C8 customer guided builder");

// G4 — count depletion is a resolver precedence layer, not merely an early
// helper result that branch/channel ACTIVE can later overwrite.
const availability = read("apps/api/src/modules/menu/availability/availability.service.ts");
const availabilityTests = read("apps/api/src/modules/menu/availability/test/availability.service.test.ts");
requireText(availability, [
  "const countDepleted",
  "item.manualOverrideStatus",
  "countDepleted\n        ? resolvedStatus.status\n        : (channelOverride?.status ?? override?.status ?? resolvedStatus.status)",
  '? "MANUAL_COUNT"',
], "G4 precedence");
requireText(availabilityTests, ["does not let ACTIVE branch/channel overrides resurrect a depleted count"], "G4 precedence regression test");

if (failures.length) {
  console.error("❌ A-H remediation contract verification failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log("✅ A-H audited remediation contracts verified (C6, C8, G4)");
