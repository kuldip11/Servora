import { useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { Dialog, Button, TextInput } from "@pos/ui";
import { formatCurrency } from "../../../shared/utils/format";
import type { CartItem, SelectedModifier } from "../utils/cartTypes";
import type { MenuItem, ModifierGroup, ModifierOption } from "@pos/types";
import { itemCustomizationSchema } from "@pos/validation";

interface Props {
  item: MenuItem;
  existingCartItem?: CartItem;
  onConfirm: (item: CartItem) => void;
  courseMode?: boolean;
  onClose: () => void;
}

export function ItemCustomizerModal({
  item,
  existingCartItem,
  onConfirm,
  onClose,
  courseMode = false,
}: Props) {
  const hasVariants = item.variants?.length > 0;
  const groups: ModifierGroup[] = (item.modifierGroupLinks ?? []).map(
    (link) => link.group,
  );

  const [variantId, setVariantId] = useState(
    existingCartItem?.variantId ??
      (hasVariants ? (item.variants?.[0]?.id ?? "") : ""),
  );
  const [selections, setSelections] = useState<
    Record<string, SelectedModifier[]>
  >(() => {
    const initial: Record<string, SelectedModifier[]> = {};
    for (const mod of existingCartItem?.modifiers ?? []) {
      (initial[mod.groupId] ??= []).push(mod);
    }
    return initial;
  });
  const [chefNotes, setChefNotes] = useState(existingCartItem?.chefNotes ?? "");
  const [seatLabel, setSeatLabel] = useState(existingCartItem?.seatLabel ?? "");
  const [quantity, setQuantity] = useState(existingCartItem?.quantity ?? 1);
  const [courseNumber, setCourseNumber] = useState(existingCartItem?.courseNumber ?? 1);
  const [validationError, setValidationError] = useState("");

  const basePrice = Number(item.basePrice);
  const selectedVariant = item.variants?.find((v) => v.id === variantId);

  const priceBeforeModifiers = selectedVariant
    ? Number(selectedVariant.price)
    : basePrice;
  const allSelectedModifiers = Object.values(selections).flat();
  const modifiersPrice = allSelectedModifiers.reduce(
    (s, m) => s + m.price * m.quantity,
    0,
  );
  const unitPrice = priceBeforeModifiers + modifiersPrice;

  function selectOption(group: ModifierGroup, option: ModifierOption) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const already = current.find((m) => m.optionId === option.id);

      if (group.selectionType === "SINGLE") {
        if (already) return { ...prev, [group.id]: [] };
        return {
          ...prev,
          [group.id]: [
            {
              optionId: option.id,
              groupId: group.id,
              groupName: group.name,
              name: option.name,
              price: Number(option.additionalPrice),
              quantity: 1,
            },
          ],
        };
      }

      if (already) {
        return {
          ...prev,
          [group.id]: current.filter((m) => m.optionId !== option.id),
        };
      }
      if (
        group.maxSelections != null &&
        current.length >= group.maxSelections
      ) {
        return prev;
      }
      return {
        ...prev,
        [group.id]: [
          ...current,
          {
            optionId: option.id,
            groupId: group.id,
            groupName: group.name,
            name: option.name,
            price: Number(option.additionalPrice),
            quantity: 1,
          },
        ],
      };
    });
  }

  function setOptionQuantity(
    group: ModifierGroup,
    option: ModifierOption,
    qty: number,
  ) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const clamped = Math.max(1, Math.min(qty, option.maxQuantity ?? 1));
      return {
        ...prev,
        [group.id]: current.map((m) =>
          m.optionId === option.id ? { ...m, quantity: clamped } : m,
        ),
      };
    });
  }

  const unmetGroup = groups.find(
    (g) => (selections[g.id]?.length ?? 0) < g.minSelections,
  );

  function handleConfirm() {
    if (unmetGroup) return;
    const parsed = itemCustomizationSchema.safeParse({
      menuItemId: item.id,
      ...(variantId && { variantId }),
      quantity,
      chefNotes,
      seatLabel,
      selectedOptions: allSelectedModifiers.map((m) => ({
        optionId: m.optionId,
        quantity: m.quantity,
      })),
    });
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Please review the item options.",
      );
      return;
    }
    setValidationError("");
    onConfirm({
      menuItemId: item.id,
      menuItemName: item.name,
      basePrice,
      ...(variantId && { variantId }),
      ...(selectedVariant?.name !== undefined && {
        variantName: selectedVariant.name,
      }),
      modifiers: allSelectedModifiers,
      chefNotes,
      seatLabel,
      quantity,
      ...(courseMode ? { courseNumber } : {}),
      unitPrice,
    });
    onClose();
  }

  return (
    <Dialog
      open
      title={item.name}
      onClose={onClose}
      size="md"
      footer={
        <div className="w-full">
          {validationError && (
            <p className="text-xs text-danger text-center mb-2">
              {validationError}
            </p>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!!unmetGroup}
            className="w-full justify-between"
          >
            <span>{existingCartItem ? "Update Item" : "Add to Order"}</span>
            <span>{formatCurrency(unitPrice * quantity)}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {courseMode && <label className="block text-sm font-medium text-text-primary">Course
          <select className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" value={courseNumber} onChange={(event) => setCourseNumber(Number(event.target.value))}>
            {[1,2,3,4,5].map((course) => <option key={course} value={course}>Course {course}</option>)}
          </select>
        </label>}
        {
                                 }
        <p className="text-sm text-primary font-semibold -mt-1">
          {formatCurrency(unitPrice)} × {quantity} ={" "}
          {formatCurrency(unitPrice * quantity)}
        </p>

        {              }
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Quantity
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center bg-surface-secondary rounded-full"
            >
              <Minus className="w-4 h-4 text-text-primary" />
            </button>
            <span className="text-lg font-bold text-text-primary w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 flex items-center justify-center bg-primary rounded-full"
            >
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {              }
        {hasVariants && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Size / Variant
            </p>
            <div className="space-y-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  disabled={(v.manualOverrideStatus ?? v.status ?? "ACTIVE") !== "ACTIVE"}
                  onClick={() => setVariantId(v.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    variantId === v.id
                      ? "border-primary bg-primary-surface"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        variantId === v.id
                          ? "border-primary"
                          : "border-text-disabled"
                      }`}
                    >
                      {variantId === v.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {v.name}{(v.manualOverrideStatus ?? v.status ?? "ACTIVE") !== "ACTIVE" ? " — 86'd" : ""}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {formatCurrency(Number(v.price))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {                     }
        {groups.filter((group) => !group.dependsOnOptionId || Object.values(selections).flat().some((option) => option.optionId === group.dependsOnOptionId)).map((group) => {
          const picked = selections[group.id] ?? [];
          const atCap =
            group.maxSelections != null && picked.length >= group.maxSelections;
          return (
            <div key={group.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {group.name}
                </p>
                <span
                  className={`text-[11px] font-medium ${group.minSelections > 0 ? "text-warning" : "text-text-disabled"}`}
                >
                  {group.minSelections > 0
                    ? `Required · choose ${group.minSelections}${group.maxSelections ? `–${group.maxSelections}` : "+"}`
                    : group.selectionType === "SINGLE"
                      ? "Optional · choose 1"
                      : `Optional${group.maxSelections ? ` · up to ${group.maxSelections}` : ""}`}
                </span>
              </div>
              <div className="space-y-2">
                {group.options
                  .filter((o) => o.isAvailable)
                  .map((option) => {
                    const selected = picked.find(
                      (m) => m.optionId === option.id,
                    );
                    const disabled =
                      !selected && group.selectionType === "MULTIPLE" && atCap;
                    return (
                      <div
                        key={option.id}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all ${
                          selected
                            ? "border-primary bg-primary-surface"
                            : disabled
                              ? "border-divider opacity-40"
                              : "border-border"
                        }`}
                      >
                        <button
                          onClick={() =>
                            !disabled && selectOption(group, option)
                          }
                          disabled={disabled}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          <div
                            className={`flex items-center justify-center border-2 ${
                              group.selectionType === "SINGLE"
                                ? "w-4 h-4 rounded-full"
                                : "w-4 h-4 rounded"
                            } ${selected ? "border-primary bg-primary" : "border-text-disabled"}`}
                          >
                            {selected &&
                              (group.selectionType === "SINGLE" ? (
                                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                              ) : (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              ))}
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {option.name}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          {selected && option.maxQuantity > 1 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  setOptionQuantity(
                                    group,
                                    option,
                                    selected.quantity - 1,
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-surface-secondary rounded-full text-text-secondary"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-semibold w-4 text-center">
                                {selected.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  setOptionQuantity(
                                    group,
                                    option,
                                    selected.quantity + 1,
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-primary rounded-full text-primary-foreground"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className="text-sm text-text-secondary min-w-[3.5rem] text-right">
                            {Number(option.additionalPrice) > 0
                              ? `+${formatCurrency(Number(option.additionalPrice))}`
                              : "Free"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {
                                                                }
        {(item.allergenLinks?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(item.allergenLinks ?? []).map((l) => (
              <span
                key={l.allergenId}
                className="text-[11px] font-medium px-2 py-1 rounded-full border border-danger/20 bg-danger-surface text-danger"
              >
                ⚠ {l.allergen.name}
              </span>
            ))}
          </div>
        )}

        {                                                                        }
        <TextInput
          label="Seat / diner (optional)"
          placeholder="e.g. Seat 1 or Priya"
          value={seatLabel}
          onChange={(e) => setSeatLabel(e.target.value)}
        />
        <TextInput
          label="Note for Chef"
          placeholder="e.g. no onion, extra spicy, gluten-free…"
          value={chefNotes}
          onChange={(e) => setChefNotes(e.target.value)}
        />

        {unmetGroup && (
          <p className="text-xs text-warning text-center">
            Choose {unmetGroup.minSelections} from "{unmetGroup.name}" to
            continue
          </p>
        )}
      </div>
    </Dialog>
  );
}
