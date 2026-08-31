import { describe, expect, it } from "vitest";
import { Elysia } from "elysia";
import { requestContextPlugin } from "@/core/context/request-context";

describe("requestContextPlugin", () => {
  it("adds request id and response-time headers", async () => {
    const app = new Elysia()
      .use(requestContextPlugin())
      .get("/health", ({ requestContext }) => ({
        requestId: requestContext.requestId,
      }));
    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: { "user-agent": "vitest" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("x-response-time")).toMatch(/^\d+ms$/);
    const body = (await response.json()) as { requestId: string };
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("does not trust forwarded client-ip headers by default", async () => {
    const app = new Elysia()
      .use(requestContextPlugin())
      .get("/health", ({ requestContext }) => ({ ip: requestContext.ip }));
    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: {
          "x-forwarded-for": "203.0.113.1",
          "x-real-ip": "203.0.113.2",
        },
      }),
    );
    expect(await response.json()).toEqual({});
  });
});
