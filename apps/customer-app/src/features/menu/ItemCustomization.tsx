import { memo } from "react";
import { Plus, Minus } from "lucide-react";
import { Badge, BottomSheet, Button, IconButton } from "@pos/ui";
import type { CustomerMenuItem } from "../../api";
import type { SelectedOption } from "../cart/pricing";
import { validateItemConfiguration } from "../cart/configuration";

import { formatMoney } from "../../shared/utils/money";

type Props = {
  item: CustomerMenuItem;
  selectedOptions: SelectedOption[];
  variantId?: string;
  onVariantChange: (variantId: string | undefined) => void;
  onToggle: (optionId: string, groupId: string) => void;
  onOptionQuantity: (optionId: string, delta: number) => void;
  onClose: () => void;
  onAdd: () => void;
  fulfillmentType: "DINE_IN" | "TAKEAWAY";
  onFulfillmentTypeChange: (value: "DINE_IN" | "TAKEAWAY") => void;
  allowMixedFulfillment: boolean;
};

export const ItemCustomization = memo(function ItemCustomization({
  item,
  selectedOptions,
  variantId,
  onVariantChange,
  onToggle,
  onOptionQuantity,
  onClose,
  onAdd,
  fulfillmentType,
  onFulfillmentTypeChange,
  allowMixedFulfillment,
}: Props) {
  const validationError = validateItemConfiguration(
    item,
    variantId,
    selectedOptions,
  );
  const valid = validationError === null;

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={item.name}
      description="Customize this menu item before adding it to your order."
      footer={
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={!valid}
          onClick={onAdd}
        >
          Add to order <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-6">
        {item.imageUrl || item.images[0]?.url ? (
          <img
            src={item.imageUrl ?? item.images[0]?.url}
            alt={item.name}
            className="h-48 w-full rounded-lg object-cover sm:h-52"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {item.name}
              </h2>
              {item.description && (
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {item.description}
                </p>
              )}
            </div>
            <span className="font-semibold text-text-primary">
              {formatMoney(Number(item.basePrice))}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant={
                item.foodType === "VEG"
                  ? "success"
                  : item.foodType === "EGG"
                    ? "warning"
                    : "danger"
              }
            >
              {item.foodType === "VEG"
                ? "Vegetarian"
                : item.foodType === "EGG"
                  ? "Contains egg"
                  : "Non-vegetarian"}
            </Badge>
            {item.spiceLevel && item.spiceLevel !== "NONE" && (
              <Badge>{item.spiceLevel.toLowerCase()} spice</Badge>
            )}
          </div>
        </div>

        {item.variants.length > 0 && (
          <fieldset>
            <legend className="mb-3 font-semibold text-text-primary">
              Choose a size
            </legend>
            <div className="space-y-2">
              {item.variants.map((variant) => (
                <label
                  key={variant.id}
                  className={`flex min-h-12 cursor-pointer items-center justify-between rounded-lg border p-3 ${variantId === variant.id ? "border-primary bg-primary-surface" : "border-border"}`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`variant-${item.id}`}
                      checked={variantId === variant.id}
                      onChange={() => onVariantChange(variant.id)}
                    />
                    <span className="font-medium text-text-primary">
                      {variant.name}
                    </span>
                  </span>
                  <span className="text-sm text-text-secondary">
                    {formatMoney(Number(variant.price))}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {item.modifierGroupLinks.map(({ group }) => (
          <fieldset key={group.id}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <legend className="font-semibold text-text-primary">
                {group.name}
              </legend>
              <span className="text-xs text-text-secondary">
                {group.minSelections > 0
                  ? `Choose ${group.minSelections}${group.maxSelections ? `–${group.maxSelections}` : "+"}`
                  : "Optional"}
              </span>
            </div>
            <div className="space-y-2">
              {group.options
                .filter((option) => option.isAvailable)
                .map((option) => {
                  const selected = selectedOptions.find(
                    (selection) => selection.optionId === option.id,
                  );
                  const multiple = group.selectionType === "MULTIPLE";
                  const canIncrease =
                    multiple &&
                    selected != null &&
                    selected.quantity < option.maxQuantity;
                  return (
                    <div
                      key={option.id}
                      className={`flex min-h-12 items-center justify-between rounded-lg border p-3 ${selected ? "border-primary bg-primary-surface" : "border-border"}`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onToggle(option.id, group.id)}
                      >
                        <span className="block font-medium text-text-primary">
                          {option.name}
                        </span>
                        <span className="text-sm text-text-secondary">
                          +{formatMoney(Number(option.additionalPrice))}
                        </span>
                      </button>
                      {multiple && selected ? (
                        <div className="ml-3 flex items-center gap-2">
                          <IconButton
                            aria-label={`Decrease ${option.name}`}
                            icon={Minus}
                            size="sm"
                            onClick={() => onOptionQuantity(option.id, -1)}
                          />
                          <span className="w-5 text-center text-sm font-semibold">
                            {selected.quantity}
                          </span>
                          <IconButton
                            aria-label={`Increase ${option.name}`}
                            icon={Plus}
                            size="sm"
                            disabled={!canIncrease}
                            onClick={() => onOptionQuantity(option.id, 1)}
                          />
                        </div>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="ml-3 h-5 w-5 rounded-full border border-border"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </fieldset>
        ))}

        {allowMixedFulfillment ? (
          <fieldset>
            <legend className="mb-3 font-semibold text-text-primary">
              Fulfilment
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-lg border p-3 text-left ${fulfillmentType === "DINE_IN" ? "border-primary bg-primary-surface" : "border-border"}`}
                onClick={() => onFulfillmentTypeChange("DINE_IN")}
              >
                <span className="block font-medium text-text-primary">
                  Eat here
                </span>
                <span className="text-xs text-text-secondary">
                  Serve at the table
                </span>
              </button>
              <button
                type="button"
                className={`rounded-lg border p-3 text-left ${fulfillmentType === "TAKEAWAY" ? "border-primary bg-primary-surface" : "border-border"}`}
                onClick={() => onFulfillmentTypeChange("TAKEAWAY")}
              >
                <span className="block font-medium text-text-primary">
                  Takeaway
                </span>
                <span className="text-xs text-text-secondary">
                  Pack for takeaway
                </span>
              </button>
            </div>
          </fieldset>
        ) : null}
        {validationError && (
          <p role="alert" className="text-sm text-danger">
            {validationError}
          </p>
        )}
      </div>
    </BottomSheet>
  );
});
