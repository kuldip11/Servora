import { describe, expect, it } from "vitest";
import {
  assertAndInsertPromotionRedemptions,
  type PendingPromotionRedemption,
} from "../promotion.repository";

type RedemptionRow = {
  id: string;
  promotionId: string;
  orderId: string;
  customerId: string | null;
  discountAmount: string;
};

type PromotionRow = {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  maxUsesTotal: number | null;
  maxUsesPerCustomer: number | null;
};

type PromotionTx = Parameters<typeof assertAndInsertPromotionRedemptions>[0];

function createPromotionLockHarness() {
  const promotion: PromotionRow = {
    id: "promo-1",
    tenantId: "tenant-1",
    name: "One use only",
    isActive: true,
    maxUsesTotal: 1,
    maxUsesPerCustomer: null,
  };
  const redemptions: RedemptionRow[] = [];
  const lockModes: string[] = [];

  let tail = Promise.resolve();
  const makeTx = (orderId: string): PromotionTx => {
    let releaseCurrent: (() => void) | null = null;
    let ownsLock = false;

    const acquire = async () => {
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      releaseCurrent = release;
      ownsLock = true;
    };

    const release = () => {
      if (!ownsLock) return;
      ownsLock = false;
      releaseCurrent?.();
      releaseCurrent = null;
    };

    const tx = {
      query: {
        promotionRedemptions: {
          findFirst: async () =>
            redemptions.find(
              (row) => row.promotionId === promotion.id && row.orderId === orderId,
            ),
        },
      },
      select: (projection?: { value?: unknown }) => ({
        from: () => ({
          where: () =>
            projection
              ? Promise.resolve([
                  {
                    value: redemptions.filter(
                      (row) => row.promotionId === promotion.id,
                    ).length,
                  },
                ]).then((rows) => {
                  // When the limit is already exhausted the production helper
                  // throws immediately after this count. Release the fake row
                  // lock here so the harness cannot deadlock after rejection.
                  if (rows[0]!.value >= (promotion.maxUsesTotal ?? Infinity)) {
                    release();
                  }
                  return rows;
                })
              : {
                  for: async (mode: string) => {
                    lockModes.push(mode);
                    await acquire();
                    return [promotion];
                  },
                },
        }),
      }),
      insert: () => ({
        values: async (value: {
          promotionId: string;
          orderId: string;
          customerId: string | null;
          discountAmount: string;
        }) => {
          redemptions.push({ id: `redemption-${redemptions.length + 1}`, ...value });
          release();
        },
      }),
      update: () => ({
        set: () => ({
          where: async () => {
            release();
          },
        }),
      }),
    };

    return tx as unknown as PromotionTx;
  };

  return { makeTx, redemptions, lockModes };
}

describe("promotion redemption concurrency (D3)", () => {
  it("serializes concurrent maxUsesTotal=1 redemptions and rejects the second order", async () => {
    const harness = createPromotionLockHarness();
    const redemption: PendingPromotionRedemption = {
      promotionId: "promo-1",
      customerId: "customer-1",
      discountAmount: 10,
    };

    const results = await Promise.allSettled([
      assertAndInsertPromotionRedemptions(
        harness.makeTx("order-1"),
        "tenant-1",
        "order-1",
        [redemption],
      ),
      assertAndInsertPromotionRedemptions(
        harness.makeTx("order-2"),
        "tenant-1",
        "order-2",
        [redemption],
      ),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({
      reason: expect.objectContaining({ message: expect.stringMatching(/usage limit/i) }),
    });
    expect(harness.redemptions).toHaveLength(1);
    expect(harness.lockModes).toEqual(["update", "update"]);
  });
});
