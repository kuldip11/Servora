import { useState, useEffect } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { BottomSheet, Button, TextInput } from "@pos/ui";
import type { SelectedModifier, CartItem } from "../types";
import { COURSE_LABELS } from "../constants";
import { itemCustomizationSchema } from "@pos/validation";

interface Props {
  item: any;
  existingCartItem?: CartItem;
  onConfirm: (item: CartItem) => void;
  onClose: () => void;
}

/**
 * Design-system Phase 11, Sprint WA-2. The other of the 2 hand-rolled
 * `fixed inset-0` overlays this app owed the audit (`CartSummary.tsx`
 * is the first) — full rewrite onto `BottomSheet` (Phase 5/11), not a
 * drop-in swap. Mirrors `apps/web/src/features/orders/components/
 * ItemCustomizerModal.tsx` (Sprint AD-8's rewrite of the same-purpose
 * Admin component — that file's own doc comment named this one as its
 * Waiter App counterpart, at the time still unmigrated) — both apps
 * enforce the identical selection rules (min/max per group, absolute
 * variant pricing), so this rewrite reuses the same tokenization
 * choices where the two files overlap, for one exception: this version
 * additionally has a Course selector and surfaces both tags and
 * allergens (Admin's has neither — no per-item "course" concept on
 * that side, and it only lists allergens, not tags).
 *
 * **Not migrated onto a `packages/ui` selection primitive, deliberately
 * — same reasoning as the Admin twin:** the quantity stepper and the
 * variant/modifier/course "choice chip" cards are a bespoke
 * always-visible selection UI, not a collapsed-trigger-plus-popover
 * shape (`SelectMenu`/`MultiSelect`/Phase 4), since the live running
 * total needs every option visible at once. Only color literals moved
 * onto tokens.
 *
 * **Header, flagged not silent — same call as the Admin twin:**
 * `BottomSheet`'s `title` prop is `string`-typed, so it can't hold the
 * two-line "item name + live price" header this component had before.
 * `title={item.name}` stays plain text; the live unit-price/total line
 * moved to the top of the scrollable body instead.
 *
 * **Radius, flagged not silent — a real gap, not silently absorbed:**
 * the original panel was `rounded-t-3xl` (24px). `BottomSheet` renders
 * `rounded-t-xl` (16px, `--radius-lg`) and — unlike `Card` (Phase 2,
 * which does accept a `className` override, used for the same
 * 24px-vs-16px gap in `OrderCard`/`HomePage`, Sprint WA-1) —
 * `BottomSheetProps` exposes no `className`/style passthrough for its
 * panel at all. So this one renders a step less rounded than before,
 * genuinely, not papered over. Worth flagging to whoever owns
 * `packages/ui` next as a real prop gap (`BottomSheet` taking a
 * `className` the same way `Dialog` implicitly can via its shared
 * `overlayPanelClasses`), not something this page-migration sprint
 * can fix from the outside.
 */
export function ItemCustomiser({
  item,
  existingCartItem,
  onConfirm,
  onClose,
}: Props) {
  const hasVariants = item.variants?.length > 0;
  // Each link is { modifierGroupId, group: { id, name, selectionType, minSelections, maxSelections, options } }
  const groups: any[] = (item.modifierGroupLinks ?? []).map(
    (l: any) => l.group,
  );
  const hasModifierGroups = groups.length > 0;

  const [variantId, setVariantId] = useState(
    existingCartItem?.variantId ?? (hasVariants ? item.variants[0].id : ""),
  );
  // groupId -> selected modifiers (list, since a MULTIPLE group can have more than one)
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
  const [course, setCourse] = useState<1 | 2 | 3>(
    existingCartItem?.course ?? 1,
  );
  const [quantity, setQuantity] = useState(existingCartItem?.quantity ?? 1);

  const selectedVariant = item.variants?.find((v: any) => v.id === variantId);
  // Variants (Half/Full etc.) are independently-priced options, not
  // add-ons — picking one REPLACES the base price rather than adding to it.
  // This was the root cause of the variant pricing bug: base 200 + "Half"
  // entered as 200 was showing 400 instead of 200. Modifiers stay additive.
  const priceBeforeModifiers = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(item.basePrice);
  const allSelectedModifiers = Object.values(selections).flat();
  const modifiersPrice = allSelectedModifiers.reduce(
    (s, m) => s + m.price * m.quantity,
    0,
  );
  const unitPrice = priceBeforeModifiers + modifiersPrice;

  // If no customisation needed at all, auto-confirm immediately.
  useEffect(() => {
    if (!hasVariants && !hasModifierGroups && !existingCartItem) {
      onConfirm({
        menuItemId: item.id,
        name: item.name,
        basePrice: parseFloat(item.basePrice),
        modifiers: [],
        chefNotes: "",
        course: 1,
        quantity: 1,
        unitPrice: parseFloat(item.basePrice),
      });
      onClose();
    }
  }, []);

  if (!hasVariants && !hasModifierGroups && !existingCartItem) return null;

  function selectOption(group: any, option: any) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const already = current.find((m) => m.optionId === option.id);

      if (group.selectionType === "SINGLE") {
        // Radio behaviour — picking one replaces whatever was picked in this group.
        if (already) return { ...prev, [group.id]: [] };
        return {
          ...prev,
          [group.id]: [
            {
              optionId: option.id,
              groupId: group.id,
              groupName: group.name,
              name: option.name,
              price: parseFloat(option.additionalPrice),
              quantity: 1,
            },
          ],
        };
      }

      // MULTIPLE — checkbox behaviour, respecting the group's max selections.
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
        return prev; // at the cap — ignore further taps until one is removed
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
            price: parseFloat(option.additionalPrice),
            quantity: 1,
          },
        ],
      };
    });
  }

  function setOptionQuantity(group: any, option: any, qty: number) {
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

  // A required group (minSelections > 0) that doesn't yet meet its minimum
  // blocks confirming — mirrors the same rule the API enforces server-side.
  const unmetGroup = groups.find(
    (g) => (selections[g.id]?.length ?? 0) < g.minSelections,
  );

  function handleConfirm() {
    if (unmetGroup) return;

    const validated = itemCustomizationSchema.safeParse({
      menuItemId: item.id,
      variantId: variantId || undefined,
      quantity,
      chefNotes,
      selectedOptions: allSelectedModifiers.map((m) => ({
        optionId: m.optionId,
        quantity: m.quantity,
      })),
    });
    if (!validated.success) return;

    onConfirm({
      menuItemId: item.id,
      name: item.name,
      basePrice: parseFloat(item.basePrice),
      variantId: variantId || undefined,
      variantName: selectedVariant?.name,
      modifiers: allSelectedModifiers,
      chefNotes,
      course,
      quantity,
      unitPrice,
    });
    onClose();
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={item.name}
      footer={
        <Button
          onClick={handleConfirm}
          disabled={!!unmetGroup}
          className="w-full rounded-2xl py-4 justify-between"
        >
          <span>{existingCartItem ? "Update Item" : "Add to Order"}</span>
          <span>₹{(unitPrice * quantity).toFixed(2)}</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Live price — see file-level doc comment on why this isn't in
            the BottomSheet header. */}
        <p className="text-sm text-primary font-semibold -mt-1">
          ₹{unitPrice.toFixed(2)} × {quantity} = ₹
          {(unitPrice * quantity).toFixed(2)}
        </p>

        {/* Quantity */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Quantity
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center bg-surface-secondary rounded-full"
            >
              <Minus className="w-4 h-4 text-text-primary" />
            </button>
            <span className="text-xl font-bold text-text-primary w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center bg-primary rounded-full"
            >
              <Plus className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Variants */}
        {hasVariants && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Size / Variant
            </p>
            <div className="space-y-2">
              {item.variants.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
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
                      {v.name}
                    </span>
                  </div>
                  {parseFloat(v.price) > 0 && (
                    <span className="text-sm text-text-secondary">
                      ₹{parseFloat(v.price).toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifier groups — e.g. "Choose your sides" (Aachar/Curd/Raita), "Extras" */}
        {groups.map((group) => {
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
                  .filter((o: any) => o.isAvailable)
                  .map((option: any) => {
                    const selected = picked.find(
                      (m) => m.optionId === option.id,
                    );
                    const disabled =
                      !selected && group.selectionType === "MULTIPLE" && atCap;
                    return (
                      <div
                        key={option.id}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
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
                            {parseFloat(option.additionalPrice) > 0
                              ? `+₹${parseFloat(option.additionalPrice).toFixed(2)}`
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

        {/* Allergens & tags — surfaced here so whoever's taking the order
            can flag them for the guest, not just in the back-office menu editor. */}
        {((item.allergenLinks?.length ?? 0) > 0 ||
          (item.tagLinks?.length ?? 0) > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {item.tagLinks?.map((l: any) => (
              <span
                key={l.tagId}
                className="text-[11px] font-medium px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: l.tag.color ?? "#8b5cf6" }}
              >
                {l.tag.name}
              </span>
            ))}
            {item.allergenLinks?.map((l: any) => (
              <span
                key={l.allergenId}
                className="text-[11px] font-medium px-2 py-1 rounded-full border border-danger/20 bg-danger-surface text-danger"
              >
                ⚠ {l.allergen.name}
              </span>
            ))}
          </div>
        )}

        {/* Course */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Course
          </p>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCourse(c)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  course === c
                    ? "border-primary bg-primary-surface text-primary"
                    : "border-border text-text-secondary"
                }`}
              >
                {COURSE_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Chef note — genuine TextInput drop-in, same as the Admin twin. */}
        <TextInput
          label="Note for Chef"
          placeholder="e.g. no onion, extra spicy, gluten-free…"
          value={chefNotes}
          onChange={(e) => setChefNotes(e.target.value)}
          className="rounded-xl bg-surface-secondary"
        />

        {unmetGroup && (
          <p className="text-xs text-warning text-center">
            Choose {unmetGroup.minSelections} from "{unmetGroup.name}" to
            continue
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
