import { memo } from "react";
import { Flame, Leaf, Plus } from "lucide-react";
import type { CustomerMenuItem } from "@/api";
import { formatMoney } from "@/shared/utils/money";

export const MenuCard = memo(function MenuCard({
  item,
  onSelect,
}: {
  item: CustomerMenuItem;
  onSelect: (item: CustomerMenuItem) => void;
}) {
  const image = item.imageUrl ?? item.images[0]?.url;
  const detail =
    item.modifierGroupLinks.length > 0 || item.variants.length > 0
      ? "Customizable"
      : item.manualStockCount != null && item.manualStockCount <= 5
        ? `Only ${item.manualStockCount} left`
        : "Ready to order";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group grid min-h-[132px] w-full grid-cols-[112px_minmax(0,1fr)_40px] items-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-2.5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:grid-cols-[124px_minmax(0,1fr)_40px]"
      aria-label={`Customize ${item.name}`}
    >
      {image ? (
        <img
          src={image}
          alt={item.name}
          className="h-28 w-28 rounded-xl bg-surface-secondary object-cover sm:h-[124px] sm:w-[124px]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid h-28 w-28 place-items-center rounded-xl bg-gradient-to-br from-[#f2dfb7] to-[#ddb777] text-[#8b4b24] sm:h-[124px] sm:w-[124px]"
        >
          {item.foodType === "VEG" ? (
            <Leaf className="h-8 w-8" />
          ) : (
            <Flame className="h-8 w-8" />
          )}
        </div>
      )}
      <span className="min-w-0 py-1">
        <span className="block font-bold leading-tight text-text-primary">
          {item.name}
        </span>
        {item.description && (
          <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-text-secondary">
            {item.description}
          </span>
        )}
        <span className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <strong className="text-sm text-text-primary">
            {item.pricingMode === "OPEN"
              ? "Staff priced"
              : item.pricingMode === "WEIGHT_BASED"
                ? `${formatMoney(Number(item.basePrice))}/${String(item.weightUnit ?? "unit").toLowerCase()}`
                : formatMoney(Number(item.basePrice))}
          </strong>
          <span className="text-[10px] font-medium text-text-secondary">
            {detail}
          </span>
        </span>
      </span>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
        <Plus className="h-4 w-4" />
      </span>
    </button>
  );
});
