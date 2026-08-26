import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { notifyError } from "../../../shared/lib/notify";
import { useInventoryItems } from "../../inventory/hooks/useInventoryItems";
import { useMenuItemRecipe } from "../hooks/useMenuItemRecipe";
import { useSaveRecipe } from "../hooks/useSaveRecipe";
import type { InventoryItem, InventoryUnit } from "@pos/types";

const UNIT_OPTIONS: { value: InventoryUnit; label: string }[] = [
  { value: "KG", label: "kg" },
  { value: "GRAMS", label: "g" },
  { value: "LITERS", label: "L" },
  { value: "ML", label: "ml" },
  { value: "PIECES", label: "pcs" },
  { value: "PACKETS", label: "packets" },
];

interface Row {
  inventoryItemId: string;
  quantity: string;
  unit: InventoryUnit;
  isOptional: boolean;
}

export function RecipeBuilder({ itemId }: { itemId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: recipe, isLoading } = useMenuItemRecipe(itemId);
  // Same inventory list the Inventory page uses — shares its cache instead
  // of a duplicate ad-hoc query.
  const { data: inventoryItems } = useInventoryItems();
  const saveMutation = useSaveRecipe(itemId);

  useEffect(() => {
    if (recipe && !dirty) {
      setRows(
        recipe.map((r) => ({
          inventoryItemId: r.inventoryItemId,
          quantity: String(r.quantityRequired),
          unit: r.unit,
          isOptional: r.isOptional,
        })),
      );
    }
  }, [recipe, dirty]);

  function handleSave() {
    const ingredients = rows
      .filter((r) => r.inventoryItemId && parseFloat(r.quantity) >= 0)
      .map((r) => ({
        inventoryItemId: r.inventoryItemId,
        quantity: parseFloat(r.quantity) || 0,
        unit: r.unit,
        isOptional: r.isOptional,
      }));
    saveMutation.mutate(ingredients, { onSuccess: () => setDirty(false) });
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setDirty(true);
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(i: number) {
    setDirty(true);
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    const first = inventoryItems?.find(
      (inv) => !rows.some((r) => r.inventoryItemId === inv.id),
    );
    if (!first) {
      notifyError(
        undefined,
        rows.length
          ? "All inventory items are already in this recipe"
          : "No inventory items yet — add some from the Inventory page first",
      );
      return;
    }
    setDirty(true);
    setRows((prev) => [
      ...prev,
      {
        inventoryItemId: first.id,
        quantity: "1",
        unit: first.unit,
        isOptional: false,
      },
    ]);
  }

  const invMap = new Map<string, InventoryItem>(
    (inventoryItems ?? []).map((i) => [i.id, i] as const),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-text-primary">
          Ingredients (auto-deducts inventory when ordered)
        </span>
        <button
          onClick={handleSave}
          disabled={!dirty || saveMutation.isPending}
          className="text-xs font-medium text-primary hover:text-primary-hover disabled:text-text-disabled"
        >
          {saveMutation.isPending ? "Saving…" : dirty ? "Save recipe" : "Saved"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-text-disabled">Loading…</p>
      ) : !inventoryItems?.length ? (
        <p className="text-xs text-text-disabled">
          No inventory items set up yet for this branch — add some from the
          Inventory page, then come back to link them here.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const inv = invMap.get(row.inventoryItemId);
            const short =
              inv &&
              parseFloat(row.quantity || "0") > 0 &&
              inv.currentStock < parseFloat(row.quantity || "0");
            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.inventoryItemId}
                  onChange={(e) =>
                    updateRow(i, { inventoryItemId: e.target.value })
                  }
                  aria-label={`Ingredient ${i + 1}`}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {inventoryItems.map((inv2) => (
                    <option
                      key={inv2.id}
                      value={inv2.id}
                      disabled={rows.some(
                        (r, idx) => idx !== i && r.inventoryItemId === inv2.id,
                      )}
                    >
                      {inv2.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: e.target.value })}
                  aria-label={`Quantity for ingredient ${i + 1}`}
                  className="w-20 px-2 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={row.unit}
                  onChange={(e) =>
                    updateRow(i, { unit: e.target.value as InventoryUnit })
                  }
                  aria-label={`Unit for ingredient ${i + 1}`}
                  className="w-24 px-2 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-text-secondary whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={row.isOptional}
                    onChange={(e) =>
                      updateRow(i, { isOptional: e.target.checked })
                    }
                  />
                  optional
                </label>
                {!row.isOptional &&
                  (short ? (
                    <span title="Low stock">
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ))}
                <button
                  onClick={() => removeRow(i)}
                  aria-label={`Remove ingredient ${i + 1}`}
                  className="p-1 text-text-disabled hover:text-danger shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={addRow}
        className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" /> Add ingredient
      </button>
      <p className="text-xs text-text-disabled mt-2">
        Every non-optional ingredient is deducted automatically when this item
        is ordered. If stock runs out for any of them, the item flips to "Out of
        Stock" on its own — no need to toggle it by hand.
      </p>
    </div>
  );
}
