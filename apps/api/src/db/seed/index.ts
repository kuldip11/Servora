import { closeDatabaseConnections } from "@/db";
import { resolvePreset } from "./demo/config";
import { resetDemoData } from "./demo/reset";
import { seedCustomersAndPromotions } from "./demo/seed-customers";
import { seedInventory } from "./demo/seed-inventory";
import { seedMenus } from "./demo/seed-menu";
import { seedOrders } from "./demo/seed-orders";
import { seedOrganization } from "./demo/seed-org";
import { seedTablesAndStations } from "./demo/seed-tables";
import { DEMO_EMAIL, DEMO_PASSWORD, parsePreset } from "./demo/utils";
import { verifyDemoSeed } from "./demo/verify";

const main = async (): Promise<void> => {
  const preset = parsePreset(process.argv.slice(2));
  const config = resolvePreset(preset);
  console.log(`🌱 Seeding Servora demo data (${preset})...`);
  console.log(
    `   Conservative dataset estimate: ${config.estimatedSizeMb} MB${preset === "small" ? " (250 MB maximum)" : ""}`,
  );
  console.log("1/8 Resetting previous demo data...");
  await resetDemoData();
  console.log(
    "2/8 Seeding organization, franchises, branches, RBAC and staff...",
  );
  const ctx = await seedOrganization(config);
  console.log("3/8 Seeding restaurant tables and kitchen stations...");
  await seedTablesAndStations(config, ctx);
  console.log(
    "4/8 Seeding published menus, categories, items, variants and modifiers...",
  );
  await seedMenus(config, ctx);
  console.log("5/8 Seeding customers, loyalty tiers and promotions...");
  await seedCustomersAndPromotions(config, ctx);
  console.log("6/8 Seeding branch inventory and opening stock activity...");
  await seedInventory(config, ctx);
  console.log(
    `7/8 Generating ${config.historyDays} days of realistic orders, KDS tickets, bills and payments...`,
  );
  const generated = await seedOrders(config, ctx);
  console.log("8/8 Verifying seeded tenant data...");
  await verifyDemoSeed(ctx);
  const branches = Object.values(ctx.branchIds).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  console.log("✅ Servora demo seed complete!");
  console.log(`   Franchises: ${Object.keys(ctx.tenantIds).length}`);
  console.log(`   Branches: ${branches}`);
  console.log(`   Historical/live orders: ${generated.orders}`);
  console.log(`   Order items: ${generated.orderItems}`);
  console.log(`   Demo login: ${DEMO_EMAIL}`);
  console.log(`   Demo password: ${DEMO_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error("❌ Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => closeDatabaseConnections());
