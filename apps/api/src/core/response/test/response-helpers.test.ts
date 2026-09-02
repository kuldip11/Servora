import { describe, expect, it } from "vitest";
import {
  createdResponse,
  listResponse,
  paginatedResponse,
  successResponse,
} from "@/core/response/response-helpers";

describe("response helpers", () => {
  it("creates success and created envelopes", () => {
    expect(successResponse({ id: "1" })).toEqual({
      success: true,
      data: { id: "1" },
    });
    expect(createdResponse({ id: "1" })).toEqual({
      success: true,
      data: { id: "1" },
    });
  });
  it("creates list responses", () => {
    expect(listResponse([1, 2])).toEqual({ success: true, data: [1, 2] });
  });
  it("calculates hasMore from pagination", () => {
    expect(
      paginatedResponse([1], { page: 1, limit: 1, total: 2 }).pagination
        .hasMore,
    ).toBe(true);
    expect(
      paginatedResponse([1], { page: 2, limit: 1, total: 2 }).pagination
        .hasMore,
    ).toBe(false);
    expect(
      paginatedResponse([], { page: 1, limit: 1, total: 0 }).pagination.hasMore,
    ).toBe(false);
  });
});
