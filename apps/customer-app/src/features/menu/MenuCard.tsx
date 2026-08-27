import { memo } from "react";
import { Plus } from "lucide-react";
import { Card } from "@pos/ui";
import type { CustomerMenuItem } from "../../api";

import { formatMoney } from "../../shared/utils/money";

export const MenuCard = memo(function MenuCard({ item, onSelect, onQuickAdd }: { item: CustomerMenuItem; onSelect: (item: CustomerMenuItem) => void; onQuickAdd: (item: CustomerMenuItem) => void }) {
  const image = item.imageUrl ?? item.images[0]?.url;
  return (
    <Card padding="sm" className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => (item.variants.length || item.modifierGroupLinks.length ? onSelect(item) : onQuickAdd(item))}
        className="flex min-h-[128px] w-full gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-label={item.variants.length || item.modifierGroupLinks.length ? `Customize ${item.name}` : `Add ${item.name} to order`}
      >
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="h-28 w-28 shrink-0 self-center rounded-lg bg-surface-secondary object-cover sm:h-32 sm:w-32"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div aria-hidden="true" className="h-28 w-28 shrink-0 self-center rounded-lg bg-surface-secondary sm:h-32 sm:w-32" />
        )}
        <div className="min-w-0 flex-1 py-3 pr-3 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold tracking-tight text-text-primary">{item.name}</h3>
            <span className="shrink-0 font-semibold text-text-primary">{formatMoney(Number(item.basePrice))}</span>
          </div>
          {item.description && <p className="mt-1 line-clamp-2 text-sm leading-5 text-text-secondary">{item.description}</p>}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-medium ${item.foodType === "VEG" ? "text-success" : "text-text-secondary"}`}>{item.foodType === "VEG" ? "Vegetarian" : item.foodType === "EGG" ? "Contains egg" : "Non-vegetarian"}</span>
              {item.spiceLevel && item.spiceLevel !== "NONE" && <span className="text-xs text-text-secondary">· {item.spiceLevel.toLowerCase()} spice</span>}
              {item.allergenLinks?.map(({ allergen }) => <span key={allergen.id} className="text-xs text-warning">· {allergen.name}</span>)}
            </div>
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
            </span>
          </div>
        </div>
      </button>
    </Card>
  );
});
