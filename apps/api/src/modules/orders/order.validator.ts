import { t } from "elysia";

const orderItemInput = t.Object({
  menuItemId: t.String(),
  variantId: t.Optional(t.String()),
  quantity: t.Number({ minimum: 1 }),
  chefNotes: t.Optional(t.String()),
  selectedOptions: t.Optional(
    t.Array(
      t.Object({
        optionId: t.String(),
        quantity: t.Optional(t.Number({ minimum: 1 })),
      }),
    ),
  ),
});

export const createOrderBody = t.Object({
  type: t.Union([
    t.Literal("DINE_IN"),
    t.Literal("TAKEAWAY"),
    t.Literal("DELIVERY"),
    t.Literal("ONLINE"),
  ]),
  tableId: t.Optional(t.String()),
  notes: t.Optional(t.String()),
  items: t.Array(orderItemInput),
});

export const updateOrderStatusBody = t.Object({
  status: t.Union([
    t.Literal("OPEN"),
    t.Literal("BILL_REQUESTED"),
    t.Literal("PAID"),
    t.Literal("CLOSED"),
    t.Literal("CANCELLED"),
  ]),
  reason: t.Optional(t.String()),
});

export const fireTicketBody = t.Object({
  notes: t.Optional(t.String()),
  items: t.Array(orderItemInput),
});

export const orderIdParams = t.Object({
  id: t.String(),
});

export const orderListQuery = t.Object({
  status: t.Optional(t.String()),
  type: t.Optional(t.String()),
});
