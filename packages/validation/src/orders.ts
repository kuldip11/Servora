import { z } from "zod";

export const createOrderSchema = z.object({
  type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"]),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerGroupId: z.string().uuid().optional(),
  billingMode: z.enum(["LINE_ITEMS", "PER_COVER"]).optional(),
  coverCount: z.number().int().min(1).optional(),
  perCoverPriceRuleId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().min(1).max(50).optional(),
  promotionIds: z.array(z.string().uuid()).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(999),
        weightQuantity: z.number().positive().optional(),
        manualPrice: z.number().min(0).optional(),
        chefNotes: z.string().max(200).optional(),
        seatLabel: z.string().max(50).optional(),
        courseNumber: z.number().int().min(1).max(20).optional(),
        selectedOptions: z
          .array(
            z.object({
              optionId: z.string().uuid(),
              quantity: z.number().int().min(1).optional(),
              zoneLabel: z.string().min(1).max(30).optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  combos: z.array(z.object({
    comboId: z.string().uuid(),
    quantity: z.number().int().min(1).max(999).optional(),
    courseNumber: z.number().int().min(1).max(20).optional(),
    selections: z.array(z.object({ slotId: z.string().uuid(), optionIds: z.array(z.string().uuid()) })),
  })).optional(),
})
  .refine((value) => (value.items?.length ?? 0) + (value.combos?.length ?? 0) > 0, { message: "Order requires at least one item or combo" })
  .refine(
    (value) =>
      value.billingMode === "PER_COVER"
        ? value.coverCount !== undefined && value.perCoverPriceRuleId !== undefined
        : value.coverCount === undefined && value.perCoverPriceRuleId === undefined,
    { message: "PER_COVER orders require coverCount and perCoverPriceRuleId; LINE_ITEMS orders must omit them" },
  );

export const updateOrderStatusSchema = z.object({
  status: z.enum(["OPEN", "BILL_REQUESTED", "PAID", "CLOSED", "CANCELLED"]),
  reason: z.string().max(500).optional(),
});

export const addOrderItemSchema = z.object({
  notes: z.string().max(500).optional(),
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
  weightQuantity: z.number().positive().optional(),
  manualPrice: z.number().min(0).optional(),
  chefNotes: z.string().max(200).optional(),
  seatLabel: z.string().max(50).optional(),
  courseNumber: z.number().int().min(1).max(20).optional(),
  selectedOptions: z
    .array(
      z.object({
        optionId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
        zoneLabel: z.string().min(1).max(30).optional(),
      }),
    )
    .optional(),
});

const addOrderComboSchema = z.object({
  comboId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999).optional(),
  courseNumber: z.number().int().min(1).max(20).optional(),
  selections: z.array(z.object({
    slotId: z.string().uuid(),
    optionIds: z.array(z.string().uuid()),
  })),
});

export const addOrderItemsSchema = z.object({
  notes: z.string().max(500).optional(),
  couponCode: z.string().min(1).max(50).optional(),
  promotionIds: z.array(z.string().uuid()).optional(),
  items: z.array(addOrderItemSchema.omit({ notes: true })).optional(),
  combos: z.array(addOrderComboSchema).optional(),
}).refine(
  (value) => (value.items?.length ?? 0) + (value.combos?.length ?? 0) > 0,
  { message: "Order requires at least one item or combo" },
);

export const itemCustomizationSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
  weightQuantity: z.number().positive().optional(),
  manualPrice: z.number().min(0).optional(),
  chefNotes: z.string().max(200),
  selectedOptions: z.array(
    z.object({
      optionId: z.string().uuid(),
      quantity: z.number().int().min(1).max(999),
      zoneLabel: z.string().min(1).max(30).optional(),
    }),
  ),
});

export const updateKitchenTicketStatusSchema = z.object({
  status: z.enum(["HELD", "FIRED", "PREPARING", "READY", "SERVED"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateKitchenTicketStatusInput = z.infer<typeof updateKitchenTicketStatusSchema>;
