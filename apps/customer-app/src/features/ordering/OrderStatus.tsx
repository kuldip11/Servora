import { Check, Clock3, ReceiptText, WifiOff, BellRing } from "lucide-react";
import { Badge, Button, Card } from "@pos/ui";
import type { CustomerOrder, CustomerRequestType } from "../../api";
import { formatMoney } from "../../shared/utils/money";

import { CUSTOMER_ORDER_TICKET_STEPS } from "./constants";

function statusLabel(status: string) {
  if (status === "SERVED") return "Served";
  if (status === "READY") return "Ready for you";
  if (status === "PREPARING") return "Preparing your food";
  return "Order received";
}

function orderStatusLabel(status: string) {
  if (status === "BILL_REQUESTED") return "Bill requested";
  if (status === "PAID") return "Paid";
  if (status === "CLOSED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "PENDING_PAYMENT") return "Payment required";
  return "Open";
}

export function OrderStatus({
  order,
  mode,
  table,
  estimatedTime,
  onMenu,
  live,
  onRequest,
  requestBusy,
  requestMessage,
  onPay,
  payBusy = false,
}: {
  order: CustomerOrder;
  mode: "DINE_IN" | "TAKEAWAY";
  table: string;
  estimatedTime: string;
  onMenu: () => void;
  live: boolean;
  onRequest: (type: CustomerRequestType) => void;
  requestBusy: boolean;
  requestMessage: string | null;
  onPay?: () => void;
  payBusy?: boolean;
}) {
  const latestTicket = order.kitchenTickets.at(-1);
  const latestStatus = latestTicket?.status ?? "FIRED";
  const displayStatus =
    latestStatus === "PENDING_PAYMENT" ? "FIRED" : latestStatus;
  const activeStep = Math.max(0, CUSTOMER_ORDER_TICKET_STEPS.indexOf(displayStatus));
  const terminal =
    order.status === "PAID" ||
    order.status === "CLOSED" ||
    order.status === "CANCELLED";
  const ready = latestStatus === "READY";

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6">
      <div className="mx-auto w-full max-w-2xl pb-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">
              {table === "Takeaway" ? "Takeaway" : `Table ${table}`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Your order
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Follow every kitchen update in one place.
            </p>
          </div>
          <Badge variant={live ? "success" : "default"}>
            {live ? (
              "Live updates"
            ) : (
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> Reconnecting
              </span>
            )}
          </Badge>
        </header>

        {ready && !terminal && (
          <Card
            padding="md"
            className="mt-5 border-success/30 bg-success-surface"
          >
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-success" />
              <div>
                <p className="font-semibold text-success">Your food is ready</p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {mode === "DINE_IN"
                    ? "Your waiter has been notified."
                    : "Your takeaway order is ready for pickup."}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card padding="md" className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-secondary">Order status</p>
              <p className="mt-1 text-lg font-semibold">
                {orderStatusLabel(order.status)}
              </p>
            </div>
            <ReceiptText
              className="h-5 w-5 text-text-secondary"
              aria-hidden="true"
            />
          </div>
          {!terminal && (
            <>
              <div
                className="mt-6 grid grid-cols-4 gap-2"
                aria-label={`Latest kitchen status: ${statusLabel(latestStatus)}`}
              >
                {CUSTOMER_ORDER_TICKET_STEPS.map((step, index) => (
                  <div key={step} className="text-center">
                    <div
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${index <= activeStep ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-text-secondary"}`}
                    >
                      {index < activeStep ? (
                        <Check className="h-4 w-4" />
                      ) : index === activeStep ? (
                        <Clock3 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-text-secondary">
                      {step === "FIRED"
                        ? "Received"
                        : step[0] + step.slice(1).toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm font-medium">
                {statusLabel(latestStatus)} · Estimated {estimatedTime}
              </p>
            </>
          )}
        </Card>

        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Items</h2>
            <span className="text-sm text-text-secondary">
              {formatMoney(Number(order.totalAmount))}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {(["DINE_IN", "TAKEAWAY"] as const).map((fulfillmentType) => {
              const items =
                order.items?.filter(
                  (item) => item.fulfillmentType === fulfillmentType,
                ) ?? [];
              if (!items.length) return null;
              return (
                <div key={fulfillmentType}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    <span>
                      {fulfillmentType === "DINE_IN" ? "Eat here" : "Takeaway"}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.quantity} × {item.menuItemName}
                          </p>
                          {item.variantName && (
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {item.variantName}
                            </p>
                          )}
                          {item.chefNotes && (
                            <p className="mt-1 text-xs text-text-secondary">
                              Note: {item.chefNotes}
                            </p>
                          )}
                          {item.modifiers?.length > 0 && (
                            <p className="mt-1 text-xs text-text-secondary">
                              {item.modifiers
                                .map(
                                  (modifier) =>
                                    `${modifier.quantity > 1 ? `${modifier.quantity} × ` : ""}${modifier.name}`,
                                )
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-medium">
                          {formatMoney(Number(item.subtotal))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal</span>
              <span>{formatMoney(Number(order.subtotal))}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-text-secondary">{order.items.some((item) => item.taxMode === "INCLUSIVE") ? (order.items.some((item) => item.taxMode === "EXCLUSIVE") ? "Tax (mixed included/exclusive)" : "Tax included") : "Tax"}</span>
              <span>{formatMoney(Number(order.taxAmount))}</span>
            </div>
            {Number(order.discountAmount) > 0 && <div className="mt-2 flex justify-between text-success"><span>Discount</span><span>-{formatMoney(Number(order.discountAmount))}</span></div>}
            {Number(order.serviceChargeAmount ?? 0) > 0 && <div className="mt-2 flex justify-between"><span className="text-text-secondary">Service charge</span><span>{formatMoney(Number(order.serviceChargeAmount))}</span></div>}
            {Math.abs(Number(order.roundingAdjustment ?? 0)) >= 0.005 && <div className="mt-2 flex justify-between"><span className="text-text-secondary">Rounding</span><span>{formatMoney(Number(order.roundingAdjustment))}</span></div>}
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(Number(order.totalAmount))}</span>
            </div>
          </div>
        </Card>

        {order.kitchenTickets.length > 1 && (
          <Card padding="md" className="mt-4">
            <h2 className="font-semibold">Kitchen rounds</h2>
            <div className="mt-3 space-y-2">
              {order.kitchenTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 text-sm"
                >
                  <span>Round {ticket.ticketNumber}</span>
                  <Badge
                    variant={ticket.status === "SERVED" ? "success" : "default"}
                  >
                    {statusLabel(ticket.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {order.payments?.some(
          (payment) =>
            payment.method === "RAZORPAY" && payment.status === "PENDING",
        ) &&
          onPay && (
            <Card
              padding="md"
              className="mt-4 border-primary bg-primary-surface"
            >
              <div>
                <p className="font-semibold">Payment required</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Complete payment to release this takeaway order to the
                  kitchen.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="mt-3 w-full"
                onClick={onPay}
                disabled={payBusy}
              >
                {payBusy
                  ? "Opening payment…"
                  : `Pay ${formatMoney(Number(order.totalAmount))}`}
              </Button>
            </Card>
          )}

        <Card padding="md" className="mt-4">
          <h2 className="font-semibold">Need anything?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                "CALL_WAITER",
                "WATER",
                "CUTLERY",
                "BILL",
              ] as CustomerRequestType[]
            )
              .filter((type) => mode === "DINE_IN" || type !== "BILL")
              .map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  disabled={requestBusy}
                  onClick={() => onRequest(type)}
                >
                  {type === "CALL_WAITER"
                    ? "Call waiter"
                    : type === "BILL"
                      ? "Request bill"
                      : type[0] + type.slice(1).toLowerCase()}
                </Button>
              ))}
          </div>
          {requestMessage && (
            <p role="status" className="mt-3 text-sm text-text-secondary">
              {requestMessage}
            </p>
          )}
        </Card>

        {!terminal && mode === "DINE_IN" && (
          <Button
            variant="primary"
            size="lg"
            onClick={onMenu}
            className="mt-4 w-full"
          >
            Order more
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={onMenu}
          className="mt-2 w-full"
        >
          Back to menu
        </Button>
      </div>
    </main>
  );
}
