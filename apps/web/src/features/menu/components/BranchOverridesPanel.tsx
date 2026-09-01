import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { MENU_ITEM_STATUS_OPTIONS } from "@/features/menu/constants";
import { useBranches } from "@/features/branches/hooks/useBranches";
import { useMenuItemBranchOverrides } from "@/features/menu/hooks/useMenuItemBranchOverrides";
import { useSaveBranchOverride } from "@/features/menu/hooks/useSaveBranchOverride";
import { useResetBranchOverride } from "@/features/menu/hooks/useResetBranchOverride";
import type { MenuItemBranchOverride, MenuItemStatus } from "@pos/types";

interface Props {
  itemId: string;
  basePrice: number;
  baseTaxRate: number;
  basePrepTimeMinutes: number | null;
}

interface RowDraft {
  price: string;
  taxRate: string;
  prepTimeMinutes: string;
  status: MenuItemStatus | "";
  isHidden: boolean;
  availabilityReason: string;
}

const toDraft = (o: MenuItemBranchOverride | undefined): RowDraft => {
  return {
    price: o?.price != null ? String(o.price) : "",
    taxRate: o?.taxRate != null ? String(o.taxRate) : "",
    prepTimeMinutes:
      o?.prepTimeMinutes != null ? String(o.prepTimeMinutes) : "",
    status: o?.status ?? "",
    isHidden: o?.isHidden ?? false,
    availabilityReason: o?.availabilityReason ?? "",
  };
};

export const BranchOverridesPanel = ({
  itemId,
  basePrice,
  baseTaxRate,
  basePrepTimeMinutes,
}: Props) => {
  const { data: branches } = useBranches();
  const { data: overrides, isLoading } = useMenuItemBranchOverrides(itemId);

  const overrideByBranch = new Map(
    (overrides ?? []).map((o) => [o.branchId, o]),
  );

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RowDraft>(toDraft(undefined));

  const saveMutation = useSaveBranchOverride(itemId);
  const resetMutation = useResetBranchOverride(itemId);

  if (isLoading)
    return <p className="text-xs text-text-disabled">Loading branches…</p>;
  if (!branches?.length)
    return (
      <p className="text-xs text-text-disabled">No branches set up yet.</p>
    );

  return (
    <div>
      <label className="text-sm font-medium text-text-primary mb-1.5 block">
        Per-branch overrides{" "}
        <span className="font-normal text-text-disabled">
          (price, tax, prep time, status, or hide — leave blank to use the
          default above)
        </span>
      </label>
      <div className="space-y-1.5">
        {branches.map((b) => {
          const override = overrideByBranch.get(b.id);
          const isEditing = editingBranchId === b.id;
          return (
            <div key={b.id} className="border border-border rounded-md p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {b.name}
                  </span>
                  {override && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary-surface text-primary font-medium">
                      Overridden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary shrink-0">
                  {!isEditing && (
                    <>
                      <span>
                        ₹{override?.price != null ? override.price : basePrice}
                      </span>
                      <span>
                        {override?.isHidden
                          ? "Hidden"
                          : MENU_ITEM_STATUS_OPTIONS.find(
                              (o) => o.value === (override?.status ?? "ACTIVE"),
                            )?.label}
                      </span>
                      {override && (
                        <button
                          type="button"
                          onClick={() => resetMutation.mutate(b.id)}
                          className="text-text-disabled hover:text-danger"
                          title="Reset to default"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(toDraft(override));
                          setEditingBranchId(b.id);
                        }}
                        className="font-medium text-primary hover:text-primary-hover"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Price: ₹${basePrice}`}
                      value={draft.price}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, price: e.target.value }))
                      }
                      aria-label="Branch price override"
                      className="w-28 px-2 py-1.5 text-sm border border-border rounded-md"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Tax %: ${baseTaxRate}`}
                      value={draft.taxRate}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, taxRate: e.target.value }))
                      }
                      aria-label="Branch tax rate override"
                      className="w-24 px-2 py-1.5 text-sm border border-border rounded-md"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={`Prep min: ${basePrepTimeMinutes ?? "-"}`}
                      value={draft.prepTimeMinutes}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          prepTimeMinutes: e.target.value,
                        }))
                      }
                      aria-label="Branch prep time override (minutes)"
                      className="w-28 px-2 py-1.5 text-sm border border-border rounded-md"
                    />
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          status: e.target.value as MenuItemStatus | "",
                        }))
                      }
                      className="px-2 py-1.5 text-sm border border-border rounded-md"
                    >
                      <option value="">Default status</option>
                      {MENU_ITEM_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={draft.isHidden}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            isHidden: e.target.checked,
                          }))
                        }
                      />
                      Hide at this branch
                    </label>
                  </div>
                  <input
                    placeholder="Reason (optional)"
                    value={draft.availabilityReason}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        availabilityReason: e.target.value,
                      }))
                    }
                    aria-label="Branch override reason"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingBranchId(null)}
                      className="text-xs text-text-secondary hover:text-text-primary px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveMutation.mutate(
                          { branchId: b.id, input: draft },
                          { onSuccess: () => setEditingBranchId(null) },
                        )
                      }
                      disabled={saveMutation.isPending}
                      className="text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-hover disabled:opacity-40 px-3 py-1 rounded-md"
                    >
                      {saveMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
