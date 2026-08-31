import { Elysia } from "elysia";
import { timingSafeEqual } from "crypto";
import { env } from "../../config/env";
import { metrics } from "./metrics";

function tokenMatches(value: string | undefined): boolean {
  const prefix = "Bearer ";
  if (!value?.startsWith(prefix)) return false;
  const actual = Buffer.from(value.slice(prefix.length));
  const expected = Buffer.from(env.METRICS_TOKEN);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const metricsRouter = new Elysia().get("/metrics", ({ headers, set }) => {
  if (!tokenMatches(headers.authorization)) {
    set.status = 404;
    return "Not Found";
  }
  set.headers["content-type"] = "text/plain; version=0.0.4; charset=utf-8";
  return metrics.renderPrometheus();
});
