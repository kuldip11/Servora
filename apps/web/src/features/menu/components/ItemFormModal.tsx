import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Input, Select } from "@pos/ui";
import { ItemMediaVariantsSection } from "./forms/ItemMediaVariantsSection";
import { ItemAssociationsSection } from "./forms/ItemAssociationsSection";
import { FoodTypeDot } from "./FoodTypeDot";
import { STATUS_OPTIONS } from "./StatusBadge";
import { RecipeBuilder } from "./RecipeBuilder";
import { ScheduleManager } from "./ScheduleManager";
import { BranchOverridesPanel } from "./BranchOverridesPanel";
import { ChannelOverridesPanel } from "./ChannelOverridesPanel";
import { PriceRulesPanel } from "./PriceRulesPanel";
import { VariantAvailabilityPanel } from "./VariantAvailabilityPanel";
import { VariantModifierPricingPanel } from "./VariantModifierPricingPanel";
import { MenuMembershipsEditor } from "./forms/MenuMembershipsEditor";
import { StationRoutingEditor } from "./forms/StationRoutingEditor";
import { useMenuCategories } from "../hooks/useMenuCategories";
import { useModifierGroups } from "../hooks/useModifierGroups";
import { useMenuTags } from "../hooks/useMenuTags";
import { useMenuAllergens } from "../hooks/useMenuAllergens";
import { useSaveMenuItem } from "../hooks/useSaveMenuItem";
import type {
  MenuItem,
  FoodType,
  SpiceLevel,
  MenuItemStatus,
} from "@pos/types";
import { advancedMenuItemPricingSchema, menuItemFormSchema, type MenuItemFormValues } from "@pos/validation";

interface Props {
  categoryId: string;
  item: MenuItem | null; // null = creating a new item
  onClose: () => void;
}

const FOOD_TYPE_OPTIONS: { value: FoodType; label: string }[] = [
  { value: "VEG", label: "Veg" },
  { value: "NON_VEG", label: "Non-Veg" },
  { value: "EGG", label: "Egg" },
];

const SPICE_OPTIONS: { value: SpiceLevel | ""; label: string }[] = [
  { value: "", label: "Not applicable" },
  { value: "NONE", label: "Not spicy" },
  { value: "MILD", label: "Mild" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HOT", label: "Hot" },
];

export function ItemFormModal({ categoryId, item, onClose }: Props) {
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      basePrice: item ? String(item.basePrice) : "",
      taxRate: item ? String(item.taxRate) : "0",
      foodType: (item?.foodType ?? "VEG") as FoodType,
      spiceLevel: (item?.spiceLevel ?? "") as SpiceLevel | "",
      sku: item?.sku ?? "",
      prepTimeMinutes:
        item?.prepTimeMinutes != null ? String(item.prepTimeMinutes) : "",
      hsnCode: item?.hsnCode ?? "",
      status: (item?.status ?? "ACTIVE") as MenuItemStatus,
      availabilityReason: item?.availabilityReason ?? "",
      enableRecipeDeduction: item?.enableRecipeDeduction ?? true,
      variants:
        item?.variants.map((v) => ({ name: v.name, price: String(v.price) })) ??
        [],
      imageUrls: item?.images?.map((i) => i.url) ?? [],
      modifierGroupIds:
        item?.modifierGroupLinks?.map((l) => l.modifierGroupId) ?? [],
      tagIds: item?.tagLinks?.map((l) => l.tagId) ?? [],
      allergenIds: item?.allergenLinks?.map((l) => l.allergenId) ?? [],
    },
  });
  const form = watch();
  const [variants, setVariants] = useState(
    item?.variants.map((v) => ({ name: v.name, price: String(v.price) })) ?? [],
  );
  const [imageUrls, setImageUrls] = useState(
    item?.images?.map((i) => i.url) ?? [],
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [displayMode, setDisplayMode] = useState<"STANDARD" | "GUIDED_BUILDER">(item?.displayMode ?? "STANDARD");
  const [taxMode, setTaxMode] = useState<"" | "INCLUSIVE" | "EXCLUSIVE">(item?.taxMode ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(item?.effectiveFrom ? new Date(item.effectiveFrom).toISOString().slice(0, 16) : "");
  const [pricingMode, setPricingMode] = useState<"FIXED" | "WEIGHT_BASED" | "OPEN">(item?.pricingMode ?? "FIXED");
  const [weightUnit, setWeightUnit] = useState<"G" | "KG" | "LB" | "OZ">(item?.weightUnit ?? "KG");
  const [openPriceMin, setOpenPriceMin] = useState(item?.openPriceMin != null ? String(item.openPriceMin) : "");
  const [openPriceMax, setOpenPriceMax] = useState(item?.openPriceMax != null ? String(item.openPriceMax) : "");
  const [supportsZones, setSupportsZones] = useState(item?.supportsZones ?? false);
  const [zonePricingRule, setZonePricingRule] = useState<"AVERAGE" | "HIGHER" | "SUM_HALF">(item?.zonePricingRule ?? "HIGHER");
  const [trackByCount, setTrackByCount] = useState(item?.manualStockCount != null);
  const [manualStockCount, setManualStockCount] = useState(item?.manualStockCount != null ? String(item.manualStockCount) : "");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    item?.modifierGroupLinks?.map((l) => l.modifierGroupId) ?? [],
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    item?.tagLinks?.map((l) => l.tagId) ?? [],
  );
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>(
    item?.allergenLinks?.map((l) => l.allergenId) ?? [],
  );

  const { data: allGroups } = useModifierGroups();
  const { data: allTags } = useMenuTags();
  const { data: allAllergens } = useMenuAllergens();
  const { data: allCategories } = useMenuCategories();

  const saveMutation = useSaveMenuItem();

  function handleSave(values: MenuItemFormValues) {
    const parsed = menuItemFormSchema.safeParse({
      ...values,
      variants,
      imageUrls,
      modifierGroupIds: selectedGroupIds,
      tagIds: selectedTagIds,
      allergenIds: selectedAllergenIds,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as
          | "variants"
          | "imageUrls"
          | "modifierGroupIds"
          | "tagIds"
          | "allergenIds";
        if (field) setError(field, { message: issue.message });
      }
      return;
    }
    const advancedPricing = advancedMenuItemPricingSchema.safeParse({
      pricingMode,
      weightUnit: pricingMode === "WEIGHT_BASED" ? weightUnit : null,
      openPriceMin: pricingMode === "OPEN" && openPriceMin !== "" ? Number(openPriceMin) : null,
      openPriceMax: pricingMode === "OPEN" && openPriceMax !== "" ? Number(openPriceMax) : null,
      supportsZones,
      zonePricingRule,
      manualStockCount: trackByCount && manualStockCount !== "" ? Number(manualStockCount) : null,
    });
    if (!advancedPricing.success) {
      const message = advancedPricing.error.issues[0]?.message ?? "Invalid advanced pricing configuration";
      setError("basePrice", { message });
      return;
    }
    const payload = {
      categoryId,
      name: values.name.trim(),
      ...(values.description && { description: values.description.trim() }),
      basePrice: Number(values.basePrice),
      pricingMode,
      ...(pricingMode === "WEIGHT_BASED"
        ? { weightUnit }
        : isEdit
          ? { weightUnit: null }
          : {}),
      ...(pricingMode === "OPEN" && openPriceMin !== ""
        ? { openPriceMin: Number(openPriceMin) }
        : isEdit
          ? { openPriceMin: null }
          : {}),
      ...(pricingMode === "OPEN" && openPriceMax !== ""
        ? { openPriceMax: Number(openPriceMax) }
        : isEdit
          ? { openPriceMax: null }
          : {}),
      supportsZones,
      zonePricingRule,
      ...(trackByCount && manualStockCount !== ""
        ? { manualStockCount: Number(manualStockCount) }
        : isEdit
          ? { manualStockCount: null }
          : {}),
      taxRate: values.taxRate ? Number(values.taxRate) : 0,
      taxMode: taxMode || null,
      foodType: values.foodType,
      ...(values.spiceLevel && { spiceLevel: values.spiceLevel }),
      ...(values.sku && { sku: values.sku.trim() }),
      ...(values.prepTimeMinutes && {
        prepTimeMinutes: parseInt(values.prepTimeMinutes, 10),
      }),
      ...(values.hsnCode && { hsnCode: values.hsnCode.trim() }),
      status: values.status,
      availabilityReason: values.availabilityReason.trim() || null,
      enableRecipeDeduction: values.enableRecipeDeduction,
      displayMode,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => ({ name: v.name, price: parseFloat(v.price) || 0 })),
      modifierGroupIds: selectedGroupIds,
      tagIds: selectedTagIds,
      allergenIds: selectedAllergenIds,
      imageUrls,
    };
    saveMutation.mutate({ item, payload }, { onSuccess: onClose });
  }

  function toggle(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit Menu Item" : "Add Menu Item"}
      onClose={onClose}
      size="xl"
    >
      <form
        className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
        noValidate
        onSubmit={handleSubmit(handleSave)}
      >
        {item && (
          <MenuMembershipsEditor item={item} categories={allCategories ?? []} />
        )}
        {/* Basics */}
        <Input
          label="Item name"
          placeholder="Chicken Tikka"
          error={errors.name?.message}
          {...register("name")}
        />
        <div>
          <label
            htmlFor="item-description"
            className="text-sm font-medium text-text-primary"
          >
            Description
          </label>
          <textarea
            id="item-description"
            placeholder="Optional description"
            {...register("description")}
            aria-invalid={!!errors.description}
            rows={2}
            className="mt-1.5 w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="Base Price (₹)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            error={errors.basePrice?.message}
            {...register("basePrice")}
          />
          <Input
            label="Tax Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="0"
            error={errors.taxRate?.message}
            {...register("taxRate")}
          />
          <Select label="Tax mode" value={taxMode} onChange={(event) => setTaxMode(event.target.value as "" | "INCLUSIVE" | "EXCLUSIVE")} options={[{ value: "", label: "Inherit tenant default" }, { value: "EXCLUSIVE", label: "Tax exclusive" }, { value: "INCLUSIVE", label: "Tax included in price" }]} />
        </div>

        <section className="rounded-lg border border-border bg-surface-secondary/40 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Advanced restaurant pricing</h3>
            <p className="mt-0.5 text-xs text-text-secondary">Advanced pricing modes are opt-in. Existing items stay on fixed, whole-item pricing.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-text-primary">
              Pricing mode
              <select
                className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={pricingMode}
                onChange={(event) => setPricingMode(event.target.value as typeof pricingMode)}
              >
                <option value="FIXED">Fixed price</option>
                <option value="WEIGHT_BASED">Weight based</option>
                <option value="OPEN">Open / manual price</option>
              </select>
            </label>
            {pricingMode === "WEIGHT_BASED" && (
              <label className="text-sm font-medium text-text-primary">
                Rate unit
                <select
                  className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={weightUnit}
                  onChange={(event) => setWeightUnit(event.target.value as typeof weightUnit)}
                >
                  <option value="G">gram (g)</option><option value="KG">kilogram (kg)</option>
                  <option value="LB">pound (lb)</option><option value="OZ">ounce (oz)</option>
                </select>
              </label>
            )}
            {pricingMode === "OPEN" && (
              <>
                <Input label="Minimum manual price" type="number" min="0" step="0.01" value={openPriceMin} onChange={(event) => setOpenPriceMin(event.target.value)} />
                <Input label="Maximum manual price" type="number" min="0" step="0.01" value={openPriceMax} onChange={(event) => setOpenPriceMax(event.target.value)} />
              </>
            )}
          </div>
          {pricingMode === "OPEN" && openPriceMin !== "" && openPriceMax !== "" && Number(openPriceMin) > Number(openPriceMax) && (
            <p className="text-xs text-danger">Minimum manual price cannot exceed maximum.</p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <input type="checkbox" checked={supportsZones} onChange={(event) => setSupportsZones(event.target.checked)} />
              Supports split zones / half-and-half
            </label>
            {supportsZones && (
              <label className="text-sm font-medium text-text-primary">
                Zone pricing rule
                <select className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" value={zonePricingRule} onChange={(event) => setZonePricingRule(event.target.value as typeof zonePricingRule)}>
                  <option value="HIGHER">Charge higher-priced zone</option>
                  <option value="AVERAGE">Average zone modifier totals</option>
                  <option value="SUM_HALF">Sum half of each zone</option>
                </select>
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <input type="checkbox" checked={trackByCount} onChange={(event) => setTrackByCount(event.target.checked)} />
              Track finite stock by item count
            </label>
            {trackByCount && (
              <Input label="Current stock count" type="number" min="0" step="1" value={manualStockCount} onChange={(event) => setManualStockCount(event.target.value)} />
            )}
          </div>
        </section>

        {/* Food type + spice level */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span
              id="item-food-type-label"
              className="text-sm font-medium text-text-primary mb-1.5 block"
            >
              Food type
            </span>
            <div
              role="group"
              aria-labelledby="item-food-type-label"
              className="flex gap-2"
            >
              {FOOD_TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() =>
                    setValue("foodType", opt.value, { shouldValidate: true })
                  }
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border text-xs font-medium transition-colors ${
                    form.foodType === opt.value
                      ? "border-primary bg-primary-surface text-primary"
                      : "border-border text-text-secondary"
                  }`}
                >
                  <FoodTypeDot type={opt.value} size="sm" /> {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Select
            label="Spice level"
            error={errors.spiceLevel?.message}
            {...register("spiceLevel")}
            options={SPICE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="SKU (optional)"
            placeholder="ITM-042"
            error={errors.sku?.message}
            {...register("sku")}
          />
          <Input
            label="Prep time (min)"
            type="number"
            min="0"
            placeholder="15"
            error={errors.prepTimeMinutes?.message}
            {...register("prepTimeMinutes")}
          />
          <Input
            label="HSN code"
            placeholder="996331"
            error={errors.hsnCode?.message}
            {...register("hsnCode")}
          />
        </div>

        {/* Availability status */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            error={errors.status?.message}
            {...register("status")}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Reason (optional)"
            placeholder="e.g. Out of stock till Monday"
            error={errors.availabilityReason?.message}
            {...register("availabilityReason")}
          />
        </div>

        <ItemMediaVariantsSection
          imageUrls={imageUrls}
          newImageUrl={newImageUrl}
          variants={variants}
          onNewImageUrl={setNewImageUrl}
          onAddImage={() => {
            if (newImageUrl.trim()) {
              setImageUrls((p) => [...p, newImageUrl.trim()]);
              setNewImageUrl("");
            }
          }}
          onRemoveImage={(i) =>
            setImageUrls((p) => p.filter((_, idx) => idx !== i))
          }
          onVariantChange={(i, patch) =>
            setVariants((p) =>
              p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
            )
          }
          onRemoveVariant={(i) =>
            setVariants((p) => p.filter((_, idx) => idx !== i))
          }
          onAddVariant={() =>
            setVariants((p) => [...p, { name: "", price: "0" }])
          }
        />

        <div className="rounded border border-border p-3 space-y-2">
          <Select label="Ordering experience" value={displayMode} options={[{ value: "STANDARD", label: "Standard item" }, { value: "GUIDED_BUILDER", label: "Guided build-your-own" }]} onChange={(event) => setDisplayMode(event.target.value as "STANDARD" | "GUIDED_BUILDER")} />
          <Button type="button" size="sm" variant="secondary" onClick={() => { setDisplayMode("GUIDED_BUILDER"); setSelectedGroupIds((allGroups ?? []).filter((group) => group.minSelections > 0).map((group) => group.id)); }}>Apply Build-Your-Own preset</Button>
          <Input label="Effective from (optional)" type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
          {effectiveFrom && new Date(effectiveFrom) > new Date() && <p className="text-xs text-warning">Pending publish · live {new Date(effectiveFrom).toLocaleString()}</p>}
          <p className="text-xs text-text-secondary">The preset attaches required modifier groups and presents them as guided steps. Pricing and validation stay unchanged.</p>
        </div>
        <ItemAssociationsSection
          groups={allGroups ?? []}
          tags={allTags ?? []}
          allergens={allAllergens ?? []}
          selectedGroupIds={selectedGroupIds}
          selectedTagIds={selectedTagIds}
          selectedAllergenIds={selectedAllergenIds}
          toggle={(id, list) => {
            if (list === "groups")
              toggle(id, selectedGroupIds, setSelectedGroupIds);
            else if (list === "tags")
              toggle(id, selectedTagIds, setSelectedTagIds);
            else toggle(id, selectedAllergenIds, setSelectedAllergenIds);
          }}
        />

        {/* Recipe / inventory link */}
        <div>
          <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <input
              type="checkbox"
              checked={form.enableRecipeDeduction}
              onChange={(e) =>
                setValue("enableRecipeDeduction", e.target.checked, {
                  shouldValidate: true,
                })
              }
            />
            Auto-manage availability from inventory
          </label>
          {isEdit ? (
            form.enableRecipeDeduction && <RecipeBuilder item={item!} />
          ) : (
            <p className="text-xs text-text-disabled">
              Save the item first, then come back to link ingredients.
            </p>
          )}
        </div>

        {/* Scheduling */}
        {isEdit && (
          <div>
            <ScheduleManager itemId={item!.id} />
            <ChannelOverridesPanel itemId={item!.id} />
            <VariantAvailabilityPanel itemId={item!.id} variants={item!.variants ?? []} />
            <VariantModifierPricingPanel
              variants={item!.variants ?? []}
              groups={(allGroups ?? []).filter((group) => selectedGroupIds.includes(group.id))}
            />
            <PriceRulesPanel itemId={item!.id} branchId={item!.branchId} />
          </div>
        )}

        {/* Branch overrides — only meaningful for a tenant-wide item; a
            branch-exclusive item already belongs to exactly one branch. */}
        {isEdit && item!.branchId === null && (
          <div>
            <BranchOverridesPanel
              itemId={item!.id}
              basePrice={item!.basePrice}
              baseTaxRate={item!.taxRate}
              basePrepTimeMinutes={item!.prepTimeMinutes}
            />
          </div>
        )}

        {isEdit && (
          <StationRoutingEditor
            itemId={item!.id}
            groups={(allGroups ?? []).filter((group) => selectedGroupIds.includes(group.id))}
          />
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-divider">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isPending}>
            {isEdit ? "Save Changes" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
