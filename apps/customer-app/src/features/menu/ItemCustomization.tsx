import { memo, useState } from "react";
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
  onToggle: (optionId: string, groupId: string, zoneLabel?: "LEFT" | "RIGHT" | "WHOLE") => void;
  onOptionQuantity: (optionId: string, delta: number, zoneLabel?: "LEFT" | "RIGHT" | "WHOLE") => void;
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
  const [activeZone, setActiveZone] = useState<"LEFT" | "RIGHT" | "WHOLE">("LEFT");
  const validationError = validateItemConfiguration(
    item,
    variantId,
    selectedOptions,
  );
  const valid = validationError === null;
  const staffPriced = item.pricingMode === "WEIGHT_BASED" || item.pricingMode === "OPEN";

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
        {validationError && <p className="rounded-lg bg-surface-secondary p-3 text-sm text-text-secondary">{validationError}</p>}
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
              {item.pricingMode === "OPEN" ? "Staff priced" : item.pricingMode === "WEIGHT_BASED" ? `${formatMoney(Number(item.basePrice))}/${String(item.weightUnit ?? "unit").toLowerCase()}` : formatMoney(Number(item.basePrice))}
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
                  className={`flex min-h-12 items-center justify-between rounded-lg border p-3 ${(variant.manualOverrideStatus ?? variant.status ?? "ACTIVE") !== "ACTIVE" ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${variantId === variant.id ? "border-primary bg-primary-surface" : "border-border"}`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`variant-${item.id}`}
                      checked={variantId === variant.id}
                      disabled={(variant.manualOverrideStatus ?? variant.status ?? "ACTIVE") !== "ACTIVE"}
                      onChange={() => onVariantChange(variant.id)}
                    />
                    <span className="font-medium text-text-primary">
                      {variant.name}{(variant.manualOverrideStatus ?? variant.status ?? "ACTIVE") !== "ACTIVE" ? " — unavailable" : ""}
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

        {staffPriced && (
          <p className="rounded-lg border border-warning/20 bg-warning-surface p-3 text-sm text-warning">
            {item.pricingMode === "WEIGHT_BASED" ? `Sold by weight (${item.weightUnit ?? "configured unit"}).` : "Price is entered by staff for this item."} Please ask a staff member to add it to your order.
          </p>
        )}
        {item.supportsZones && (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-semibold text-text-primary">Choose toppings by zone</p>
            <div className="grid grid-cols-3 gap-2">
              {(["LEFT", "RIGHT", "WHOLE"] as const).map((zone) => (
                <button key={zone} type="button" onClick={() => setActiveZone(zone)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeZone === zone ? "bg-primary text-primary-foreground" : "bg-surface-secondary text-text-secondary"}`}>{zone === "WHOLE" ? "Whole" : zone === "LEFT" ? "Left half" : "Right half"}</button>
              ))}
            </div>
          </div>
        )}
        {item.displayMode === "GUIDED_BUILDER" && <p className="rounded-lg bg-primary-surface p-3 text-sm font-medium text-primary">Build your dish · complete each required step</p>}
        {item.modifierGroupLinks.filter(({ group }) => !group.dependsOnOptionId || selectedOptions.some((option) => option.optionId === group.dependsOnOptionId)).map(({ group }, groupIndex) => (
          <fieldset key={group.id}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <legend className="font-semibold text-text-primary">
              {item.displayMode === "GUIDED_BUILDER" ? `Step ${groupIndex + 1}: ` : ""}{group.name}
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
                    (selection) => selection.optionId === option.id && (!item.supportsZones || (selection.zoneLabel ?? "WHOLE") === activeZone),
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
                        onClick={() => onToggle(option.id, group.id, item.supportsZones ? activeZone : undefined)}
                      >
                        <span className="block font-medium text-text-primary">
                          {option.name}
                        </span>
                        <span className="text-sm text-text-secondary">
                          +{formatMoney(Number((variantId ? option.variantPrices?.find((price) => price.variantId === variantId)?.additionalPrice : undefined) ?? option.additionalPrice))}
                        </span>
                      </button>
                      {multiple && selected ? (
                        <div className="ml-3 flex items-center gap-2">
                          <IconButton
                            aria-label={`Decrease ${option.name}`}
                            icon={Minus}
                            size="sm"
                            onClick={() => onOptionQuantity(option.id, -1, item.supportsZones ? activeZone : undefined)}
                          />
                          <span className="w-5 text-center text-sm font-semibold">
                            {selected.quantity}
                          </span>
                          <IconButton
                            aria-label={`Increase ${option.name}`}
                            icon={Plus}
                            size="sm"
                            disabled={!canIncrease}
                            onClick={() => onOptionQuantity(option.id, 1, item.supportsZones ? activeZone : undefined)}
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
