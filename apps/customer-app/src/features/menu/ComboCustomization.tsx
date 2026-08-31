import { memo } from "react";
import { BottomSheet, Button } from "@pos/ui";
import type { CustomerCombo, CustomerMenuItem } from "./api";
import type { CustomerComboSelection } from "../cart/combo";
import { estimateComboLine } from "../cart/combo";
import { formatMoney } from "../../shared/utils/money";

type Props = {
  combo: CustomerCombo;
  menuById: Map<string, CustomerMenuItem>;
  selections: CustomerComboSelection[];
  onToggle: (slotId: string, optionId: string) => void;
  onClose: () => void;
  onAdd: () => void;
};

export const ComboCustomization = memo(function ComboCustomization({
  combo,
  menuById,
  selections,
  onToggle,
  onClose,
  onAdd,
}: Props) {
  const valid = combo.slots.every((slot) => {
    const count = selections.find((value) => value.slotId === slot.id)?.optionIds.length ?? 0;
    return count >= slot.minSelections && count <= slot.maxSelections;
  });
  const estimate = estimateComboLine({ combo, selections, quantity: 1 }, menuById);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={combo.name}
      description={combo.description ?? "Complete each combo choice before adding it to your order."}
      footer={
        <Button size="lg" disabled={!valid} onClick={onAdd} className="w-full sm:w-auto">
          Add combo · est. {formatMoney(estimate.subtotal)}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="rounded-lg bg-primary-surface p-3 text-sm text-primary">
          Combo prices shown here are estimates. Final pricing is recalculated by the restaurant when you place the order.
        </p>
        {combo.slots
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((slot, index) => {
            const chosen = selections.find((value) => value.slotId === slot.id)?.optionIds ?? [];
            return (
              <fieldset key={slot.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <legend className="font-semibold text-text-primary">Step {index + 1}: {slot.name}</legend>
                  <span className="text-xs text-text-secondary">Choose {slot.minSelections}{slot.maxSelections !== slot.minSelections ? `–${slot.maxSelections}` : ""}</span>
                </div>
                <div className="space-y-2">
                  {slot.options.map((option) => {
                    const item = menuById.get(option.menuItemId);
                    if (!item) return null;
                    const variant = option.variantId ? item.variants.find((value) => value.id === option.variantId) : undefined;
                    const selected = chosen.includes(option.id);
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => onToggle(slot.id, option.id)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${selected ? "border-primary bg-primary-surface" : "border-border bg-surface"}`}
                      >
                        <span>
                          <span className="block font-medium text-text-primary">{item.name}{variant ? ` · ${variant.name}` : ""}</span>
                          {Number(option.upcharge) > 0 && <span className="text-xs text-text-secondary">+{formatMoney(Number(option.upcharge))} upcharge</span>}
                        </span>
                        <span aria-hidden="true" className={`h-5 w-5 rounded-full border ${selected ? "border-primary bg-primary" : "border-border"}`} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
      </div>
    </BottomSheet>
  );
});
