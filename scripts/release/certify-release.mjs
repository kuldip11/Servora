import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dir = resolve(root, ".verification");
const baselinePath = resolve(dir, "phase6-baseline.json");
const performancePath = resolve(dir, "performance-smoke.json");

const missing = [baselinePath, performancePath].filter(
  (path) => !existsSync(path),
);
if (missing.length) {
  console.error("Release certification evidence is incomplete.");
  for (const path of missing) console.error(`Missing: ${path}`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const performance = JSON.parse(readFileSync(performancePath, "utf8"));
const checks = {
  baseline: baseline.status === "passed",
  performance: performance.status === "passed",
};
const passed = Object.values(checks).every(Boolean);

const certificate = {
  schemaVersion: 1,
  phase: "6.8",
  status: passed ? "certified" : "failed",
  createdAt: new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA ?? process.env.GIT_COMMIT ?? null,
  appVersion: process.env.APP_VERSION ?? null,
  checks,
  evidence: {
    baseline: "phase6-baseline.json",
    performance: "performance-smoke.json",
  },
};

mkdirSync(dir, { recursive: true });
writeFileSync(
  resolve(dir, "release-certificate.json"),
  `${JSON.stringify(certificate, null, 2)}\n`,
);
console.log(JSON.stringify(certificate, null, 2));
process.exit(passed ? 0 : 1);
