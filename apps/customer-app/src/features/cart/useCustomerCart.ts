import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CustomerCombo, CustomerMenuItem } from "@/api";
import {
  comboLineKey,
  estimateComboLine,
  type ComboCartLine,
  type CustomerComboSelection,
} from "./combo";
import {
  canAddItemConfiguration,
  normalizeSelectedOptions,
} from "./configuration";
import {
  getCartLineKey,
  getCartSummary,
  type CartLine,
  type SelectedOption,
} from "./pricing";

type FulfillmentType = "DINE_IN" | "TAKEAWAY";

type UseCustomerCartInput = {
  menu: CustomerMenuItem[];
  cart: CartLine[];
  setCart: Dispatch<SetStateAction<CartLine[]>>;
  sessionMode: FulfillmentType;
  clearError: () => void;
};

export const useCustomerCart = ({
  menu,
  cart,
  setCart,
  sessionMode,
  clearError,
}: UseCustomerCartInput) => {
  const [comboCart, setComboCart] = useState<ComboCartLine[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<CustomerCombo | null>(
    null,
  );
  const [comboSelections, setComboSelections] = useState<
    CustomerComboSelection[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<CustomerMenuItem | null>(
    null,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedFulfillmentType, setSelectedFulfillmentType] =
    useState<FulfillmentType>(sessionMode);

  const menuById = useMemo(
    () => new Map(menu.map((item) => [item.id, item] as const)),
    [menu],
  );

  const summary = useMemo(() => {
    const cartSummary = getCartSummary(cart);
    const comboSummary = comboCart.reduce(
      (current, line) => {
        const estimate = estimateComboLine(line, menuById);
        current.subtotal += estimate.subtotal;
        current.tax += estimate.tax;
        current.total += estimate.total;
        current.itemCount += line.quantity;
        return current;
      },
      { subtotal: 0, tax: 0, total: 0, itemCount: 0 },
    );
    return {
      subtotal: cartSummary.subtotal + comboSummary.subtotal,
      tax: cartSummary.tax + comboSummary.tax,
      total: cartSummary.total + comboSummary.total,
      itemCount: cartSummary.itemCount + comboSummary.itemCount,
    };
  }, [cart, comboCart, menuById]);

  const openItem = useCallback(
    (item: CustomerMenuItem) => {
      setSelectedItem(item);
      setSelectedVariantId(
        item.variants.length === 1 ? item.variants[0]?.id : undefined,
      );
      setSelectedOptions([]);
      setSelectedFulfillmentType(sessionMode);
      clearError();
    },
    [clearError, sessionMode],
  );

  const closeItem = useCallback(() => {
    setSelectedItem(null);
    setSelectedVariantId(undefined);
    setSelectedOptions([]);
    setSelectedFulfillmentType(sessionMode);
  }, [sessionMode]);

  const toggleOption = useCallback(
    (
      optionId: string,
      groupId: string,
      zoneLabel?: "LEFT" | "RIGHT" | "WHOLE",
    ) => {
      const group = selectedItem?.modifierGroupLinks.find(
        ({ group: value }) => value.id === groupId,
      )?.group;
      if (!group) return;
      setSelectedOptions((current) => {
        const normalizedZone = zoneLabel ?? "WHOLE";
        const existing = current.find(
          (selection) =>
            selection.optionId === optionId &&
            (selection.zoneLabel ?? "WHOLE") === normalizedZone,
        );
        if (existing) {
          return current.filter(
            (selection) =>
              !(
                selection.optionId === optionId &&
                (selection.zoneLabel ?? "WHOLE") === normalizedZone
              ),
          );
        }
        if (group.selectionType === "SINGLE") {
          return [
            ...current.filter(
              (selection) =>
                !(
                  group.options.some(
                    (option) => option.id === selection.optionId,
                  ) && (selection.zoneLabel ?? "WHOLE") === normalizedZone
                ),
            ),
            { optionId, quantity: 1, ...(zoneLabel ? { zoneLabel } : {}) },
          ];
        }
        const selectedCount = current.filter(
          (selection) =>
            group.options.some((option) => option.id === selection.optionId) &&
            (selection.zoneLabel ?? "WHOLE") === normalizedZone,
        ).length;
        if (
          group.maxSelections != null &&
          selectedCount >= group.maxSelections
        ) {
          return current;
        }
        return [
          ...current,
          { optionId, quantity: 1, ...(zoneLabel ? { zoneLabel } : {}) },
        ];
      });
    },
    [selectedItem],
  );

  const changeOptionQuantity = useCallback(
    (
      optionId: string,
      delta: number,
      zoneLabel?: "LEFT" | "RIGHT" | "WHOLE",
    ) => {
      setSelectedOptions((current) =>
        current.flatMap((selection) => {
          if (
            selection.optionId !== optionId ||
            (selection.zoneLabel ?? "WHOLE") !== (zoneLabel ?? "WHOLE")
          ) {
            return [selection];
          }
          const option = selectedItem?.modifierGroupLinks
            .flatMap(({ group }) => group.options)
            .find((value) => value.id === optionId);
          const next = selection.quantity + delta;
          if (next <= 0) return [];
          if (option && next > option.maxQuantity) return [selection];
          return [{ ...selection, quantity: next }];
        }),
      );
    },
    [selectedItem],
  );

  const canAddSelectedItem = useMemo(
    () =>
      selectedItem
        ? canAddItemConfiguration(
            selectedItem,
            selectedVariantId,
            selectedOptions,
          )
        : false,
    [selectedItem, selectedVariantId, selectedOptions],
  );

  const addSelectedItem = useCallback(() => {
    if (!selectedItem || !canAddSelectedItem) return;
    const newLine: CartLine = {
      item: selectedItem,
      quantity: 1,
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      selectedOptions: normalizeSelectedOptions(selectedOptions),
      fulfillmentType:
        sessionMode === "TAKEAWAY" ? "TAKEAWAY" : selectedFulfillmentType,
    };
    const key = getCartLineKey(newLine);
    setCart((current) => {
      const index = current.findIndex((line) => getCartLineKey(line) === key);
      if (index === -1) return [...current, newLine];
      return current.map((line, indexToUpdate) =>
        indexToUpdate === index
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
    });
    closeItem();
  }, [
    canAddSelectedItem,
    closeItem,
    selectedFulfillmentType,
    selectedItem,
    selectedOptions,
    selectedVariantId,
    sessionMode,
    setCart,
  ]);

  const openCombo = useCallback(
    (combo: CustomerCombo) => {
      setSelectedCombo(combo);
      setComboSelections(
        combo.slots.map((slot) => ({
          slotId: slot.id,
          optionIds:
            slot.minSelections === 1 &&
            slot.maxSelections === 1 &&
            slot.options.length === 1
              ? [slot.options[0]!.id]
              : [],
        })),
      );
      clearError();
    },
    [clearError],
  );

  const closeCombo = useCallback(() => {
    setSelectedCombo(null);
    setComboSelections([]);
  }, []);

  const toggleComboOption = useCallback(
    (slotId: string, optionId: string) => {
      if (!selectedCombo) return;
      const slot = selectedCombo.slots.find((value) => value.id === slotId);
      if (!slot) return;
      setComboSelections((current) =>
        current.map((selection) => {
          if (selection.slotId !== slotId) return selection;
          const selected = selection.optionIds.includes(optionId);
          if (selected) {
            return {
              ...selection,
              optionIds: selection.optionIds.filter((id) => id !== optionId),
            };
          }
          if (slot.maxSelections === 1) {
            return { ...selection, optionIds: [optionId] };
          }
          if (selection.optionIds.length >= slot.maxSelections)
            return selection;
          return {
            ...selection,
            optionIds: [...selection.optionIds, optionId],
          };
        }),
      );
    },
    [selectedCombo],
  );

  const addSelectedCombo = useCallback(() => {
    if (!selectedCombo) return;
    const valid = selectedCombo.slots.every((slot) => {
      const count =
        comboSelections.find((value) => value.slotId === slot.id)?.optionIds
          .length ?? 0;
      return count >= slot.minSelections && count <= slot.maxSelections;
    });
    if (!valid) return;
    const newLine: ComboCartLine = {
      combo: selectedCombo,
      quantity: 1,
      selections: comboSelections,
    };
    const key = comboLineKey(newLine);
    setComboCart((current) => {
      const index = current.findIndex((line) => comboLineKey(line) === key);
      if (index === -1) return [...current, newLine];
      return current.map((line, indexToUpdate) =>
        indexToUpdate === index
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
    });
    closeCombo();
  }, [closeCombo, comboSelections, selectedCombo]);

  const changeComboQuantity = useCallback((index: number, delta: number) => {
    setComboCart((current) =>
      current.flatMap((line, currentIndex) =>
        currentIndex !== index
          ? [line]
          : line.quantity + delta > 0
            ? [{ ...line, quantity: line.quantity + delta }]
            : [],
      ),
    );
  }, []);

  const changeQuantity = useCallback(
    (index: number, delta: number) => {
      setCart((current) =>
        current.flatMap((line, currentIndex) =>
          currentIndex !== index
            ? [line]
            : line.quantity + delta > 0
              ? [{ ...line, quantity: line.quantity + delta }]
              : [],
        ),
      );
    },
    [setCart],
  );

  const changeFulfillment = useCallback(
    (index: number, value: FulfillmentType) => {
      setCart((current) =>
        current.map((line, currentIndex) =>
          currentIndex === index ? { ...line, fulfillmentType: value } : line,
        ),
      );
    },
    [setCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setComboCart([]);
  }, [setCart]);

  return {
    comboCart,
    selectedCombo,
    comboSelections,
    selectedItem,
    selectedVariantId,
    selectedOptions,
    selectedFulfillmentType,
    menuById,
    summary,
    setSelectedVariantId,
    setSelectedFulfillmentType,
    openItem,
    closeItem,
    toggleOption,
    changeOptionQuantity,
    addSelectedItem,
    openCombo,
    closeCombo,
    toggleComboOption,
    addSelectedCombo,
    changeComboQuantity,
    changeQuantity,
    changeFulfillment,
    clearCart,
  };
};
