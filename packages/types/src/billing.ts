export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'RAZORPAY'
  | 'STRIPE';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface Bill {
  id: string;
  orderId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  gstNumber: string | null;
  payments: Payment[];
  createdAt: string;
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