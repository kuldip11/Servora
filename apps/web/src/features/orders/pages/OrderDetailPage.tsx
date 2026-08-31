import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Clock, MapPin, Plus, CheckCircle2, RotateCcw } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Spinner,
  StatusBadge,
  Page,
  PageHeader,
  Breadcrumbs,
  Grid,
  Modal,
  Input,
} from "@pos/ui";
import { formatCurrency, formatTime } from "../../../shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "../../../shared/utils/order-status";
import { useOrder } from "../hooks/useOrder";
import { useUpdateOrderStatus } from "../hooks/useUpdateOrderStatus";
import { useUpdateTicketStatus } from "../hooks/useUpdateTicketStatus";
import { useVoidOrderItem } from "../hooks/useVoidOrderItem";
import { useCompOrderItem } from "../hooks/useCompOrderItem";
import { usePermissions } from "../../../shared/auth/permissions";
import { useCancellationReasons } from "../hooks/useCancellationReasons";
import { ReasonDialog } from "../components/ReasonDialog";
import { ManagerApprovalDialog, type ManagerApprovalRequest } from "../components/ManagerApprovalDialog";
import { extractApiError } from "../../../shared/lib/api-client";
import { AddItemsModal } from "../components/AddItemsModal";
import { OrderExplainDialog } from "../components/OrderExplainDialog";
import { useRefireOrderItem } from "../hooks/useRefireOrderItem";
import { useSetOrderItemSeatShares } from "../hooks/useSetOrderItemSeatShares";

/**
 * Design-system Phase 10 (the design-system contract), Sprint AD-8.
 * Second of the 3 higher-risk Admin pages the plan itself flagged as
 * left for last (`README.md`'s "Next up" note after Sprint AD-7).
 * `OrdersPage` was already done as Phase 7's own exit criterion, so
 * this sprint covers `OrderDetailPage` plus the `ItemCustomizerModal`
 * overlay rewrite it renders through `AddItemsModal` — see that file's
 * own header comment for the overlay-specific detail.
 *
 * **Header, a real change not a mechanical one:** the old hand-rolled
 * `ArrowLeft` "Back" link is replaced with `Breadcrumbs` (Phase 6) in
 * `PageHeader`'s `eyebrow` slot — `PageHeader`'s own doc comment
 * anticipates exactly this composition, and no earlier Sprint AD page
 * needed a back-link so there was no established pattern to preserve
 * instead. Worth a look in a real browser alongside every other
 * "flagged, not silently absorbed" delta in this sprint.
 */

// Tab lifecycle — billing state only. Kitchen prep state lives on kitchen
// tickets and is shown/managed per-ticket below instead.
const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  OPEN: [{ label: "Cancel Order", next: "CANCELLED" }],
  BILL_REQUESTED: [{ label: "Mark Paid", next: "PAID" }],
  PAID: [{ label: "Close Order", next: "CLOSED" }],
  CLOSED: [],
  CANCELLED: [],
};

// Same STATUS_TONE map OrdersPage's Phase 7 migration already
// established (the design-system guidance "Phase 10 detail", Sprint
// AD-7's file-level comment), reused rather than re-litigated so the two
// places in Admin that render an order-status badge stay in agreement.
// PAID intentionally omitted — no semantic tone maps onto brand violet,
// same flagged-not-resolved product decision as OrdersPage.
const STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

const TICKET_STATUS_TONE: Record<
  string,
  "info" | "warning" | "success" | "neutral"
> = {
  HELD: "neutral",
  FIRED: "info",
  PREPARING: "warning",
  READY: "success",
  SERVED: "neutral",
};

function OrderStatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status];
  if (!tone) {
    // PAID — see STATUS_TONE's doc comment above.
    return (
      <Badge className={getOrderStatusColor(status)}>
        {getOrderStatusLabel(status)}
      </Badge>
    );
  }
  return <StatusBadge label={getOrderStatusLabel(status)} tone={tone} />;
}

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const [showAddItems, setShowAddItems] = useState(false);
  const [reasonAction, setReasonAction] = useState<
    { type: "cancel" } | { type: "void" | "comp"; itemId: string } | null
  >(null);
  const [pendingApproval, setPendingApproval] = useState<ManagerApprovalRequest | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: order, isLoading } = useOrder(orderId);
  const updateStatusMutation = useUpdateOrderStatus(orderId);
  const updateTicketMutation = useUpdateTicketStatus(orderId);
  const refireItemMutation = useRefireOrderItem(orderId);
  const [refireItemId, setRefireItemId] = useState<string | null>(null);
  const [refireReason, setRefireReason] = useState("");
  const [zeroPriceReplacement, setZeroPriceReplacement] = useState(true);
  const [seatShareItemId, setSeatShareItemId] = useState<string | null>(null);
  const [seatShares, setSeatShares] = useState<Array<{ seatLabel: string; shareRatio: string }>>([
    { seatLabel: "1", shareRatio: "0.5" },
    { seatLabel: "2", shareRatio: "0.5" },
  ]);
  const setSeatSharesMutation = useSetOrderItemSeatShares(orderId);
  const voidItemMutation = useVoidOrderItem(orderId);
  const compItemMutation = useCompOrderItem(orderId);
  const { has } = usePermissions();
  const { data: cancellationReasons = [] } = useCancellationReasons();

  const submitLineAdjustment = (request: ManagerApprovalRequest, approvalToken?: string) => {
    const mutation = request.action === "void" ? voidItemMutation : compItemMutation;
    mutation.mutate(
      { itemId: request.itemId, ...request.reason, ...(approvalToken ? { approvalToken } : {}) },
      {
        onSuccess: () => {
          setReasonAction(null);
          setPendingApproval(null);
        },
        onError: (error) => {
          if (extractApiError(error).includes("Manager approval required")) {
            setReasonAction(null);
            setPendingApproval(request);
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">Order not found</p>
      </div>
    );
  }

  const tickets = order.kitchenTickets ?? [];
  const replacementByOriginalId = new Map<string, { id: string }>(
    (order.items ?? []).flatMap((item) => item.refiresOrderItemId ? [[item.refiresOrderItemId, { id: item.id }] as const] : []),
  );
  const allTicketsServed =
    tickets.length > 0 && tickets.every((t) => t.status === "SERVED");

  const transitions = [...(STATUS_TRANSITIONS[order.status] ?? [])];
  // Request Bill only shows once every round has actually been served.
  if (order.status === "OPEN" && allTicketsServed) {
    transitions.unshift({ label: "Request Bill", next: "BILL_REQUESTED" });
  }
  const canAddItems = order.status === "OPEN";
  const total = parseFloat(String(order.totalAmount));

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Breadcrumbs
            items={[
              {
                label: "Orders",
                href: "/orders",
                as: Link,
                linkProps: { to: "/orders" },
              },
              { label: `Order #${order.id.slice(-8).toUpperCase()}` },
            ]}
          />
        }
        title={`Order #${order.id.slice(-8).toUpperCase()}`}
        description={formatTime(order.createdAt)}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowExplanation(true)}>
              Explain
            </Button>
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      {order.status === "OPEN" && !allTicketsServed && tickets.length > 0 && (
        <div className="bg-warning-surface border border-warning/20 rounded-lg px-4 py-2.5 text-sm text-warning">
          All rounds need to be served before the bill can be requested.
        </div>
      )}

      <Grid columns={{ base: 1, lg: 3 }} gap="lg">
        {/* Order items, grouped by kitchen ticket (round) */}
        <div className="lg:col-span-2 space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-text-primary">
                  {ticket.course ? `Course ${ticket.course.courseNumber}${ticket.course.name ? ` · ${ticket.course.name}` : ""}` : `Round ${ticket.ticketNumber}`}
                </h2>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={
                      ticket.status.charAt(0) +
                      ticket.status.slice(1).toLowerCase()
                    }
                    tone={TICKET_STATUS_TONE[ticket.status] ?? "neutral"}
                  />
                  {ticket.status === "HELD" && (
                    <Button variant="primary" size="sm" loading={updateTicketMutation.isPending} onClick={() => updateTicketMutation.mutate({ ticketId: ticket.id, status: "FIRED" })}>
                      Fire Course Now
                    </Button>
                  )}
                  {ticket.status === "READY" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={updateTicketMutation.isPending}
                      onClick={() =>
                        updateTicketMutation.mutate({
                          ticketId: ticket.id,
                          status: "SERVED",
                        })
                      }
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Served
                    </Button>
                  )}
                </div>
              </div>

              {ticket.notes && (
                <p className="text-xs text-warning bg-warning-surface rounded px-2 py-1.5 mb-3">
                  📝 {ticket.notes}
                </p>
              )}

              <div className="space-y-3">
                {ticket.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between py-2 border-b border-divider last:border-0 ${item.itemStatus === "VOIDED" ? "opacity-60 line-through" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {item.quantity}× {item.menuItemName}
                        {item.variantName && (
                          <span className="text-text-secondary font-normal">
                            {" "}
                            · {item.variantName}
                          </span>
                        )}
                      </p>
                      {item.chefNotes && (
                        <p className="text-xs text-warning mt-0.5">
                          📝 {item.chefNotes}
                        </p>
                      )}
                      {item.station?.name && (
                        <p className="text-xs text-text-secondary">
                          Prepared at {item.station.name}
                        </p>
                      )}
                      {item.itemStatus === "VOIDED" && (
                        <p className="text-xs text-danger no-underline">
                          Voided{item.voidedReason ? ` · ${item.voidedReason}` : ""}
                        </p>
                      )}
                      {item.itemStatus === "REFIRED" && (
                        <p className="text-xs font-semibold text-warning">
                          Refired → replacement #{replacementByOriginalId.get(item.id)?.id.slice(-6) ?? "pending"}
                          {item.refireReason ? ` · ${item.refireReason}` : ""}
                          {item.compedAt ? " · original comped" : ""}
                        </p>
                      )}
                      {item.refiresOrderItemId && (
                        <p className="text-xs font-semibold text-warning">REFIRE replacement of #{item.refiresOrderItemId.slice(-6)}</p>
                      )}
                      {item.itemStatus === "COMPED" && (
                        <p className="text-xs text-success">
                          Comped{item.compedReason ? ` · ${item.compedReason}` : ""}
                        </p>
                      )}
                      {item.modifiers?.map((m) => (
                        <p
                          key={m.modifierId}
                          className="text-xs text-text-secondary"
                        >
                          + {m.name}
                          {m.quantity > 1 ? ` ×${m.quantity}` : ""}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(parseFloat(String(item.subtotal)))}
                      </p>
                      {order.status === "OPEN" && item.itemStatus === "ACTIVE" && item.menuItemId && has("orders:update") && (
                        <Button size="sm" variant="secondary" loading={refireItemMutation.isPending} onClick={() => { setRefireItemId(item.id); setRefireReason(""); setZeroPriceReplacement(true); }}>
                          <RotateCcw className="w-3.5 h-3.5" /> Refire
                        </Button>
                      )}
                      {order.status === "OPEN" && item.itemStatus === "ACTIVE" && has("billing:create") && (
                        <Button size="sm" variant="secondary" onClick={() => {
                          setSeatShareItemId(item.id);
                          setSeatShares(item.seatShares?.length
                            ? item.seatShares.map((share) => ({ seatLabel: share.seatLabel, shareRatio: String(share.shareRatio) }))
                            : [{ seatLabel: "1", shareRatio: "0.5" }, { seatLabel: "2", shareRatio: "0.5" }]);
                        }}>
                          Split across seats
                        </Button>
                      )}
                      {order.status === "OPEN" && item.itemStatus === "ACTIVE" && has("orders:void") && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={voidItemMutation.isPending}
                          onClick={() => setReasonAction({ type: "void", itemId: item.id })}
                        >
                          Void
                        </Button>
                      )}
                      {order.status === "OPEN" && item.itemStatus === "ACTIVE" && has("orders:comp") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={compItemMutation.isPending}
                          onClick={() => setReasonAction({ type: "comp", itemId: item.id })}
                        >
                          Comp
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(parseFloat(String(order.subtotal)))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>{order.items?.some((item) => item.taxMode === "INCLUSIVE") ? (order.items?.some((item) => item.taxMode === "EXCLUSIVE") ? "Tax (mixed included/exclusive)" : "Tax included") : "Tax"}</span>
                <span>{formatCurrency(parseFloat(String(order.taxAmount)))}</span>
              </div>
              {parseFloat(String(order.serviceChargeAmount ?? 0)) > 0 && (
                <div className="flex justify-between text-sm text-text-secondary"><span>Service charge</span><span>{formatCurrency(parseFloat(String(order.serviceChargeAmount)))}</span></div>
              )}
              {Math.abs(parseFloat(String(order.roundingAdjustment ?? 0))) >= 0.005 && (
                <div className="flex justify-between text-sm text-text-secondary"><span>Rounding</span><span>{formatCurrency(parseFloat(String(order.roundingAdjustment)))}</span></div>
              )}
              {parseFloat(String(order.discountAmount)) > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>
                    -{formatCurrency(parseFloat(String(order.discountAmount)))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </Card>

          {/* Status history — tab lifecycle only (OPEN/BILL_REQUESTED/PAID/CLOSED/CANCELLED) */}
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">
              Status History
            </h2>
            <div className="space-y-2">
              {order.statusHistory?.map((h) => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-text-disabled flex-shrink-0" />
                  <span className="text-text-secondary">
                    {formatTime(h.changedAt)}
                  </span>
                  <OrderStatusBadge status={h.newStatus} />
                  {h.reason && (
                    <span className="text-text-disabled text-xs">
                      · {h.reason}
                    </span>
                  )}
                  {h.cancellationReason?.label && (
                    <span className="text-text-disabled text-xs">
                      · {h.cancellationReason.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-3">
              Order Info
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-text-disabled" />
                <span className="text-text-secondary">
                  Type:{" "}
                  <span className="font-medium text-text-primary">
                    {order.type?.replace("_", " ")}
                  </span>
                </span>
              </div>
              {order.table && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-text-disabled" />
                  <span className="text-text-secondary">
                    Table:{" "}
                    <span className="font-medium text-text-primary">
                      {order.table.name}
                    </span>
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="text-sm">
                  <p className="text-text-secondary text-xs mb-1">Notes</p>
                  <p className="text-text-primary bg-surface-secondary rounded p-2 text-xs">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          {(transitions.length > 0 || canAddItems) && (
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-3">
                Actions
              </h2>
              <div className="space-y-2">
                {canAddItems && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowAddItems(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add More Items
                  </Button>
                )}
                {transitions.map((t) => (
                  <Button
                    key={t.next}
                    variant={t.next === "CANCELLED" ? "danger" : "primary"}
                    className="w-full"
                    loading={updateStatusMutation.isPending}
                    onClick={() => t.next === "CANCELLED"
                      ? setReasonAction({ type: "cancel" })
                      : updateStatusMutation.mutate({ status: t.next })}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Grid>

      {showAddItems && (
        <AddItemsModal
          orderId={orderId}
          onClose={() => setShowAddItems(false)}
        />
      )}
      <Modal open={seatShareItemId !== null} onClose={() => setSeatShareItemId(null)} title="Split item across seats">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Ratios must total exactly 1.00. Use equal shares or enter an intentional unequal split.</p>
          {seatShares.map((share, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Input label={`Seat ${index + 1}`} value={share.seatLabel} onChange={(event) => setSeatShares((current) => current.map((value, valueIndex) => valueIndex === index ? { ...value, seatLabel: event.target.value } : value))} />
              <Input label="Share ratio" type="number" min="0.01" max="1" step="0.01" value={share.shareRatio} onChange={(event) => setSeatShares((current) => current.map((value, valueIndex) => valueIndex === index ? { ...value, shareRatio: event.target.value } : value))} />
              {seatShares.length > 2 && <Button type="button" variant="secondary" onClick={() => setSeatShares((current) => current.filter((_, valueIndex) => valueIndex !== index))}>Remove</Button>}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button type="button" variant="secondary" onClick={() => setSeatShares((current) => [...current, { seatLabel: String(current.length + 1), shareRatio: "0" }])}>+ Seat</Button>
            <span className={`text-sm font-medium ${Math.abs(seatShares.reduce((sum, share) => sum + Number(share.shareRatio || 0), 0) - 1) < 0.000001 ? "text-success" : "text-danger"}`}>Total {seatShares.reduce((sum, share) => sum + Number(share.shareRatio || 0), 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSeatShareItemId(null)}>Cancel</Button><Button type="button" loading={setSeatSharesMutation.isPending} disabled={!seatShareItemId || seatShares.some((share) => !share.seatLabel.trim() || Number(share.shareRatio) <= 0) || Math.abs(seatShares.reduce((sum, share) => sum + Number(share.shareRatio || 0), 0) - 1) >= 0.000001} onClick={() => seatShareItemId && setSeatSharesMutation.mutate({ itemId: seatShareItemId, shares: seatShares.map((share) => ({ seatLabel: share.seatLabel.trim(), shareRatio: Number(share.shareRatio) })) }, { onSuccess: () => setSeatShareItemId(null) })}>Save split</Button></div>
        </div>
      </Modal>
      <Modal open={refireItemId !== null} onClose={() => setRefireItemId(null)} title="Refire item">
        <div className="space-y-4">
          <Input label="Reason" value={refireReason} onChange={(event) => setRefireReason(event.target.value)} placeholder="Kitchen error / remake" />
          <label className="flex items-center gap-2 text-sm text-text-primary"><input type="checkbox" checked={zeroPriceReplacement} onChange={(event) => setZeroPriceReplacement(event.target.checked)} /> Also comp original (kitchen error; bill replacement once)</label>
          <p className="text-xs text-text-secondary">Turn this off for a legitimate reorder; both the original and refire are billed.</p>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setRefireItemId(null)}>Cancel</Button><Button disabled={!refireReason.trim()} loading={refireItemMutation.isPending} onClick={() => refireItemId && refireItemMutation.mutate({ itemId: refireItemId, reason: refireReason.trim(), alsoCompOriginal: zeroPriceReplacement }, { onSuccess: () => setRefireItemId(null) })}>Refire</Button></div>
        </div>
      </Modal>
      <OrderExplainDialog open={showExplanation} orderId={orderId} onClose={() => setShowExplanation(false)} />

      <ManagerApprovalDialog
        open={pendingApproval !== null}
        orderId={orderId}
        request={pendingApproval}
        onClose={() => setPendingApproval(null)}
        onApproved={(approvalToken) => pendingApproval && submitLineAdjustment(pendingApproval, approvalToken)}
      />
      <ReasonDialog
        open={reasonAction !== null}
        title={reasonAction?.type === "cancel" ? "Cancel order" : reasonAction?.type === "comp" ? "Comp item" : "Void item"}
        reasons={cancellationReasons}
        loading={updateStatusMutation.isPending || voidItemMutation.isPending || compItemMutation.isPending}
        onClose={() => setReasonAction(null)}
        onSubmit={(reason) => {
          if (!reasonAction) return;
          if (reasonAction.type === "cancel") {
            updateStatusMutation.mutate({ status: "CANCELLED", ...reason }, { onSuccess: () => setReasonAction(null) });
          } else {
            submitLineAdjustment({ action: reasonAction.type, itemId: reasonAction.itemId, reason });
          }
        }}
      />
    </Page>
  );
}
