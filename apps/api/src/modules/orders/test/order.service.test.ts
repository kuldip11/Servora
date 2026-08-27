import { beforeEach, describe, expect, it, vi } from "vitest";
const { findById, findMany, create, updateStatus, fireNewTicket } = vi.hoisted(
  () => ({
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    fireNewTicket: vi.fn(),
  }),
);
const { branchFind, tableFind, tableOpen, tableUpdate } = vi.hoisted(() => ({
  branchFind: vi.fn(),
  tableFind: vi.fn(),
  tableOpen: vi.fn(),
  tableUpdate: vi.fn(),
}));
const {
  availabilityFind,
  effective,
  allServed,
  inventoryImpact,
  deduct,
  publish,
} = vi.hoisted(() => ({
  availabilityFind: vi.fn(),
  effective: vi.fn(),
  allServed: vi.fn(),
  inventoryImpact: vi.fn(),
  deduct: vi.fn(),
  publish: vi.fn(),
}));
vi.mock("../order.repository", () => ({
  orderRepository: { findById, findMany, create, updateStatus, fireNewTicket },
}));
vi.mock("../../branches/branch.repository", () => ({
  branchRepository: { findById: branchFind },
}));
vi.mock("../../tables/table.repository", () => ({
  tableRepository: {
    findById: tableFind,
    hasOpenOrders: tableOpen,
    update: tableUpdate,
  },
}));
vi.mock("../../menu/availability/availability.repository", () => ({
  availabilityRepository: { findByIds: availabilityFind },
}));
vi.mock("../../menu/availability/availability.service", () => ({
  availabilityService: { getEffectiveItem: effective },
}));
vi.mock("../../kitchen-tickets/ticket.repository", () => ({
  ticketRepository: { allServed },
}));
vi.mock("../../inventory/inventory.service", () => ({
  inventoryService: {
    getOrderDeductions: inventoryImpact,
    deductForOrderItems: deduct,
  },
}));
vi.mock("../../../lib/event-bus", () => ({ eventBus: { publish } }));
import { orderService } from "../order.service";

const auth = (overrides: any = {}) => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [
    "orders:read",
    "orders:create",
    "orders:update",
    "orders:update_status",
    "orders:cancel",
  ],
  ...overrides,
});
const menu = {
  id: "m1",
  name: "Pizza",
  isAvailable: true,
  basePrice: "10",
  taxRate: "5",
  variants: [],
  modifierGroupLinks: [],
};
const order = { id: "o1", branchId: "b1", tableId: null, status: "OPEN" };
beforeEach(() => {
  vi.clearAllMocks();
  branchFind.mockResolvedValue({
    id: "b1",
    dineInEnabled: true,
    takeawayEnabled: true,
    deliveryEnabled: true,
    onlineEnabled: true,
  });
  availabilityFind.mockResolvedValue([menu]);
  effective.mockResolvedValue({ isHidden: false, effectiveStatus: "ACTIVE" });
});

describe("order service", () => {
  it("enforces list/get authorization and resource scope", async () => {
    findMany.mockResolvedValue([{ id: "o1" }]);
    await expect(
      orderService.list(auth(), { status: "OPEN" }),
    ).resolves.toEqual([{ id: "o1" }]);
    findById.mockResolvedValue(undefined);
    await expect(orderService.getById(auth(), "o1")).rejects.toThrow(
      "Order with id o1 not found",
    );
    findById.mockResolvedValue(order);
    await expect(
      orderService.getById(auth({ branchId: "b2" }), "o1"),
    ).rejects.toThrow("Order branch access denied");
  });
  it("validates branch/type/table before creating an order", async () => {
    await expect(
      orderService.create(auth({ branchId: null }), {
        type: "TAKEAWAY",
        items: [],
      }),
    ).rejects.toThrow("specific branch");
    branchFind.mockResolvedValue({ id: "b1", takeawayEnabled: false });
    await expect(
      orderService.create(auth(), { type: "TAKEAWAY", items: [] }),
    ).rejects.toThrow("not enabled");
    branchFind.mockResolvedValue({ id: "b1", dineInEnabled: true });
    await expect(
      orderService.create(auth(), { type: "DINE_IN", items: [] }),
    ).rejects.toThrow("table");
    tableFind.mockResolvedValue({ id: "t1", branchId: "b2" });
    await expect(
      orderService.create(auth(), {
        type: "DINE_IN",
        tableId: "t1",
        items: [],
      }),
    ).rejects.toThrow("Table not found");
  });
  it("creates an order, publishes events, and treats inventory deduction as best-effort", async () => {
    create.mockResolvedValue({ id: "o1" });
    findById.mockResolvedValue({
      ...order,
      id: "o1",
      kitchenTickets: [{ id: "kt1", branchId: "b1", status: "FIRED" }],
    });
    deduct.mockRejectedValue(new Error("inventory unavailable"));
    await expect(
      orderService.create(auth(), {
        type: "TAKEAWAY",
        items: [{ menuItemId: "m1", quantity: 1 }],
      }),
    ).resolves.toMatchObject({ id: "o1" });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "order.created" }),
      "t1",
      "b1",
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "kitchen.ticket.created" }),
      "t1",
      "b1",
    );
    expect(deduct).toHaveBeenCalled();
  });
  it("requires served tickets before billing and maps status changes", async () => {
    findById.mockResolvedValue(order);
    allServed.mockResolvedValue(false);
    await expect(
      orderService.updateStatus(auth(), "o1", "BILL_REQUESTED"),
    ).rejects.toThrow("All kitchen tickets must be served");
    allServed.mockResolvedValue(true);
    updateStatus.mockResolvedValue({ ...order, status: "BILL_REQUESTED" });
    findById
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, status: "BILL_REQUESTED" });
    await expect(
      orderService.updateStatus(auth(), "o1", "BILL_REQUESTED"),
    ).resolves.toMatchObject({ status: "BILL_REQUESTED" });
  });
  it("only fires additional tickets from OPEN orders", async () => {
    findById.mockResolvedValue({ ...order, status: "PAID" });
    await expect(
      orderService.fireTicket(auth(), "o1", { items: [] }),
    ).rejects.toThrow("Cannot fire a new ticket while the tab is PAID");
    findById.mockResolvedValue({ ...order, status: "OPEN" });
    fireNewTicket.mockResolvedValue({ id: "t2" });
    await expect(
      orderService.fireTicket(auth(), "o1", {
        items: [{ menuItemId: "m1", quantity: 1 }],
      }),
    ).resolves.toMatchObject({ id: "o1" });
    expect(fireNewTicket).toHaveBeenCalled();
  });
});
