import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@pos/ui";
import type { MenuItemVariant, ModifierGroup } from "@pos/types";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";

interface Props {
  variants: MenuItemVariant[];
  groups: ModifierGroup[];
}

function key(optionId: string, variantId: string) {
  return `${optionId}:${variantId}`;
}

/** G1 authoring surface: optional per-variant modifier upcharges. */
export function VariantModifierPricingPanel({ variants, groups }: Props) {
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const group of groups) {
      for (const option of group.options) {
        for (const variant of variants) {
          const scoped = option.variantPrices?.find((price) => price.variantId === variant.id);
          next[key(option.id, variant.id)] = scoped ? String(scoped.additionalPrice) : "";
        }
      }
    }
    setPrices(next);
  }, [groups, variants]);

  const variantIds = useMemo(() => new Set(variants.map((variant) => variant.id)), [variants]);
  const save = useMutation({
    mutationFn: async (group: ModifierGroup) => {
      await apiClient.patch(`/menu/modifier-groups/${group.id}`, {
        options: group.options.map((option) => ({
          id: option.id,
          name: option.name,
          additionalPrice: Number(option.additionalPrice),
          isAvailable: option.isAvailable,
          maxQuantity: option.maxQuantity,
          isDefault: option.isDefault ?? false,
          ...(option.replacesDefaultComponent ? { replacesDefaultComponent: option.replacesDefaultComponent } : {}),
          variantPrices: [
            ...(option.variantPrices ?? [])
              .filter((price) => !variantIds.has(price.variantId))
              .map((price) => ({ variantId: price.variantId, additionalPrice: Number(price.additionalPrice) })),
            ...variants.flatMap((variant) => {
              const raw = prices[key(option.id, variant.id)]?.trim();
              if (!raw) return [];
              const amount = Number(raw);
              return Number.isFinite(amount) && amount >= 0
                ? [{ variantId: variant.id, additionalPrice: amount }]
                : [];
            }),
          ],
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu", "modifier-groups"] });
      notifySuccess("Variant modifier prices saved");
    },
    onError: (error) => notifyError(error, "Failed to save variant modifier prices"),
  });

  if (!variants.length || !groups.length) return null;

  return (
    <section className="mt-4 space-y-4 rounded-lg border border-border p-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Price modifiers by variant</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Leave a cell blank to fall back to the option&apos;s flat upcharge.
        </p>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="space-y-3 rounded-md border border-divider p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-text-primary">{group.name}</p>
            <Button type="button" size="sm" variant="secondary" loading={save.isPending} onClick={() => save.mutate(group)}>
              Save variant prices
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead><tr className="text-text-secondary"><th className="py-1.5 pr-3">Option</th><th className="py-1.5 pr-3">Flat fallback</th>{variants.map((variant) => <th key={variant.id} className="py-1.5 pr-2">{variant.name}</th>)}</tr></thead>
              <tbody>
                {group.options.map((option) => (
                  <tr key={option.id} className="border-t border-divider align-top">
                    <td className="py-2 pr-3 font-medium text-text-primary">{option.name}</td>
                    <td className="py-2 pr-3 text-text-secondary">₹{Number(option.additionalPrice).toFixed(2)}</td>
                    {variants.map((variant) => (
                      <td key={variant.id} className="py-2 pr-2">
                        <Input
                          aria-label={`${option.name} price for ${variant.name}`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={`₹${Number(option.additionalPrice).toFixed(2)}`}
                          value={prices[key(option.id, variant.id)] ?? ""}
                          onChange={(event) => setPrices((current) => ({ ...current, [key(option.id, variant.id)]: event.target.value }))}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
