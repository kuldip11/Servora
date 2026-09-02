import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner, IconButton, Button, Input, Modal, SelectMenu } from "@pos/ui";
import { X } from "lucide-react";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { useUpdateOrderStatus } from "@/features/orders/hooks/useUpdateOrderStatus";
import { useUpdateTicketStatus } from "@/features/orders/hooks/useUpdateTicketStatus";
import { OrderDetailHeader } from "@/features/orders/components/OrderDetailHeader";
import { OrderBanners } from "@/features/orders/components/OrderBanners";
import { TicketGroup } from "@/features/orders/components/TicketGroup";
import { OrderTotals } from "@/features/orders/components/OrderTotals";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderActions } from "@/features/orders/components/OrderActions";
import { useLineAdjustments } from "@/features/orders/hooks/useLineAdjustments";
import { hasPermission } from "@/features/auth/storage";
import {
  fetchCancellationReasons,
  mergeOrders,
  refireOrderItem,
  refillOrderItem,
  setOrderItemSeatShares,
  splitOrderBill,
  splitOrderBillByItems,
  splitOrderBillBySeat,
} from "@/features/orders/api/orders";
import { fetchOrders } from "@/features/orders/api/orders";
import { ReasonDialog } from "@/features/orders/components/ReasonDialog";
import {
  ManagerApprovalDialog,
  type ManagerApprovalRequest,
} from "@/features/orders/components/ManagerApprovalDialog";
import { extractApiError } from "@pos/api-client";
import { useTransferTable } from "@/features/orders/hooks/useTransferTable";
import { useTables } from "@/features/menu/hooks/useTables";

interface Props {
  orderId: string;
  onBack: () => void;
  onAddItems: (orderId: string) => void;
}

export const OrderDetailPage = ({ orderId, onBack, onAddItems }: Props) => {
  const qc = useQueryClient();
  const { data: order, isLoading } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const updateTicketStatus = useUpdateTicketStatus();
  const lineAdjustments = useLineAdjustments(orderId);
  const refire = useMutation({
    mutationFn: ({
      itemId,
      reason,
      alsoCompOriginal,
    }: {
      itemId: string;
      reason: string;
      alsoCompOriginal: boolean;
    }) => refireOrderItem(orderId, itemId, reason, alsoCompOriginal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", orderId] }),
  });
  const refill = useMutation({
    mutationFn: (itemId: string) => refillOrderItem(orderId, itemId),
    onSuccess: () => qc.invalidateQueries(),
  });
  const saveSeatShares = useMutation({
    mutationFn: ({
      itemId,
      shares,
    }: {
      itemId: string;
      shares: Array<{ seatLabel: string; shareRatio: number }>;
    }) => setOrderItemSeatShares(orderId, itemId, shares),
    onSuccess: () => qc.invalidateQueries(),
  });
  const [seatShareItemId, setSeatShareItemId] = useState<string | null>(null);
  const [seatShares, setSeatShares] = useState<
    Array<{ seatLabel: string; shareRatio: string }>
  >([]);
  const [refireItemId, setRefireItemId] = useState<string | null>(null);
  const [refireReason, setRefireReason] = useState("");
  const [zeroPriceReplacement, setZeroPriceReplacement] = useState(true);
  const [reasonAction, setReasonAction] = useState<
    { type: "cancel" } | { type: "void" | "comp"; itemId: string } | null
  >(null);
  const [pendingApproval, setPendingApproval] =
    useState<ManagerApprovalRequest | null>(null);
  const { data: cancellationReasons = [] } = useQuery({
    queryKey: ["cancellation-reasons", "active"],
    queryFn: fetchCancellationReasons,
  });
  const transferTable = useTransferTable(orderId);
  const { data: tables = [] } = useTables(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [destinationTableId, setDestinationTableId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [showSplit, setShowSplit] = useState(false);
  const [splitWays, setSplitWays] = useState("2");
  const [splitMode, setSplitMode] = useState<"EVEN" | "ITEM" | "SEAT">("EVEN");
  const [sharedStrategy, setSharedStrategy] = useState<"EVEN_SPLIT" | "MANUAL">(
    "EVEN_SPLIT",
  );
  const [itemBills, setItemBills] = useState<Record<string, number>>({});
  const splitBill = useMutation({
    mutationFn: ({
      ways,
      allocations,
    }: {
      ways: number;
      allocations?: Array<{ label: string; orderItemIds: string[] }>;
    }) =>
      allocations
        ? splitOrderBillByItems(orderId, allocations)
        : splitOrderBill(orderId, ways),
  });
  const splitBySeat = useMutation({
    mutationFn: (strategy: "EVEN_SPLIT" | "MANUAL") =>
      splitOrderBillBySeat(orderId, strategy),
    onSuccess: (result) => {
      if (result.status === "MANUAL_REQUIRED") {
        const mapping: Record<string, number> = {};
        result.allocations.forEach((allocation, index) =>
          allocation.orderItemIds.forEach((id) => {
            mapping[id] = index;
          }),
        );
        result.sharedItemIds.forEach((id, index) => {
          mapping[id] = index % result.allocations.length;
        });
        setItemBills(mapping);
        setSplitWays(String(result.allocations.length));
        setSplitMode("ITEM");
      } else setShowSplit(false);
    },
  });
  const submitLineAdjustment = (
    request: ManagerApprovalRequest,
    approvalToken?: string,
  ) => {
    lineAdjustments.mutate(
      {
        itemId: request.itemId,
        action: request.action,
        ...request.reason,
        ...(approvalToken ? { approvalToken } : {}),
      },
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

  const [showMerge, setShowMerge] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const { data: mergeCandidates = [] } = useQuery({
    queryKey: ["orders", "merge-candidates"],
    queryFn: async () =>
      (await fetchOrders({ view: "ACTIVE", limit: 100 })).items,
    enabled: showMerge,
  });
  const mergeOrder = useMutation({
    mutationFn: (targetId: string) => mergeOrders(orderId, targetId),
  });

  const isTicketUpdating = useCallback(
    (ticketId: string) =>
      updateTicketStatus.isPending &&
      updateTicketStatus.variables?.ticketId === ticketId,
    [updateTicketStatus.isPending, updateTicketStatus.variables],
  );

  const handleMarkServed = useCallback(
    (ticketId: string) =>
      updateTicketStatus.mutate({ ticketId, status: "SERVED" }),
    [updateTicketStatus],
  );

  if (isLoading)
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          {}
          <IconButton
            icon={X}
            aria-label="Back to Orders"
            size="lg"
            className="w-9 h-9 rounded-xl bg-surface-secondary hover:bg-surface-secondary"
            onClick={onBack}
          />
          <h2 className="font-bold text-text-primary">Order Detail</h2>
        </div>
        <div className="flex justify-center py-12">
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    );

  if (!order) return null;

  const tickets = order.kitchenTickets ?? [];
  const replacementByOriginalId = new Map<string, { id: string }>(
    (order.items ?? []).flatMap((item) =>
      item.refiresOrderItemId
        ? [[item.refiresOrderItemId, { id: item.id }] as const]
        : [],
    ),
  );
  const readyTickets = tickets.filter((t) => t.status === "READY");
  const allTicketsServed =
    tickets.length > 0 && tickets.every((t) => t.status === "SERVED");

  const canRequestBill = order.status === "OPEN" && allTicketsServed;
  const canAddItems = order.status === "OPEN";
  const canCancel = order.status === "OPEN";

  return (
    <div className="flex flex-col h-screen bg-background">
      <OrderDetailHeader order={order} onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        <OrderBanners order={order} readyTickets={readyTickets} />

        {tickets.map((ticket) => (
          <TicketGroup
            key={ticket.id}
            ticket={ticket}
            onMarkServed={
              hasPermission("orders:update_status")
                ? handleMarkServed
                : undefined
            }
            isUpdating={isTicketUpdating(ticket.id)}
            canVoid={order.status === "OPEN" && hasPermission("orders:void")}
            canComp={order.status === "OPEN" && hasPermission("orders:comp")}
            onAdjust={(itemId, action) =>
              setReasonAction({ type: action, itemId })
            }
            onFireHeld={
              order.status === "OPEN" && hasPermission("orders:update")
                ? (ticketId) =>
                    updateTicketStatus.mutate({ ticketId, status: "FIRED" })
                : undefined
            }
            onRefire={
              order.status === "OPEN" && hasPermission("orders:update")
                ? (itemId) => {
                    setRefireItemId(itemId);
                    setRefireReason("");
                    setZeroPriceReplacement(true);
                  }
                : undefined
            }
            onRefill={
              order.status === "OPEN" && hasPermission("orders:update")
                ? (itemId) => refill.mutate(itemId)
                : undefined
            }
            onSeatShares={
              order.status === "OPEN" && hasPermission("billing:create")
                ? (itemId, current) => {
                    setSeatShareItemId(itemId);
                    setSeatShares(
                      current.length
                        ? current.map((share) => ({
                            seatLabel: share.seatLabel,
                            shareRatio: String(share.shareRatio),
                          }))
                        : [
                            { seatLabel: "1", shareRatio: "0.5" },
                            { seatLabel: "2", shareRatio: "0.5" },
                          ],
                    );
                  }
                : undefined
            }
            replacementByOriginalId={replacementByOriginalId}
          />
        ))}

        {order.notes && (
          <div className="mx-4 mt-3 bg-warning-surface border border-warning/20 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-warning mb-1">
              Order Notes
            </p>
            <p className="text-sm text-warning">{order.notes}</p>
          </div>
        )}

        <OrderTotals order={order} />
        <OrderTimeline order={order} />
      </div>

      <OrderActions
        order={order}
        canRequestBill={canRequestBill}
        canAddItems={canAddItems}
        canCancel={canCancel}
        allTicketsServed={allTicketsServed}
        isUpdatingStatus={updateStatus.isPending}
        onRequestBill={() =>
          updateStatus.mutate({ id: orderId, status: "BILL_REQUESTED" })
        }
        onAddItems={() => onAddItems(orderId)}
        onCancel={() => setReasonAction({ type: "cancel" })}
        onTransfer={
          order.status === "OPEN" &&
          order.type === "DINE_IN" &&
          !!order.tableId &&
          hasPermission("orders:update")
            ? () => setShowTransfer(true)
            : undefined
        }
        onSplit={
          order.status === "BILL_REQUESTED" && hasPermission("billing:create")
            ? () => {
                setShowSplit(true);
                setItemBills(
                  Object.fromEntries(
                    (order.items ?? [])
                      .filter(
                        (item) =>
                          item.itemStatus === "ACTIVE" ||
                          (item.itemStatus === "REFIRED" && !item.compedAt),
                      )
                      .map((item, index) => [item.id, index % 2]),
                  ),
                );
              }
            : undefined
        }
        onMerge={
          order.status === "OPEN" &&
          order.type === "DINE_IN" &&
          hasPermission("orders:update")
            ? () => setShowMerge(true)
            : undefined
        }
      />
      <Modal
        open={showSplit}
        onClose={() => setShowSplit(false)}
        title="Split bill"
      >
        <div className="space-y-4">
          <SelectMenu
            label="Split mode"
            value={splitMode}
            onChange={(value) =>
              setSplitMode(value as "EVEN" | "ITEM" | "SEAT")
            }
            className="min-h-11 rounded-xl"
            options={[
              { value: "EVEN", label: "Even split" },
              { value: "ITEM", label: "Assign items" },
              { value: "SEAT", label: "By seat / diner" },
            ]}
          />
          {splitMode !== "SEAT" && (
            <Input
              label="Number of bills"
              type="number"
              min="2"
              max="20"
              value={splitWays}
              onChange={(event) => setSplitWays(event.target.value)}
            />
          )}
          {splitMode === "SEAT" && (
            <SelectMenu
              label="Shared items"
              value={sharedStrategy}
              onChange={(value) =>
                setSharedStrategy(value as "EVEN_SPLIT" | "MANUAL")
              }
              className="min-h-11 rounded-xl"
              options={[
                { value: "EVEN_SPLIT", label: "Balance across seats" },
                { value: "MANUAL", label: "Assign manually" },
              ]}
            />
          )}
          {splitMode === "ITEM" && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {(order.items ?? [])
                .filter(
                  (item) =>
                    item.itemStatus === "ACTIVE" ||
                    (item.itemStatus === "REFIRED" && !item.compedAt),
                )
                .map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-2 text-sm"
                  >
                    {item.quantity}× {item.menuItemName}
                    <SelectMenu
                      aria-label={`Bill for ${item.menuItemName}`}
                      className="w-28 rounded-xl"
                      value={String(itemBills[item.id] ?? 0)}
                      onChange={(value) =>
                        setItemBills((current) => ({
                          ...current,
                          [item.id]: Number(value),
                        }))
                      }
                      options={Array.from(
                        { length: Number(splitWays) || 2 },
                        (_, index) => ({
                          value: String(index),
                          label: `Bill ${index + 1}`,
                        }),
                      )}
                    />
                  </label>
                ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSplit(false)}>
              Cancel
            </Button>
            <Button
              loading={splitBill.isPending || splitBySeat.isPending}
              disabled={splitMode !== "SEAT" && Number(splitWays) < 2}
              onClick={() => {
                if (splitMode === "SEAT") {
                  splitBySeat.mutate(sharedStrategy);
                  return;
                }
                const ways = Number(splitWays);
                const allocations =
                  splitMode === "ITEM"
                    ? Array.from({ length: ways }, (_, index) => ({
                        label: `Bill ${index + 1}`,
                        orderItemIds: (order.items ?? [])
                          .filter(
                            (item) =>
                              (item.itemStatus === "ACTIVE" ||
                                (item.itemStatus === "REFIRED" &&
                                  !item.compedAt)) &&
                              (itemBills[item.id] ?? 0) === index,
                          )
                          .map((item) => item.id),
                      }))
                    : undefined;
                splitBill.mutate(
                  { ways, ...(allocations ? { allocations } : {}) },
                  { onSuccess: () => setShowSplit(false) },
                );
              }}
            >
              Split bill
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={showMerge}
        onClose={() => setShowMerge(false)}
        title="Merge table"
      >
        <div className="space-y-4">
          <SelectMenu
            label="Merge billing into"
            placeholder="Select another open table"
            value={mergeTargetId || undefined}
            onChange={setMergeTargetId}
            className="min-h-11 rounded-xl"
            options={mergeCandidates
              .filter(
                (candidate) =>
                  candidate.id !== orderId &&
                  candidate.status === "OPEN" &&
                  candidate.type === "DINE_IN" &&
                  !candidate.mergedIntoOrderId,
              )
              .map((candidate) => ({
                value: candidate.id,
                label:
                  candidate.table?.name ?? `Order ${candidate.id.slice(-8)}`,
              }))}
          />
          <p className="text-xs text-text-secondary">
            Kitchen tickets stay separate; only billing is combined.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowMerge(false)}>
              Cancel
            </Button>
            <Button
              disabled={!mergeTargetId}
              loading={mergeOrder.isPending}
              onClick={() =>
                mergeOrder.mutate(mergeTargetId, {
                  onSuccess: () => setShowMerge(false),
                })
              }
            >
              Merge
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={seatShareItemId !== null}
        onClose={() => setSeatShareItemId(null)}
        title="Split item across seats"
      >
        <div className="space-y-3">
          {seatShares.map((share, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                label="Seat"
                value={share.seatLabel}
                onChange={(event) =>
                  setSeatShares((current) =>
                    current.map((value, i) =>
                      i === index
                        ? { ...value, seatLabel: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Input
                label="Ratio"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={share.shareRatio}
                onChange={(event) =>
                  setSeatShares((current) =>
                    current.map((value, i) =>
                      i === index
                        ? { ...value, shareRatio: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Button
                variant="secondary"
                onClick={() =>
                  setSeatShares((current) =>
                    current.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setSeatShares((current) => [
                ...current,
                { seatLabel: String(current.length + 1), shareRatio: "0" },
              ])
            }
          >
            Add seat
          </Button>
          <p className="text-xs text-text-secondary">
            Ratios must total exactly 1.00.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSeatShareItemId(null)}
            >
              Cancel
            </Button>
            <Button
              loading={saveSeatShares.isPending}
              disabled={
                !seatShares.length ||
                Math.abs(
                  seatShares.reduce(
                    (sum, share) => sum + Number(share.shareRatio || 0),
                    0,
                  ) - 1,
                ) > 0.0001 ||
                seatShares.some(
                  (share) =>
                    !share.seatLabel.trim() || Number(share.shareRatio) <= 0,
                )
              }
              onClick={() =>
                seatShareItemId &&
                saveSeatShares.mutate(
                  {
                    itemId: seatShareItemId,
                    shares: seatShares.map((share) => ({
                      seatLabel: share.seatLabel.trim(),
                      shareRatio: Number(share.shareRatio),
                    })),
                  },
                  { onSuccess: () => setSeatShareItemId(null) },
                )
              }
            >
              Save split
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={refireItemId !== null}
        onClose={() => setRefireItemId(null)}
        title="Refire item"
      >
        <div className="space-y-4">
          <Input
            label="Reason"
            value={refireReason}
            onChange={(event) => setRefireReason(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={zeroPriceReplacement}
              onChange={(event) =>
                setZeroPriceReplacement(event.target.checked)
              }
            />{" "}
            Also comp original (kitchen error)
          </label>
          <p className="text-xs text-text-secondary">
            Turn off for a legitimate reorder so both lines remain billable.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRefireItemId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!refireReason.trim()}
              loading={refire.isPending}
              onClick={() =>
                refireItemId &&
                refire.mutate(
                  {
                    itemId: refireItemId,
                    reason: refireReason.trim(),
                    alsoCompOriginal: zeroPriceReplacement,
                  },
                  { onSuccess: () => setRefireItemId(null) },
                )
              }
            >
              Refire
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        title="Transfer table"
      >
        <div className="space-y-4">
          <SelectMenu
            label="Destination"
            placeholder="Select an available table"
            value={destinationTableId || undefined}
            onChange={setDestinationTableId}
            className="min-h-11 rounded-xl"
            options={tables
              .filter((table) => table.id !== order.tableId)
              .sort((left, right) =>
                left.status === right.status
                  ? left.name.localeCompare(right.name)
                  : left.status === "AVAILABLE"
                    ? -1
                    : 1,
              )
              .map((table) => ({
                value: table.id,
                label: table.name,
                description:
                  table.status === "AVAILABLE"
                    ? `${table.capacity} seats`
                    : table.status.charAt(0) +
                      table.status.slice(1).toLowerCase(),
                group:
                  table.status === "AVAILABLE" ? "Available" : "Unavailable",
                disabled: table.status !== "AVAILABLE",
              }))}
          />
          <Input
            label="Reason (optional)"
            value={transferReason}
            onChange={(event) => setTransferReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
            <Button
              disabled={!destinationTableId}
              loading={transferTable.isPending}
              onClick={() =>
                transferTable.mutate(
                  { newTableId: destinationTableId, reason: transferReason },
                  { onSuccess: () => setShowTransfer(false) },
                )
              }
            >
              Transfer
            </Button>
          </div>
        </div>
      </Modal>
      <ManagerApprovalDialog
        open={pendingApproval !== null}
        orderId={orderId}
        request={pendingApproval}
        onClose={() => setPendingApproval(null)}
        onApproved={(approvalToken) =>
          pendingApproval &&
          submitLineAdjustment(pendingApproval, approvalToken)
        }
      />
      <ReasonDialog
        open={reasonAction !== null}
        title={
          reasonAction?.type === "cancel"
            ? "Cancel order"
            : reasonAction?.type === "comp"
              ? "Comp item"
              : "Void item"
        }
        reasons={cancellationReasons}
        loading={updateStatus.isPending || lineAdjustments.isPending}
        onClose={() => setReasonAction(null)}
        onSubmit={(reason) => {
          if (!reasonAction) return;
          if (reasonAction.type === "cancel") {
            updateStatus.mutate(
              { id: orderId, status: "CANCELLED", ...reason },
              { onSuccess: () => setReasonAction(null) },
            );
          } else {
            submitLineAdjustment({
              action: reasonAction.type,
              itemId: reasonAction.itemId,
              reason,
            });
          }
        }}
      />
    </div>
  );
};
