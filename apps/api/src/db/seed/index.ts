/**
 * Development/demo seed entry point.
 *
 * Required application reference data (RBAC roles, permissions, role mappings,
 * and canonical allergens) is installed by SQL migrations. Keep this command
 * and its package script in place for future demo/development data.
 */

async function seed() {
  console.log("🌱 Demo seed is currently empty.");
  console.log("   Required reference data is installed by db:migrate.");
  console.log("   Demo/development records can be added here later.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
