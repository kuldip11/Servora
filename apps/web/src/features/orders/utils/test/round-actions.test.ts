import { describe, expect, it } from "vitest";
import { getRoundActionPermissions } from "@/features/orders/utils/round-actions";

const permissions =
  (...keys: string[]) =>
  (key: string) =>
    keys.includes(key);

describe("Order Detail round action permissions", () => {
  it.each(["OWNER", "FRANCHISE_ADMIN", "MANAGER"])(
    "allows %s to progress FIRED through SERVED",
    (role) => {
      expect(
        getRoundActionPermissions(
          [role],
          permissions("orders:update", "orders:update_status"),
        ),
      ).toEqual({ canFire: true, canPrepare: true, canServe: true });
    },
  );

  it("keeps Waiter served-only", () => {
    expect(
      getRoundActionPermissions(
        ["WAITER"],
        permissions("orders:update", "orders:update_status"),
      ),
    ).toEqual({ canFire: false, canPrepare: false, canServe: true });
  });

  it("keeps Chef/KDS preparation and serving access intact", () => {
    expect(
      getRoundActionPermissions(["CHEF"], permissions("kitchen:update")),
    ).toEqual({ canFire: true, canPrepare: true, canServe: true });
  });

  it("does not let Cashier serve a ready round", () => {
    expect(
      getRoundActionPermissions(
        ["CASHIER"],
        permissions("orders:update_status"),
      ),
    ).toEqual({ canFire: false, canPrepare: false, canServe: false });
  });
});
