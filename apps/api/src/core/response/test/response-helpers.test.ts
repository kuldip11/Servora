import { describe, expect, it } from "vitest";
import {
  createdResponse,
  listResponse,
  paginatedResponse,
  successResponse,
} from "../response-helpers";

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
      paginatedResponse([1], { skip: 0, take: 1, total: 2 }).pagination.hasMore,
    ).toBe(true);
    expect(
      paginatedResponse([1], { skip: 1, take: 1, total: 2 }).pagination.hasMore,
    ).toBe(false);
    expect(
      paginatedResponse([], { skip: 0, take: 0, total: 1 }).pagination.hasMore,
    ).toBe(true);
  });
});
