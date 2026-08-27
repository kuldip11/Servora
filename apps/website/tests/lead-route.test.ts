import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../app/api/lead/route";

describe("POST /api/lead", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("LEAD_WEBHOOK_URL", "https://example.test/lead");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
  });

  it("rejects invalid email", async () => {
    const response = await POST(new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "invalid" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(400);
  });

  it("silently accepts honeypot submissions", async () => {
    const response = await POST(new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ website: "bot", name: "A", email: "a@example.com" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 502 when the lead destination fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 500 })));
    const response = await POST(new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "a@example.com" }),
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10" },
    }));
    expect(response.status).toBe(502);
  });

  it("delivers a valid lead", async () => {
    const response = await POST(new Request("http://localhost/api/lead", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "a@example.com", source: "contact", subject: "sales", message: "Hello" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
