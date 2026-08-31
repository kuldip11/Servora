import { describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: api }));
import {
  ordersService,
  toCartItemPayload,
} from "@/features/orders/services/orders.service";

const item = {
  menuItemId: "m1",
  menuItemName: "Pizza",
  basePrice: 10,
  modifiers: [
    {
      optionId: "o1",
      groupId: "g1",
      groupName: "Size",
      name: "Large",
      price: 2,
      quantity: 2,
    },
  ],
  quantity: 1,
  chefNotes: "hot",
  unitPrice: 12,
  variantId: "v1",
} as any;

describe("ordersService", () => {
  it("maps cart items and omits empty optional fields", () => {
    expect(
      toCartItemPayload({ ...item, chefNotes: "", variantId: undefined }),
    ).toEqual({
      menuItemId: "m1",
      quantity: 1,
      selectedOptions: [{ optionId: "o1", quantity: 2 }],
    });
    expect(toCartItemPayload(item)).toEqual({
      menuItemId: "m1",
      quantity: 1,
      variantId: "v1",
      chefNotes: "hot",
      selectedOptions: [{ optionId: "o1", quantity: 2 }],
    });
  });
  it("lists with optional filters", async () => {
    api.get.mockResolvedValue({ data: { data: ["o"] } });
    await ordersService.list({ status: "NEW", type: "DINE_IN" });
    expect(api.get).toHaveBeenCalledWith("/orders", {
      params: { status: "NEW", type: "DINE_IN" },
    });
  });
  it("lists without filters", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    await ordersService.list({});
    expect(api.get).toHaveBeenCalledWith("/orders");
  });
  it("handles detail, create, add-items, status, and ticket status", async () => {
    api.get.mockResolvedValue({ data: { data: { id: "o1" } } });
    api.post.mockResolvedValue({ data: { data: { id: "o1" } } });
    api.patch.mockResolvedValue({ data: { data: { id: "o1" } } });
    await expect(ordersService.detail("o1")).resolves.toEqual({ id: "o1" });
    await expect(
      ordersService.create({ type: "DINE_IN", items: [] }),
    ).resolves.toEqual({ id: "o1" });
    await expect(ordersService.addItems("o1", { items: [] })).resolves.toEqual({
      id: "o1",
    });
    await expect(ordersService.updateStatus("o1", "READY")).resolves.toEqual({
      id: "o1",
    });
    await ordersService.updateTicketStatus("t1", "PREPARING");
    expect(api.patch).toHaveBeenCalledWith("/kitchen-tickets/t1/status", {
      status: "PREPARING",
    });
  });
});
