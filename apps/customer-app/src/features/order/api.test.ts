import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../shared/api/client", () => ({
  request: vi.fn(),
}));

import { request } from "@/shared/api/client";
import { createCustomerOrder, verifyTakeawayPayment } from "./api";

const mockedRequest = vi.mocked(request);

describe("customer order API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends loyalty identity and coupon context with customer order creation", async () => {
    mockedRequest.mockResolvedValue({} as never);

    await createCustomerOrder("session-1", {
      items: [{ menuItemId: "item-1", quantity: 1 }],
      couponCode: "SAVE20",
      loyaltyPhone: "+919876543210",
    });

    expect(mockedRequest).toHaveBeenCalledWith(
      "/api/customer/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          items: [{ menuItemId: "item-1", quantity: 1 }],
          couponCode: "SAVE20",
          loyaltyPhone: "+919876543210",
        }),
      }),
      "session-1",
    );
  });

  it("uses the concrete order id in takeaway payment verification", async () => {
    mockedRequest.mockResolvedValue({} as never);

    await verifyTakeawayPayment("session-1", {
      orderId: "order-123",
      razorpayOrderId: "rz-order-1",
      razorpayPaymentId: "rz-payment-1",
      razorpaySignature: "signature",
    });

    expect(mockedRequest).toHaveBeenCalledWith(
      "/api/customer/orders/order-123/payment/verify",
      expect.objectContaining({ method: "POST" }),
      "session-1",
    );
  });
});
