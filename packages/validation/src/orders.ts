import { z } from 'zod';

export const createOrderSchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE']),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(999),
        chefNotes: z.string().max(200).optional(),
        selectedOptions: z
          .array(
            z.object({
              optionId: z.string().uuid(),
              quantity: z.number().int().min(1).optional(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'BILL_REQUESTED',
    'PAID',
    'CLOSED',
    'CANCELLED',
  ]),
  reason: z.string().max(500).optional(),
});

export const addOrderItemSchema = z.object({
  notes: z.string().max(500).optional(),
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
  chefNotes: z.string().max(200).optional(),
  selectedOptions: z
    .array(
      z.object({
        optionId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
      }),
    )
    .optional(),
});


export const addOrderItemsSchema = z.object({
  notes: z.string().max(500).optional(),
  items: z.array(addOrderItemSchema.omit({ notes: true })).min(1),
});

export const itemCustomizationSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
  chefNotes: z.string().max(200),
  selectedOptions: z.array(z.object({
    optionId: z.string().uuid(),
    quantity: z.number().int().min(1).max(999),
  })),
});

export const updateKitchenTicketStatusSchema = z.object({
  status: z.enum(['FIRED', 'PREPARING', 'READY', 'SERVED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>;