import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Receipt, CreditCard, Scissors } from "lucide-react";
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
import type { Bill, Order } from "@pos/types";
import { createPaymentSchema } from "@pos/validation";
import { billingService } from "../services/billing.service";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { usePermissions } from "../../../shared/auth/permissions";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "STRIPE", label: "Stripe" },
];

type BillAssignment = NonNullable<Bill["itemAssignments"]>[number];

function buildItemBillMapping(
  items: NonNullable<Order["items"]>,
  ways: number,
  seeded: Record<string, number> = {},
) {
  const active = items.filter((item) => (item.itemStatus === "ACTIVE" || (item.itemStatus === "REFIRED" && !item.compedAt)));
  const groups = new Map<string, typeof active>();
  for (const item of active) {
    const key = item.comboGroupId ? `combo:${item.comboGroupId}` : `item:${item.id}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const mapping = { ...seeded };
  [...groups.values()].forEach((group, groupIndex) => {
    const seededBill = group.map((item) => seeded[item.id]).find((value) => value !== undefined);
    const billIndex = seededBill ?? (groupIndex % Math.max(1, ways));
    group.forEach((item) => { mapping[item.id] = billIndex; });
  });
  return mapping;
}

function updateItemBillMapping(
  current: Record<string, number>,
  items: NonNullable<Order["items"]>,
  itemId: string,
  billIndex: number,
) {
  const target = items.find((item) => item.id === itemId);
  if (!target?.comboGroupId) return { ...current, [itemId]: billIndex };
  const next = { ...current };
  items
    .filter((item) => item.comboGroupId === target.comboGroupId)
    .forEach((item) => { next[item.id] = billIndex; });
  return next;
}

function BillItemSummary({ assignments }: { assignments: BillAssignment[] }) {
  const rendered = new Set<string>();
  const rows: React.ReactNode[] = [];

  for (const assignment of assignments) {
    const item = assignment.orderItem;
    const comboGroupId = item?.comboGroupId ?? null;
    if (comboGroupId) {
      if (rendered.has(`combo:${comboGroupId}`)) continue;
      rendered.add(`combo:${comboGroupId}`);
      const group = assignments.filter((candidate) => candidate.orderItem?.comboGroupId === comboGroupId);
      const parent = group.find((candidate) => candidate.orderItem?.menuItemId == null);
      const children = group.filter((candidate) => candidate.orderItem?.menuItemId != null);
      rows.push(
        <div key={`combo:${comboGroupId}`} className="rounded-md bg-surface-secondary px-2 py-1.5">
          <p className="text-sm font-medium text-text-primary">
            {parent?.orderItem?.quantity ?? 1}× {parent?.orderItem?.menuItemName ?? "Combo"}
          </p>
          {children.length > 0 && (
            <div className="mt-1 space-y-0.5 border-l border-divider pl-2">
              {children.map((child) => (
                <p key={child.orderItemId} className="text-xs text-text-secondary">
                  {child.orderItem?.quantity ?? 1}× {child.orderItem?.menuItemName ?? "Item"}
                </p>
              ))}
            </div>
          )}
        </div>,
      );
      continue;
    }

    rows.push(
      <p key={assignment.orderItemId} className="text-sm text-text-primary">
        {item?.quantity ?? 1}× {item?.menuItemName ?? "Item"}
      </p>,
    );
  }

  return <div className="space-y-1.5">{rows}</div>;
}

export function BillingPage() {
  const [payModal, setPayModal] = useState<Order | null>(null);
  const [payForm, setPayForm] = useState({
    method: "CASH",
    amount: "",
    reference: "",
  });
  const [validationError, setValidationError] = useState("");
  const [splitModal, setSplitModal] = useState<Order | null>(null);
  const [splitWays, setSplitWays] = useState("2");
  const [splitMode, setSplitMode] = useState<"EVEN" | "ITEM" | "SEAT">("EVEN");
  const [sharedStrategy, setSharedStrategy] = useState<"EVEN_SPLIT" | "MANUAL">("EVEN_SPLIT");
  const [itemBills, setItemBills] = useState<Record<string, number>>({});
  const [selectedBillId, setSelectedBillId] = useState("");
  const { has } = usePermissions();

  const { data: billableOrders, isLoading } = useOrders({
    status: "BILL_REQUESTED",
  });
  const payMutation = useCollectPayment();
  const { data: orderBills = [] } = useQuery<Bill[]>({
    queryKey: ["billing", "order", payModal?.id],
    queryFn: () => billingService.getOrderBills(payModal!.id),
    enabled: !!payModal,
  });
  const splitMutation = useMutation({
    mutationFn: ({ orderId, ways, allocations }: { orderId: string; ways: number; allocations?: Array<{ label: string; orderItemIds: string[] }> }) => allocations ? billingService.splitOrderByItems(orderId, allocations) : billingService.splitOrder(orderId, ways),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["billing"] }); notifySuccess("Bill split successfully"); setSplitModal(null); },
    onError: (error) => notifyError(error, "Unable to split bill"),
  });
  const seatSplitMutation = useMutation({
    mutationFn: ({ orderId, strategy }: { orderId: string; strategy: "EVEN_SPLIT" | "MANUAL" }) => billingService.splitOrderBySeat(orderId, strategy),
    onSuccess: (result) => {
      if (result.status === "MANUAL_REQUIRED") {
        const mapping: Record<string, number> = {};
        result.allocations.forEach((allocation, index) => allocation.orderItemIds.forEach((id) => { mapping[id] = index; }));
        const sharedIds = new Set(result.sharedItemIds);
        const sharedItems = (splitModal?.items ?? []).filter((item) => sharedIds.has(item.id));
        setItemBills(buildItemBillMapping(sharedItems, result.allocations.length, mapping));
        setSplitWays(String(result.allocations.length)); setSplitMode("ITEM");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["billing"] }); notifySuccess("Bill split by seat"); setSplitModal(null);
    },
    onError: (error) => notifyError(error, "Unable to split by seat"),
  });

  function openPayModal(order: Order) {
    setPayModal(order);
    setValidationError("");
    setSelectedBillId("");
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
          ...(selectedBillId ? { billId: selectedBillId } : {}),
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
        <div className="flex justify-end gap-2">
          {has("billing:create") && <Button size="sm" variant="secondary" onClick={() => { setSplitModal(order); setItemBills(buildItemBillMapping(order.items ?? [], 2)); }}><Scissors className="w-3.5 h-3.5" />Split</Button>}
          <Button size="sm" onClick={() => openPayModal(order)}><CreditCard className="w-3.5 h-3.5" />Collect Payment</Button>
        </div>
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

      {                   }
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
                        .reduce(
                          (sum, payment) => sum + Number(payment.amount),
                          0,
                        ),
                  ),
                )}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Outstanding balance
              </p>
            </div>
            {selectedBillId && (() => {
              const selected = orderBills.find((bill) => bill.id === selectedBillId);
              if (!selected) return null;
              return <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatCurrency(Number(selected.subtotal))}</span></div>
                {Number(selected.discountAmount) > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatCurrency(Number(selected.discountAmount))}</span></div>}
                {(() => {
                  const modes = (selected.itemAssignments ?? [])
                    .map((assignment) => assignment.orderItem?.taxMode)
                    .filter((mode): mode is "INCLUSIVE" | "EXCLUSIVE" => !!mode);
                  const hasInclusive = modes.includes("INCLUSIVE");
                  const hasExclusive = modes.includes("EXCLUSIVE");
                  const label = hasInclusive
                    ? hasExclusive
                      ? "Tax (mixed included/exclusive)"
                      : "Tax included"
                    : "Tax";
                  return <div className="flex justify-between"><span className="text-text-secondary">{label}</span><span>{formatCurrency(Number(selected.taxAmount))}</span></div>;
                })()}
                {Number(selected.serviceChargeAmount ?? 0) > 0 && <div className="flex justify-between"><span className="text-text-secondary">Service charge</span><span>{formatCurrency(Number(selected.serviceChargeAmount))}</span></div>}
                {Math.abs(Number(selected.roundingAdjustment ?? 0)) >= 0.005 && <div className="flex justify-between"><span className="text-text-secondary">Rounding</span><span>{formatCurrency(Number(selected.roundingAdjustment))}</span></div>}
                <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{formatCurrency(Number(selected.totalAmount))}</span></div>
              </div>;
            })()}
            {selectedBillId && (() => {
              const selected = orderBills.find((bill) => bill.id === selectedBillId);
              const groups = new Map<string, NonNullable<Bill["itemAssignments"]>>();
              for (const assignment of selected?.itemAssignments ?? []) {
                const label = assignment.orderItem?.order?.table?.name ?? `Order ${assignment.orderItem?.order?.id.slice(-8) ?? ""}`;
                groups.set(label, [...(groups.get(label) ?? []), assignment]);
              }
              return groups.size > 0 ? <div className="rounded-lg border border-border p-3 space-y-3">
                {[...groups.entries()].map(([label, assignments]) => (
                  <div key={label}>
                    <p className="mb-1 text-xs font-semibold text-text-secondary">{label}</p>
                    <BillItemSummary assignments={assignments} />
                  </div>
                ))}
              </div> : null;
            })()}

            <Select
              label="Bill"
              options={[
                { value: "", label: orderBills.length > 1 ? "Select a bill" : "Whole order" },
                ...orderBills.map((bill, index) => ({ value: bill.id, label: `${bill.splitLabel ?? `Bill ${index + 1}`} — ${formatCurrency(Number(bill.totalAmount))}` })),
              ]}
              value={selectedBillId}
              onChange={(event) => {
                const id = event.target.value;
                setSelectedBillId(id);
                const bill = orderBills.find((candidate) => candidate.id === id);
                if (bill) {
                  const paid = (bill.payments ?? []).filter((payment) => payment.status === "SUCCESS").reduce((sum, payment) => sum + Number(payment.amount), 0);
                  setPayForm((form) => ({ ...form, amount: Math.max(0, Number(bill.totalAmount) - paid).toFixed(2) }));
                }
              }}
            />
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
      <Modal open={!!splitModal} onClose={() => setSplitModal(null)} title="Split bill" size="sm">
        <div className="space-y-4">
          <Select label="Split mode" value={splitMode} onChange={(event) => setSplitMode(event.target.value as "EVEN" | "ITEM" | "SEAT")} options={[{ value: "EVEN", label: "Even split" }, { value: "ITEM", label: "Assign items" }, { value: "SEAT", label: "By seat / diner" }]} />
          {splitMode !== "SEAT" && <Input label="Number of bills" type="number" min="2" max="20" value={splitWays} onChange={(event) => setSplitWays(event.target.value)} />}
          {splitMode === "SEAT" && <Select label="Shared items" value={sharedStrategy} onChange={(event) => setSharedStrategy(event.target.value as "EVEN_SPLIT" | "MANUAL")} options={[{ value: "EVEN_SPLIT", label: "Balance across seats" }, { value: "MANUAL", label: "Assign manually" }]} />}
          {splitMode === "ITEM" && <div className="max-h-72 space-y-2 overflow-y-auto">
            {(splitModal?.items ?? []).filter((item) => (item.itemStatus === "ACTIVE" || (item.itemStatus === "REFIRED" && !item.compedAt))).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2"><span className="text-sm">{item.quantity}× {item.menuItemName}</span><Select value={String(itemBills[item.id] ?? 0)} onChange={(event) => setItemBills((current) => updateItemBillMapping(current, splitModal?.items ?? [], item.id, Number(event.target.value)))} options={Array.from({ length: Number(splitWays) || 2 }, (_, index) => ({ value: String(index), label: `Bill ${index + 1}` }))} /></div>)}
          </div>}
          <p className="text-xs text-text-secondary">Every active item must belong to exactly one non-empty bill.</p>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setSplitModal(null)}>Cancel</Button><Button loading={splitMutation.isPending || seatSplitMutation.isPending} disabled={!splitModal || (splitMode !== "SEAT" && Number(splitWays) < 2)} onClick={() => {
            if (!splitModal) return;
            if (splitMode === "SEAT") { seatSplitMutation.mutate({ orderId: splitModal.id, strategy: sharedStrategy }); return; }
            const ways = Number(splitWays);
            const allocations = splitMode === "ITEM" ? Array.from({ length: ways }, (_, index) => ({ label: `Bill ${index + 1}`, orderItemIds: (splitModal.items ?? []).filter((item) => (item.itemStatus === "ACTIVE" || (item.itemStatus === "REFIRED" && !item.compedAt)) && (itemBills[item.id] ?? 0) === index).map((item) => item.id) })) : undefined;
            splitMutation.mutate({ orderId: splitModal.id, ways, ...(allocations ? { allocations } : {}) });
          }}>Split bill</Button></div>
        </div>
      </Modal>
    </Page>
  );
}
