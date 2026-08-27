import { useState } from "react";
import { Receipt, CreditCard } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Page,
  PageHeader,
  Select,
  Table,
  type Column,
} from "@pos/ui";
import { formatCurrency, formatTime } from "../../../shared/utils/format";
import { useOrders } from "../../orders/hooks/useOrders";
import { useCollectPayment } from "../hooks/useCollectPayment";
import type { Order } from "@pos/types";
import { createPaymentSchema } from "@pos/validation";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "STRIPE", label: "Stripe" },
];

export function BillingPage() {
  const [payModal, setPayModal] = useState<Order | null>(null);
  const [payForm, setPayForm] = useState({
    method: "CASH",
    amount: "",
    reference: "",
  });
  const [validationError, setValidationError] = useState("");

  const { data: billableOrders, isLoading } = useOrders({
    status: "BILL_REQUESTED",
  });
  const payMutation = useCollectPayment();

  function openPayModal(order: Order) {
    setPayModal(order);
    setValidationError("");
    const paid = (order.payments ?? [])
      .filter((payment) => payment.status === "SUCCESS")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const due = Math.max(0, Number(order.totalAmount) - paid);
    setPayForm({
      method: "CASH",
      amount: due.toFixed(2),
      reference: "",
    });
  }

  function handleSubmit() {
    if (!payModal) return;
    const parsed = createPaymentSchema.safeParse({
      orderId: payModal.id,
      method: payForm.method,
      amount: Number(payForm.amount),
      ...(payForm.reference ? { reference: payForm.reference } : {}),
    });
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Please review the payment.",
      );
      return;
    }
    setValidationError("");
    payMutation.mutate(
      {
        orderId: payModal.id,
        input: {
          method: parsed.data.method,
          amount: parsed.data.amount,
          ...(parsed.data.reference
            ? { reference: parsed.data.reference }
            : {}),
        },
      },
      {
        onSuccess: () => {
          setPayModal(null);
          setPayForm({ method: "CASH", amount: "", reference: "" });
        },
      },
    );
  }

  // Sort matches what was actually sortable on any other Phase 10 page so far
  // (StaffPage/InventoryPage): the one or two columns a reasonable person
  // would actually want to reorder by, not every column. Total is the
  // natural default here (that's *why* someone's on this page — biggest
  // outstanding tab first); Time gives the other common ordering (oldest
  // bill request first). Order/Type/Items weren't sortable before and
  // aren't made sortable now.
  const columns: Column<Order>[] = [
    {
      id: "order",
      header: "Order",
      cell: (order) => (
        <span className="font-mono text-xs font-semibold text-text-secondary">
          #{order.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (order) => (
        <Badge variant="default">{order.type?.replace("_", " ")}</Badge>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: (order) => (
        <span className="text-text-secondary">
          {order.items?.length ?? 0} items
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      sortable: true,
      sortValue: (order) => parseFloat(String(order.totalAmount)),
      cell: (order) => (
        <span className="font-bold text-text-primary text-base">
          {formatCurrency(parseFloat(String(order.totalAmount)))}
        </span>
      ),
    },
    {
      id: "time",
      header: "Time",
      sortable: true,
      sortValue: (order) => new Date(order.createdAt).getTime(),
      cell: (order) => (
        <span className="text-text-secondary text-xs">
          {formatTime(order.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (order) => (
        <Button size="sm" onClick={() => openPayModal(order)}>
          <CreditCard className="w-3.5 h-3.5" />
          Collect Payment
        </Button>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Billing"
        description="Process payments for tabs where the bill has been requested"
      />

      <Card padding="none" className="overflow-hidden">
        <Table
          columns={columns}
          data={billableOrders ?? []}
          getRowId={(order) => order.id}
          loading={isLoading}
          emptyIcon={Receipt}
          emptyTitle="No pending payments"
          emptyDescription="Tabs will appear here once the waiter requests the bill."
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Collect Payment"
        size="sm"
      >
        {payModal && (
          <div className="space-y-4">
            <div className="bg-surface-secondary rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-1">
                Order #{payModal.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(
                  Math.max(
                    0,
                    Number(payModal.totalAmount) -
                      (payModal.payments ?? [])
                        .filter((payment) => payment.status === "SUCCESS")
                        .reduce((sum, payment) => sum + Number(payment.amount), 0),
                  ),
                )}
              </p>
              <p className="mt-1 text-xs text-text-secondary">Outstanding balance</p>
            </div>

            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={payForm.method}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, method: e.target.value }))
              }
            />
            <Input
              label="Amount"
              type="number"
              value={payForm.amount}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, amount: e.target.value }))
              }
              min="0"
              step="0.01"
            />
            {payForm.method !== "CASH" && (
              <Input
                label="Reference / Transaction ID"
                placeholder="Optional"
                value={payForm.reference}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, reference: e.target.value }))
                }
              />
            )}

            {validationError && (
              <p className="text-xs text-danger">{validationError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setPayModal(null)}>
                Cancel
              </Button>
              <Button loading={payMutation.isPending} onClick={handleSubmit}>
                Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
