import type { Dispatch, SetStateAction } from "react";
import {
  ChevronRight,
  Clock3,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Button, EmptyState, IconButton, SearchInput } from "@pos/ui";
import type { CustomerCombo, CustomerMenuItem } from "@/api";
import { formatMoney } from "@/shared/utils/money";
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

const itemImage = (item: CustomerMenuItem) =>
  item.imageUrl ?? item.images[0]?.url;

const itemPrice = (item: CustomerMenuItem) => {
  if (item.pricingMode === "OPEN") return "Staff priced";
  if (item.pricingMode === "WEIGHT_BASED") {
    return `${formatMoney(Number(item.basePrice))}/${String(item.weightUnit ?? "unit").toLowerCase()}`;
  }
  return formatMoney(Number(item.basePrice));
};

export const CustomerMenuView = ({
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
}: CustomerMenuViewProps) => {
  const showFeature =
    category === "Popular" && !search && visibleItems.length > 0;
  const featuredItem = showFeature ? visibleItems[0] : undefined;
  const menuItems = featuredItem ? visibleItems.slice(1) : visibleItems;
  const featuredImage = featuredItem ? itemImage(featuredItem) : undefined;

  return (
    <div className="customer-experience min-h-screen text-text-primary selection:bg-primary-surface">
      <header className="bg-[#174d34] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pb-7 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">
                Welcome to
              </p>
              <h1 className="customer-display mt-1 truncate text-[2rem] font-bold leading-none sm:text-4xl">
                {session.restaurant}
              </h1>
              <p className="mt-2 text-sm text-white/70">
                {session.mode === "DINE_IN"
                  ? "Good to have you — order whenever you're ready."
                  : "Order ahead and we'll have it ready for pickup."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {placedOrder && (
                <IconButton
                  aria-label="View live order status"
                  icon={ReceiptText}
                  size="lg"
                  onClick={onViewOrder}
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                />
              )}
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                {session.mode === "DINE_IN"
                  ? `Table ${session.table ?? "—"}`
                  : "Takeaway"}
              </div>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(4,25,14,0.25)] [&_input]:bg-white [&_input]:text-[#17251d] [&_input]:placeholder:text-[#7d8780]">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search dishes, drinks or ingredients"
              aria-label="Search the menu"
              className="border-0"
            />
          </div>
        </div>
      </header>

      <nav
        aria-label="Menu categories"
        className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl"
      >
        <div className="customer-scrollbar-hidden mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {categories.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCategory(option.name)}
              aria-current={category === option.name ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                category === option.name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary"
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-36 pt-6 sm:px-6 sm:pb-32 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d45d24]">
              {search ? "Search results" : "Tonight's menu"}
            </p>
            <h2 className="customer-display mt-1 text-3xl font-bold tracking-tight">
              {search ? `“${search}”` : category}
            </h2>
          </div>
          <span className="pb-1 text-xs text-text-secondary">
            {visibleItems.length}{" "}
            {visibleItems.length === 1 ? "dish" : "dishes"}
          </span>
        </div>

        {featuredItem && (
          <button
            type="button"
            onClick={() => onOpenItem(featuredItem)}
            className="group relative mb-7 min-h-52 w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-[#d96b31] to-[#87331e] p-5 text-left text-white shadow-[0_14px_32px_rgba(93,37,18,0.22)] sm:min-h-64 sm:p-7"
          >
            {featuredImage && (
              <img
                src={featuredImage}
                alt=""
                className="absolute inset-y-0 right-0 h-full w-[48%] object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_30%)]"
                loading="eager"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
            <div className="relative z-10 flex min-h-40 flex-col items-start sm:min-h-48">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] backdrop-blur">
                <Sparkles className="h-3 w-3" /> Popular tonight
              </span>
              <h3 className="customer-display mt-4 max-w-[65%] text-2xl font-bold leading-tight sm:text-4xl">
                {featuredItem.name}
              </h3>
              {featuredItem.description && (
                <p className="mt-2 line-clamp-2 max-w-[64%] text-xs leading-5 text-white/75 sm:text-sm">
                  {featuredItem.description}
                </p>
              )}
              <div className="mt-auto flex w-full items-end justify-between pt-5">
                <strong className="text-base">{itemPrice(featuredItem)}</strong>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#87331e] shadow-lg transition-transform group-hover:scale-105">
                  <Plus className="h-5 w-5" />
                </span>
              </div>
            </div>
          </button>
        )}

        {combos.length > 0 && !search && category === "Popular" && (
          <section className="mb-7">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d45d24]">
                  Set meals
                </p>
                <h3 className="customer-display mt-1 text-2xl font-bold">
                  Made to share
                </h3>
              </div>
              <span className="text-xs text-text-secondary">
                Choose step by step
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {combos.map((combo) => (
                <button
                  key={combo.id}
                  type="button"
                  onClick={() => onOpenCombo(combo)}
                  className="flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f4dfbd] text-[#8b4b24]">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-text-primary">
                      {combo.name}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-text-secondary">
                      {combo.description ??
                        `${combo.slots.length} guided choices`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {combo.pricePolicy === "FIXED"
                      ? `${formatMoney(Number(combo.fixedPrice ?? 0))}+`
                      : `${Number(combo.percentOff ?? 0)}% off`}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {menuItems.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h3 className="customer-display text-2xl font-bold">
                {featuredItem ? "More to explore" : "Choose your dish"}
              </h3>
              <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                <Clock3 className="h-3 w-3" /> Freshly prepared
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {menuItems.map((item) => (
                <MenuCard key={item.id} item={item} onSelect={onOpenItem} />
              ))}
            </div>
          </section>
        )}

        {visibleItems.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface py-8">
            <EmptyState
              icon={Search}
              title="No dishes found"
              description="Try another category or a different search term."
              size="sm"
            />
          </div>
        )}
      </main>

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-xl rounded-2xl border border-danger bg-danger-surface p-4 text-sm font-medium text-danger shadow-xl"
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
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-7 sm:px-6">
          <button
            type="button"
            onClick={onCart}
            className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between rounded-2xl bg-primary px-5 text-primary-foreground shadow-[0_16px_35px_rgba(14,58,36,0.32)] transition hover:bg-primary-hover"
          >
            <span className="text-left">
              <span className="block text-sm font-bold">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="block text-[11px] opacity-75">
                Ready to review
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm font-bold">
              View order · {formatMoney(total)}{" "}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
