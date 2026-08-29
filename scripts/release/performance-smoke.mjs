import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const baseUrl = process.env.PERF_BASE_URL ?? "http://127.0.0.1:3000";
const path = process.env.PERF_PATH ?? "/health";
const total = Number(process.env.PERF_REQUESTS ?? 100);
const concurrency = Math.max(1, Number(process.env.PERF_CONCURRENCY ?? 10));
const maxP95 = Number(process.env.PERF_MAX_P95_MS ?? 500);
const maxErrorRate = Number(process.env.PERF_MAX_ERROR_RATE ?? 0.01);

if (!Number.isFinite(total) || total <= 0)
  throw new Error("PERF_REQUESTS must be positive");
if (!Number.isFinite(concurrency) || concurrency <= 0)
  throw new Error("PERF_CONCURRENCY must be positive");

const durations = [];
let failures = 0;
let next = 0;

async function worker() {
  while (true) {
    const index = next++;
    if (index >= total) return;
    const started = performance.now();
    try {
      const response = await fetch(new URL(path, baseUrl), {
        headers: { "user-agent": "servora-performance-smoke/1.0" },
      });
      durations.push(performance.now() - started);
      if (!response.ok) failures += 1;
      await response.arrayBuffer();
    } catch {
      durations.push(performance.now() - started);
      failures += 1;
    }
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, total) }, () => worker()),
);
durations.sort((a, b) => a - b);

const percentile = (p) =>
  durations[
    Math.min(durations.length - 1, Math.ceil(durations.length * p) - 1)
  ] ?? 0;
const result = {
  target: new URL(path, baseUrl).toString(),
  requests: total,
  concurrency,
  failures,
  errorRate: failures / total,
  latencyMs: {
    p50: Math.round(percentile(0.5) * 100) / 100,
    p95: Math.round(percentile(0.95) * 100) / 100,
    p99: Math.round(percentile(0.99) * 100) / 100,
    max: Math.round((durations.at(-1) ?? 0) * 100) / 100,
  },
  thresholds: { maxP95Ms: maxP95, maxErrorRate },
};

const passed =
  result.errorRate <= maxErrorRate && result.latencyMs.p95 <= maxP95;
const report = {
  ...result,
  status: passed ? "passed" : "failed",
  completedAt: new Date().toISOString(),
};
const reportDir = resolve(process.cwd(), ".verification");
mkdirSync(reportDir, { recursive: true });
writeFileSync(
  resolve(reportDir, "performance-smoke.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));

if (!passed) {
  console.error("Performance smoke thresholds failed.");
  process.exit(1);
}

console.log("Performance smoke thresholds passed.");
