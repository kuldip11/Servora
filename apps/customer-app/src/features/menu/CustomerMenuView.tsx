import type { Dispatch, SetStateAction } from "react";
import {
  ChevronRight,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  SearchInput,
  ThemeSwitcher,
} from "@pos/ui";
import type { CustomerCombo, CustomerMenuItem } from "../../api";
import { formatMoney } from "../../shared/utils/money";
import { MenuCard } from "./MenuCard";

export interface CustomerMenuSessionView {
  mode: "DINE_IN" | "TAKEAWAY";
  table: string | null;
  area: string;
  restaurant: string;
}

interface CustomerMenuViewProps {
  session: CustomerMenuSessionView;
  placedOrder: boolean;
  itemCount: number;
  total: number;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  categories: Array<{ id: string; name: string }>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  combos: CustomerCombo[];
  visibleItems: CustomerMenuItem[];
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  onViewOrder: () => void;
  onCart: () => void;
  onOpenCombo: (combo: CustomerCombo) => void;
  onOpenItem: (item: CustomerMenuItem) => void;
}

export function CustomerMenuView({
  session,
  placedOrder,
  itemCount,
  total,
  search,
  setSearch,
  categories,
  category,
  setCategory,
  combos,
  visibleItems,
  error,
  setError,
  onViewOrder,
  onCart,
  onOpenCombo,
  onOpenItem,
}: CustomerMenuViewProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary-surface">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 pb-3 pt-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">
                <span>{session.area}</span>
                {session.mode === "DINE_IN" && (
                  <>
                    <span>•</span>
                    <span>Table {session.table}</span>
                  </>
                )}
              </div>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
                {session.restaurant}
              </h1>
              <p className="text-sm text-text-secondary">
                {session.mode === "DINE_IN"
                  ? "Order directly from your table"
                  : "Order ahead for takeaway"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeSwitcher label="Theme" id="customer-theme" />
              {placedOrder && (
                <IconButton
                  aria-label="View order status"
                  icon={ReceiptText}
                  variant="secondary"
                  size="lg"
                  onClick={onViewOrder}
                />
              )}
              <div className="relative">
                <IconButton
                  aria-label="Open cart"
                  icon={ShoppingBag}
                  variant="primary"
                  size="lg"
                  onClick={onCart}
                />
                {itemCount > 0 && (
                  <span
                    aria-label={`${itemCount} items in cart`}
                    className="pointer-events-none absolute right-3 top-3 flex h-5 min-w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-text-primary ring-2 ring-background"
                  >
                    {itemCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search the menu"
              aria-label="Search the menu"
            />
          </div>
          <nav
            aria-label="Menu categories"
            className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
          >
            {categories.map((option) => (
              <Button
                key={option.id}
                variant={category === option.name ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCategory(option.name)}
                className="shrink-0 rounded-full"
              >
                {option.name}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl scroll-pb-32 px-4 pb-36 pt-5 sm:px-6 sm:pb-32">
        {category === "Popular" && !search && (
          <Card className="mb-5 border-primary bg-primary p-5 text-primary-foreground shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] opacity-75">
                  <Sparkles className="h-3.5 w-3.5" /> Recommended
                </div>
                <h2 className="mt-2 text-2xl font-semibold">
                  Good choice for the table.
                </h2>
                <p className="mt-1 text-sm leading-6 opacity-80">
                  Order directly from your table. Your order goes straight to the kitchen.
                </p>
              </div>
              <Utensils className="mt-1 h-6 w-6 opacity-75" />
            </div>
          </Card>
        )}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">Menu</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{category}</h2>
          </div>
          <span className="text-sm text-text-secondary">{visibleItems.length} items</span>
        </div>
        {combos.length > 0 && !search && (
          <section className="mb-6">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">Set meals</p>
                <h3 className="mt-1 text-lg font-semibold text-text-primary">Combos</h3>
              </div>
              <span className="text-xs text-text-secondary">Built step by step</span>
            </div>
            <div className="space-y-2">
              {combos.map((combo) => (
                <button key={combo.id} type="button" onClick={() => onOpenCombo(combo)} className="w-full text-left">
                  <Card padding="md" className="transition-colors hover:border-primary">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text-primary">{combo.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {combo.description ?? `${combo.slots.length} guided choice${combo.slots.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {combo.pricePolicy === "FIXED"
                          ? `${formatMoney(Number(combo.fixedPrice ?? 0))}+`
                          : `${Number(combo.percentOff ?? 0)}% off`}
                      </span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <MenuCard key={item.id} item={item} onSelect={onOpenItem} />
          ))}
          {visibleItems.length === 0 && (
            <EmptyState
              icon={Search}
              title="No dishes found"
              description="Try another category or search term."
              size="sm"
            />
          )}
        </div>
      </main>

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-2xl rounded-lg border border-danger bg-danger-surface p-4 text-sm font-medium text-danger shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {itemCount > 0 && (
        <div className="[padding-bottom:max(1rem,env(safe-area-inset-bottom))] fixed inset-x-0 bottom-0 z-30 px-4 pt-3 sm:px-6">
          <Button
            onClick={onCart}
            size="lg"
            className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4" /> {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="flex items-center gap-2 text-sm">
              View order · {formatMoney(total)} <ChevronRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
