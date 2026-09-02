import { memo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Tag,
  Utensils,
} from "lucide-react";
import { Button, Dialog, EmptyState, IconButton, TextInput } from "@pos/ui";
import type { CartLine } from "./pricing";
import type { ComboCartLine } from "./combo";
import { getLineSubtotal } from "./pricing";
import { formatMoney } from "@/shared/utils/money";

const lineChoices = (line: CartLine) => {
  const variant = line.item.variants.find(
    (value) => value.id === line.variantId,
  );
  const options = line.selectedOptions.flatMap((selection) => {
    const option = line.item.modifierGroupLinks
      .flatMap(({ group }) => group.options)
      .find((value) => value.id === selection.optionId);
    if (!option) return [];
    const zone =
      selection.zoneLabel && selection.zoneLabel !== "WHOLE"
        ? ` (${selection.zoneLabel.toLowerCase()})`
        : "";
    return `${selection.quantity > 1 ? `${selection.quantity} × ` : ""}${option.name}${zone}`;
  });
  return [variant?.name, ...options].filter(Boolean).join(" · ");
};

export const CartView = memo(function CartView({
  cart,
  combos,
  subtotal,
  tax,
  total,
  table,
  mode = "DINE_IN",
  onBack,
  onChange,
  onComboChange,
  onEdit,
  onPlace,
  couponCode,
  onCouponCodeChange,
  loyaltyPhone,
  onLoyaltyPhoneChange,
  loading,
}: {
  cart: CartLine[];
  combos: ComboCartLine[];
  subtotal: number;
  tax: number;
  total: number;
  table: string;
  mode?: "DINE_IN" | "TAKEAWAY";
  onBack: () => void;
  onChange: (index: number, delta: number) => void;
  onComboChange: (index: number, delta: number) => void;
  onEdit: (index: number) => void;
  onPlace: (fulfillmentType: "DINE_IN" | "TAKEAWAY") => void;
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  loyaltyPhone: string;
  onLoyaltyPhoneChange: (value: string) => void;
  loading: boolean;
}) {
  const [rewardsOpen, setRewardsOpen] = useState(
    Boolean(couponCode || loyaltyPhone),
  );
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false);
  const empty = cart.length === 0 && combos.length === 0;

  return (
    <div className="customer-experience fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background text-text-primary">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          <div className="flex items-center gap-3">
            <IconButton
              aria-label="Back to menu"
              icon={ArrowLeft}
              variant="secondary"
              size="lg"
              className="rounded-full"
              onClick={onBack}
            />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#d45d24]">
                Review
              </p>
              <h1 className="customer-display text-3xl font-bold">
                Your order
              </h1>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary-surface px-4 py-3 text-xs font-bold text-primary">
            <span className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              {mode === "DINE_IN"
                ? `Table ${table} · Dine in`
                : "Takeaway order"}
            </span>
            {!empty && (
              <span>
                {cart.reduce((sum, line) => sum + line.quantity, 0) +
                  combos.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                items
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-44 sm:px-6">
        {empty ? (
          <div className="mt-10 rounded-3xl border border-border bg-surface py-10">
            <EmptyState
              icon={ShoppingBag}
              title="Your order is empty"
              description="Add something from the menu to continue."
              action={<Button onClick={onBack}>Browse menu</Button>}
            />
          </div>
        ) : (
          <>
            <section
              aria-label="Order items"
              className="divide-y divide-border"
            >
              {combos.map((line, index) => (
                <article
                  key={`${line.combo.id}-${index}`}
                  className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 py-5"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#f3dfb9] text-xs font-extrabold text-[#8b4b24]">
                    SET
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold">{line.combo.name}</h2>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      {line.selections.reduce(
                        (sum, selection) => sum + selection.optionIds.length,
                        0,
                      )}{" "}
                      selected components
                    </p>
                    <span className="mt-2 block text-xs font-bold text-text-primary">
                      Price confirmed at checkout
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-full bg-surface-secondary p-1">
                      <IconButton
                        aria-label={`Decrease ${line.combo.name}`}
                        icon={Minus}
                        size="sm"
                        onClick={() => onComboChange(index, -1)}
                      />
                      <span className="w-6 text-center text-xs font-bold">
                        {line.quantity}
                      </span>
                      <IconButton
                        aria-label={`Increase ${line.combo.name}`}
                        icon={Plus}
                        size="sm"
                        variant="primary"
                        onClick={() => onComboChange(index, 1)}
                      />
                    </div>
                  </div>
                </article>
              ))}

              {cart.map((line, index) => {
                const image = line.item.imageUrl ?? line.item.images[0]?.url;
                const choices = lineChoices(line);
                return (
                  <article
                    key={`${line.item.id}-${line.variantId ?? "base"}-${line.selectedOptions.map((option) => `${option.optionId}:${option.zoneLabel ?? "WHOLE"}:${option.quantity}`).join(",")}`}
                    className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3 py-5"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={line.item.name}
                        className="h-[72px] w-[72px] rounded-2xl object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-[#f3dfb9] text-[#8b4b24]">
                        <Utensils className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-bold leading-tight">
                        {line.item.name}
                      </h2>
                      {choices && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
                          {choices}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(index)}
                        className="mt-2 block text-xs font-extrabold text-primary"
                      >
                        Edit choices
                      </button>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-3">
                      <strong className="text-sm">
                        {formatMoney(getLineSubtotal(line))}
                      </strong>
                      <div className="flex items-center gap-1 rounded-full bg-surface-secondary p-1">
                        <IconButton
                          aria-label={`Decrease ${line.item.name}`}
                          icon={Minus}
                          size="sm"
                          onClick={() => onChange(index, -1)}
                        />
                        <span className="w-6 text-center text-xs font-bold">
                          {line.quantity}
                        </span>
                        <IconButton
                          aria-label={`Increase ${line.item.name}`}
                          icon={Plus}
                          size="sm"
                          variant="primary"
                          onClick={() => onChange(index, 1)}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-2">
              {!rewardsOpen ? (
                <button
                  type="button"
                  onClick={() => setRewardsOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-4 text-left text-xs text-text-secondary"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Add coupon or loyalty reward
                  </span>
                  <span className="font-extrabold text-primary">Add →</span>
                </button>
              ) : (
                <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
                  <TextInput
                    label="Coupon code"
                    placeholder="Enter a code"
                    value={couponCode}
                    onChange={(event) =>
                      onCouponCodeChange(event.target.value.toUpperCase())
                    }
                  />
                  <TextInput
                    label="Loyalty phone"
                    placeholder="Enter your phone number"
                    inputMode="tel"
                    value={loyaltyPhone}
                    onChange={(event) =>
                      onLoyaltyPhoneChange(event.target.value)
                    }
                  />
                  <p className="text-[11px] leading-5 text-text-secondary sm:col-span-2">
                    Promotions and loyalty pricing are confirmed when your order
                    is submitted.
                  </p>
                </div>
              )}
            </section>

            <section className="mt-6 border-t border-border pt-4">
              <div className="flex justify-between py-1.5 text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm text-text-secondary">
                <span>Taxes</span>
                <span>{formatMoney(tax)}</span>
              </div>
              <div className="mt-2 flex justify-between py-2 text-xl font-bold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </section>

            <section className="mt-5 flex items-start gap-3 rounded-2xl bg-primary-surface p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {mode === "DINE_IN" ? "Pay after dining" : "Payment required"}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {mode === "DINE_IN"
                    ? "This round goes directly to the kitchen and stays on your table tab."
                    : "You'll complete online payment before this order is sent to the kitchen."}
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      {!empty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p
              id="order-note"
              className="mb-2 text-center text-[10px] text-text-secondary"
            >
              {mode === "DINE_IN"
                ? "Choose dine-in or takeaway next · Your table tab stays open"
                : "Secure payment is completed before kitchen confirmation"}
            </p>
            <Button
              aria-describedby="order-note"
              disabled={loading}
              loading={loading}
              onClick={() =>
                mode === "DINE_IN"
                  ? setFulfillmentOpen(true)
                  : onPlace("TAKEAWAY")
              }
              size="lg"
              className="h-14 w-full rounded-2xl"
            >
              {mode === "TAKEAWAY" ? "Continue to payment" : "Place order"}{" "}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={fulfillmentOpen}
        onClose={() => setFulfillmentOpen(false)}
        title="How should we prepare this order?"
        description="Choose one preparation method for every item in this round."
        size="md"
        contentClassName="customer-dialog overflow-hidden rounded-[24px]"
        bodyClassName="p-0"
      >
        <div className="customer-experience space-y-3 bg-background p-5 text-text-primary sm:p-6">
          <p className="mb-4 text-sm leading-6 text-text-secondary">
            This choice applies to all items in this order. You can choose
            differently the next time you order.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setFulfillmentOpen(false);
              onPlace("DINE_IN");
            }}
            className="flex w-full items-start gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:bg-primary-surface disabled:opacity-50"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Utensils className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-base">Dine in</strong>
              <span className="mt-1 block text-xs leading-5 text-text-secondary">
                Serve everything normally at Table {table}.
              </span>
            </span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setFulfillmentOpen(false);
              onPlace("TAKEAWAY");
            }}
            className="flex w-full items-start gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-[#d45d24] hover:bg-[#fff1e8] disabled:opacity-50 dark:hover:bg-[#3a2419]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#d45d24] text-white">
              <PackageCheck className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-base">Pack for takeaway</strong>
              <span className="mt-1 block text-xs leading-5 text-text-secondary">
                Pack this round, deliver it to Table {table}, and keep it on the
                same table bill.
              </span>
            </span>
          </button>
          <p className="pt-1 text-center text-[11px] leading-5 text-text-secondary">
            Your table remains open until you request the bill.
          </p>
        </div>
      </Dialog>
    </div>
  );
});
