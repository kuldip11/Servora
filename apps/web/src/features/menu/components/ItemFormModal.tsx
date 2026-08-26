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
import { menuItemFormSchema, type MenuItemFormValues } from "@pos/validation";

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
    const payload = {
      categoryId,
      name: values.name.trim(),
      ...(values.description && { description: values.description.trim() }),
      basePrice: Number(values.basePrice),
      taxRate: values.taxRate ? Number(values.taxRate) : 0,
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

        <div className="grid grid-cols-2 gap-3">
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
        </div>

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
            form.enableRecipeDeduction && <RecipeBuilder itemId={item!.id} />
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
