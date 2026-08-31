import { BottomSheet, Button } from "@pos/ui";
import type {
  WaiterCombo,
  WaiterComboMenuItem,
  WaiterComboSelection,
} from "@/features/menu/combo";
import { estimateComboSubtotal } from "@/features/menu/combo";

interface Props {
  combo: WaiterCombo;
  menuById: Map<string, WaiterComboMenuItem>;
  selections: WaiterComboSelection[];
  onToggle: (slotId: string, optionId: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export const ComboCustomiser = ({
  combo,
  menuById,
  selections,
  onToggle,
  onAdd,
  onClose,
}: Props) => {
  const valid = combo.slots.every((slot) => {
    const count =
      selections.find((value) => value.slotId === slot.id)?.optionIds.length ??
      0;
    return count >= slot.minSelections && count <= slot.maxSelections;
  });
  const estimate = estimateComboSubtotal(
    { combo, quantity: 1, selections },
    menuById,
  );

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={combo.name}
      description={
        combo.description ??
        "Complete each combo choice before adding it to the order."
      }
      footer={
        <Button
          className="w-full rounded-2xl py-4"
          disabled={!valid}
          onClick={onAdd}
        >
          Add combo · est. ₹{estimate.toFixed(2)}
        </Button>
      }
    >
      <div className="space-y-5">
        <p className="rounded-xl bg-primary-surface p-3 text-xs text-primary">
          Estimated price only. The server recalculates every component and the
          final combo price when the order is placed.
        </p>
        {combo.slots
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((slot, index) => {
            const selected =
              selections.find((value) => value.slotId === slot.id)?.optionIds ??
              [];
            return (
              <fieldset key={slot.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <legend className="text-sm font-semibold text-text-primary">
                    Step {index + 1}: {slot.name}
                  </legend>
                  <span className="text-xs text-text-disabled">
                    Choose {slot.minSelections}
                    {slot.maxSelections !== slot.minSelections
                      ? `–${slot.maxSelections}`
                      : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {slot.options.map((option) => {
                    const item = menuById.get(option.menuItemId);
                    if (!item) return null;
                    const variant = option.variantId
                      ? item.variants?.find(
                          (value) => value.id === option.variantId,
                        )
                      : undefined;
                    const checked = selected.includes(option.id);
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => onToggle(slot.id, option.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${checked ? "border-primary bg-primary-surface" : "border-border bg-surface"}`}
                      >
                        <span>
                          <span className="block text-sm font-medium text-text-primary">
                            {item.name}
                            {variant ? ` · ${variant.name}` : ""}
                          </span>
                          {Number(option.upcharge) > 0 && (
                            <span className="text-xs text-text-secondary">
                              +₹{Number(option.upcharge).toFixed(2)} upcharge
                            </span>
                          )}
                        </span>
                        <span
                          className={`h-5 w-5 rounded-full border ${checked ? "border-primary bg-primary" : "border-border"}`}
                          aria-hidden="true"
                        />
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
};
