import { describe, expect, it } from "vitest";
import { isEffectiveAt, itemMatchesBranch, menuMatchesContext } from "./menu-resolver.service";

const unrestricted = {
  availableChannels: null,
  availableFulfillmentTypes: null,
  availableBranchIds: null,
};

describe("menu context resolver", () => {
  it("accepts an unrestricted menu", () => {
    expect(menuMatchesContext(unrestricted, "b1", "STAFF", "DINE_IN")).toBe(true);
  });

  it("checks channel, fulfillment type, and branch independently", () => {
    expect(menuMatchesContext({ ...unrestricted, availableChannels: ["CUSTOMER_QR"] }, "b1", "STAFF", "DINE_IN")).toBe(false);
    expect(menuMatchesContext({ ...unrestricted, availableFulfillmentTypes: ["DELIVERY"] }, "b1", "STAFF", "DINE_IN")).toBe(false);
    expect(menuMatchesContext({ ...unrestricted, availableBranchIds: ["b2"] }, "b1", "STAFF", "DINE_IN")).toBe(false);
  });

  it("requires every configured scope to match", () => {
    const scoped = {
      availableChannels: ["CUSTOMER_QR"],
      availableFulfillmentTypes: ["TAKEAWAY"],
      availableBranchIds: ["b1"],
    };
    expect(menuMatchesContext(scoped, "b1", "CUSTOMER_QR", "TAKEAWAY")).toBe(true);
    expect(menuMatchesContext(scoped, "b2", "CUSTOMER_QR", "TAKEAWAY")).toBe(false);
  });
});

describe("menu and item branch scope composition", () => {
  it.each([
    [null, null, "b1", true],
    [null, ["b1"], "b1", true],
    ["b1", null, "b1", true],
    ["b1", ["b1", "b2"], "b1", true],
    ["b1", ["b1", "b2"], "b2", false],
    ["b1", ["b2"], "b1", false],
  ])("composes item %s and menu %s at %s", (itemBranch, menuBranches, branch, expected) => {
    expect(menuMatchesContext({ ...unrestricted, availableBranchIds: menuBranches }, branch, "STAFF", "DINE_IN") && itemMatchesBranch(itemBranch, branch)).toBe(expected);
  });
});
it("keeps scheduled changes hidden until the exact effective instant", () => {
  const midnight = new Date("2026-09-01T00:00:00.000Z");
  expect(isEffectiveAt(midnight, new Date("2026-08-31T23:59:59.999Z"))).toBe(false);
  expect(isEffectiveAt(midnight, midnight)).toBe(true);
});
