import { memo } from "react";
import { ArrowLeft, ChevronRight, Clock3, Minus, Plus, ShoppingBag, Utensils } from "lucide-react";
import { Button, Card, EmptyState, IconButton } from "@pos/ui";
import type { CartLine } from "./pricing";
import { getLineSubtotal } from "./pricing";

import { formatMoney } from "../../shared/utils/money";

export const CartView = memo(function CartView({ cart, subtotal, tax, total, table, onBack, onChange, onPlace, loading, orderNotes, onNotesChange }: { cart: CartLine[]; subtotal: number; tax: number; total: number; table: string; onBack: () => void; onChange: (index: number, delta: number) => void; onPlace: () => void; loading: boolean; orderNotes: string; onNotesChange: (value: string) => void }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-8 pt-[env(safe-area-inset-top)] sm:px-6">
        <header className="flex items-center justify-between py-5">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Menu</Button>
          <span className="font-semibold text-text-primary">Checkout</span><span className="w-16" />
        </header>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Utensils className="h-4 w-4" /></div>
          <div><p className="font-semibold text-text-primary">Table {table}</p><p className="text-sm text-text-secondary">Dine-in self order</p></div>
        </Card>
        {cart.length === 0 ? <EmptyState icon={ShoppingBag} title="Your order is empty" description="Add something from the menu to continue." action={<Button onClick={onBack}>Browse menu</Button>} /> : <>
          <div className="mt-3 space-y-2">
            {cart.map((line, index) => {
              const image = line.item.imageUrl ?? line.item.images[0]?.url;
              return <Card key={`${line.item.id}-${line.variantId ?? "base"}-${line.selectedOptions.map((option) => `${option.optionId}:${option.quantity}`).join(",")}`} padding="sm" className="flex items-center gap-3">
                {image ? <img src={image} alt={line.item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" decoding="async" /> : <div aria-hidden="true" className="h-16 w-16 rounded-lg bg-surface-secondary" />}
                <div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{line.item.name}</p><p className="mt-1 text-sm text-text-secondary">{formatMoney(getLineSubtotal(line))}</p></div>
                <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1"><IconButton aria-label={`Decrease ${line.item.name}`} icon={Minus} size="sm" onClick={() => onChange(index, -1)} /><span className="w-5 text-center text-sm font-semibold">{line.quantity}</span><IconButton aria-label={`Increase ${line.item.name}`} icon={Plus} size="sm" variant="primary" onClick={() => onChange(index, 1)} /></div>
              </Card>;
            })}
          </div>
          <Card padding="md" className="mt-5"><div className="flex justify-between py-1 text-sm text-text-secondary"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div><div className="flex justify-between py-1 text-sm text-text-secondary"><span>Tax</span><span>{formatMoney(tax)}</span></div><div className="my-3 border-t border-border" /><div className="flex justify-between text-lg font-semibold text-text-primary"><span>Total</span><span>{formatMoney(total)}</span></div></Card>
          <Card padding="md" className="mt-5"><p className="font-semibold text-text-primary">Special instructions</p><textarea className="mt-3 min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={orderNotes} onChange={(event) => onNotesChange(event.target.value)} placeholder="e.g. No onions, less spicy, extra sauce" maxLength={1000} aria-label="Special instructions" /><p className="mt-1 text-xs text-text-secondary">These notes will be sent with the order to the kitchen.</p></Card><Card padding="md" className="mt-5"><p className="font-semibold text-text-primary">Payment</p><div className="mt-3 flex items-center justify-between rounded-lg border border-primary bg-primary-surface p-4"><div><p className="font-medium text-text-primary">Pay at counter</p><p className="mt-1 text-xs text-text-secondary">Order now and settle the bill with the restaurant.</p></div><span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Cash</span></div><p className="mt-3 text-xs leading-5 text-text-secondary">Online payments and UPI will be enabled after a payment provider is configured for this restaurant.</p></Card>
          <div id="payment-note" className="mt-4 flex items-start gap-3 rounded-lg bg-surface-secondary p-4 text-sm text-text-secondary"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><span>Your order will be sent directly to the kitchen. Payment remains pending until staff records the payment.</span></div>
          <Button aria-describedby="payment-note" disabled={loading} loading={loading} onClick={onPlace} size="lg" className="mt-5 w-full">Place order · Pay at counter <ChevronRight className="h-4 w-4" /></Button>
        </>}
      </div>
    </div>
  );
});
