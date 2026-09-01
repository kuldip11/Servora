import { closeDatabaseConnections } from "@/db";
import { resetDemoData } from "./demo/reset";

resetDemoData()
  .then(() => console.log("✅ Servora demo data reset complete."))
  .catch((error) => { console.error("❌ Demo reset failed:", error); process.exitCode = 1; })
  .finally(async () => closeDatabaseConnections());
