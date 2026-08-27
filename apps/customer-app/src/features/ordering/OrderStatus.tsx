import { Check, Clock3, ReceiptText, WifiOff } from "lucide-react";
import { Badge, Button, Card } from "@pos/ui";
import type { CustomerOrder, CustomerRequestType } from "../../api";
import { formatMoney } from "../../shared/utils/money";

const ticketSteps = ["FIRED", "PREPARING", "READY", "SERVED"] as const;

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
  return "Open";
}

export function OrderStatus({
  order,
  table,
  estimatedTime,
  onMenu,
  live,
  onRequest,
  requestBusy,
  requestMessage,
}: {
  order: CustomerOrder;
  table: string;
  estimatedTime: string;
  onMenu: () => void;
  live: boolean;
  onRequest: (type: CustomerRequestType) => void;
  requestBusy: boolean;
  requestMessage: string | null;
}) {
  const latestTicket = order.kitchenTickets.at(-1);
  const latestStatus = latestTicket?.status ?? "FIRED";
  const activeStep = Math.max(0, ticketSteps.indexOf(latestStatus));
  const terminal = order.status === "PAID" || order.status === "CLOSED" || order.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6">
      <div className="mx-auto w-full max-w-2xl pb-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">{table === "Takeaway" ? "Takeaway" : `Table ${table}`}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your order</h1>
            <p className="mt-1 text-sm text-text-secondary">Follow every kitchen update in one place.</p>
          </div>
          <Badge variant={live ? "success" : "default"}>
            {live ? "Live updates" : <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Reconnecting</span>}
          </Badge>
        </header>

        <Card padding="md" className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-secondary">Order status</p>
              <p className="mt-1 text-lg font-semibold">{orderStatusLabel(order.status)}</p>
            </div>
            <ReceiptText className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </div>
          {!terminal && (
            <>
              <div className="mt-6 grid grid-cols-4 gap-2" aria-label={`Latest kitchen status: ${statusLabel(latestStatus)}`}>
                {ticketSteps.map((step, index) => (
                  <div key={step} className="text-center">
                    <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${index <= activeStep ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-text-secondary"}`}>
                      {index < activeStep ? <Check className="h-4 w-4" /> : index === activeStep ? <Clock3 className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-text-secondary">{step === "FIRED" ? "Received" : step[0] + step.slice(1).toLowerCase()}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm font-medium">{statusLabel(latestStatus)} · Estimated {estimatedTime}</p>
            </>
          )}
        </Card>

        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Items</h2>
            <span className="text-sm text-text-secondary">{formatMoney(Number(order.totalAmount))}</span>
          </div>
          <div className="mt-4 divide-y divide-border">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium">{item.quantity} × {item.menuItemName}</p>
                  {item.variantName && <p className="mt-0.5 text-xs text-text-secondary">{item.variantName}</p>}
                  {item.chefNotes && <p className="mt-1 text-xs text-text-secondary">Note: {item.chefNotes}</p>}
                  {item.modifiers?.length > 0 && <p className="mt-1 text-xs text-text-secondary">{item.modifiers.map((modifier) => `${modifier.quantity > 1 ? `${modifier.quantity} × ` : ""}${modifier.name}`).join(", ")}</p>}
                </div>
                <span className="shrink-0 text-sm font-medium">{formatMoney(Number(item.subtotal))}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatMoney(Number(order.subtotal))}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-text-secondary">Tax</span><span>{formatMoney(Number(order.taxAmount))}</span></div>
            <div className="mt-2 flex justify-between text-base font-semibold"><span>Total</span><span>{formatMoney(Number(order.totalAmount))}</span></div>
          </div>
        </Card>

        {order.kitchenTickets.length > 1 && (
          <Card padding="md" className="mt-4">
            <h2 className="font-semibold">Kitchen rounds</h2>
            <div className="mt-3 space-y-2">
              {order.kitchenTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 text-sm">
                  <span>Round {ticket.ticketNumber}</span><Badge variant={ticket.status === "SERVED" ? "success" : "default"}>{statusLabel(ticket.status)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card padding="md" className="mt-4">
          <h2 className="font-semibold">Need anything?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["CALL_WAITER", "WATER", "CUTLERY", "BILL"] as CustomerRequestType[]).map((type) => (
              <Button key={type} variant="secondary" disabled={requestBusy} onClick={() => onRequest(type)}>{type === "CALL_WAITER" ? "Call waiter" : type === "BILL" ? "Request bill" : type[0] + type.slice(1).toLowerCase()}</Button>
            ))}
          </div>
          {requestMessage && <p role="status" className="mt-3 text-sm text-text-secondary">{requestMessage}</p>}
        </Card>

        {!terminal && <Button variant="primary" size="lg" onClick={onMenu} className="mt-4 w-full">Order more</Button>}
        <Button variant="outline" size="lg" onClick={onMenu} className="mt-2 w-full">Back to menu</Button>
      </div>
    </main>
  );
}
