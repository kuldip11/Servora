export type PaymentMethod = "CASH" | "CARD" | "UPI" | "RAZORPAY" | "STRIPE";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface Bill {
  id: string;
  orderId: string;
  splitLabel: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  serviceChargeAmount: number;
  roundingAdjustment: number;
  totalAmount: number;
  gstNumber: string | null;
  payments: Payment[];
  createdAt: string;
  itemAssignments?: Array<{
    id: string;
    billId: string;
    orderItemId: string;
    allocationRatio?: number | string;
    orderItem?: {
      menuItemId?: string | null;
      menuItemName: string;
      quantity: number;
      taxMode?: "INCLUSIVE" | "EXCLUSIVE";
      comboId?: string | null;
      comboGroupId?: string | null;
      order?: { id: string; table?: { name: string } | null };
    };
  }>;
}

export interface Payment {
  id: string;
  orderId: string;
  billId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  processedBy: string;
  createdAt: string;
}
