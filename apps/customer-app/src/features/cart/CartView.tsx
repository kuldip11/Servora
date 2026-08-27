import { memo } from "react";
import { ArrowLeft, ChevronRight, Clock3, Minus, Plus, ShoppingBag, Utensils } from "lucide-react";
import { Button, Card, EmptyState, IconButton } from "@pos/ui";
import type { CartLine } from "./pricing";
import { getLineSubtotal } from "./pricing";

import { formatMoney } from "../../shared/utils/money";

export const CartView = memo(function CartView({ cart, subtotal, tax, total, table, mode = "DINE_IN", onBack, onChange, onFulfillmentChange, onPlace, loading }: { cart: CartLine[]; subtotal: number; tax: number; total: number; table: string; mode?: "DINE_IN" | "TAKEAWAY"; onBack: () => void; onChange: (index: number, delta: number) => void; onFulfillmentChange: (index: number, value: "DINE_IN" | "TAKEAWAY") => void; onPlace: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-8 pt-[env(safe-area-inset-top)] sm:px-6">
        <header className="flex items-center justify-between py-5">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Menu</Button>
          <span className="font-semibold text-text-primary">Your order</span><span className="w-16" />
        </header>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Utensils className="h-4 w-4" /></div>
          <div><p className="font-semibold text-text-primary">{mode === "DINE_IN" ? `Table ${table}` : "Takeaway order"}</p><p className="text-sm text-text-secondary">{mode === "DINE_IN" ? "Dine-in self order" : "Order for pickup"}</p></div>
        </Card>
        {cart.length === 0 ? <EmptyState icon={ShoppingBag} title="Your order is empty" description="Add something from the menu to continue." action={<Button onClick={onBack}>Browse menu</Button>} /> : <>
          <div className="mt-3 space-y-2">
            {cart.map((line, index) => {
              const image = line.item.imageUrl ?? line.item.images[0]?.url;
              return <Card key={`${line.item.id}-${line.variantId ?? "base"}-${line.selectedOptions.map((option) => `${option.optionId}:${option.quantity}`).join(",")}`} padding="sm" className="flex items-center gap-3">
                {image ? <img src={image} alt={line.item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" decoding="async" /> : <div aria-hidden="true" className="h-16 w-16 rounded-lg bg-surface-secondary" />}
                <div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{line.item.name}</p><p className="mt-1 text-sm text-text-secondary">{formatMoney(getLineSubtotal(line))}</p><div className="mt-2 inline-flex rounded-md bg-surface-secondary p-0.5">{mode === "DINE_IN" ? (<><button type="button" className={`rounded px-2 py-1 text-xs font-medium ${line.fulfillmentType === "DINE_IN" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary"}`} onClick={() => onFulfillmentChange(index, "DINE_IN")}>Eat here</button><button type="button" className={`rounded px-2 py-1 text-xs font-medium ${line.fulfillmentType === "TAKEAWAY" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary"}`} onClick={() => onFulfillmentChange(index, "TAKEAWAY")}>Takeaway</button></>) : <span className="px-2 py-1 text-xs font-medium text-text-secondary">Takeaway</span>}</div></div>
                <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1"><IconButton aria-label={`Decrease ${line.item.name}`} icon={Minus} size="sm" onClick={() => onChange(index, -1)} /><span className="w-5 text-center text-sm font-semibold">{line.quantity}</span><IconButton aria-label={`Increase ${line.item.name}`} icon={Plus} size="sm" variant="primary" onClick={() => onChange(index, 1)} /></div>
              </Card>;
            })}
          </div>
          <Card padding="md" className="mt-5"><div className="flex justify-between py-1 text-sm text-text-secondary"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div><div className="flex justify-between py-1 text-sm text-text-secondary"><span>Tax</span><span>{formatMoney(tax)}</span></div><div className="my-3 border-t border-border" /><div className="flex justify-between text-lg font-semibold text-text-primary"><span>Total</span><span>{formatMoney(total)}</span></div></Card>
          {mode === "DINE_IN" ? (
            <Card padding="md" className="mt-5"><p className="font-semibold text-text-primary">Payment</p><div className="mt-3 flex items-center gap-3 rounded-lg border border-primary bg-primary-surface p-4"><Clock3 className="h-4 w-4 shrink-0 text-primary" /><div><p className="font-medium text-text-primary">Pay when you're done</p><p className="mt-1 text-xs leading-5 text-text-secondary">This table order stays open while you eat. You can order more, then settle the complete bill once you're finished.</p></div></div></Card>
          ) : (
            <Card padding="md" className="mt-5"><p className="font-semibold text-text-primary">Payment required</p><div className="mt-3 rounded-lg border border-warning bg-warning-surface p-4 text-sm text-warning">Online payment is required before your takeaway order is sent to the kitchen.</div></Card>
          )}
          <div id="order-note" className="mt-4 flex items-start gap-3 rounded-lg bg-surface-secondary p-4 text-sm text-text-secondary"><Utensils className="mt-0.5 h-4 w-4 shrink-0" /><span>{mode === "DINE_IN" ? "This round will be sent directly to the kitchen and added to your table tab." : "This takeaway order will be sent to the kitchen after payment is confirmed."}</span></div>
          <Button aria-describedby="order-note" disabled={loading} loading={loading} onClick={onPlace} size="lg" className="mt-5 w-full">{mode === "TAKEAWAY" ? "Continue to payment" : "Send order to kitchen"} <ChevronRight className="h-4 w-4" /></Button>
        </>}
      </div>
    </div>
  );
});
