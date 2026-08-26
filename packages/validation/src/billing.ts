import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["CASH", "CARD", "UPI", "RAZORPAY", "STRIPE"]),
  amount: z.number().min(0.01),
  reference: z.string().optional(),
});

export const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().min(0.01),
  reason: z.string().min(1).max(500),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
