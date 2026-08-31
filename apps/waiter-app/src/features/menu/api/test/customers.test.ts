import { describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../../shared/lib/api-client";
import { searchCustomers } from "../customers";

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("searchCustomers", () => {
  it("passes the search query and returns customer data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [
          { id: "c1", name: "Guest", phone: "9876543210", email: null },
          { id: "c2", name: "Other", phone: "1111111111", email: null },
        ],
      },
    } as never);
    await expect(searchCustomers("9876")).resolves.toEqual([
      expect.objectContaining({ id: "c1" }),
    ]);
    expect(apiClient.get).toHaveBeenCalledWith("/loyalty/customers");
  });
});
