import {
  CheckSquare,
  Square,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Flame,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Grid,
  IconButton,
  Spinner,
  SearchInput,
  SelectMenu,
  FilterBar,
  Modal,
  Input,
} from "@pos/ui";
import { formatCurrency } from "@/shared/utils";
import { FoodTypeDot } from "@/features/menu/components/FoodTypeDot";
import { StatusBadge } from "@/features/menu/components/StatusBadge";
import { MENU_ITEM_STATUS_OPTIONS } from "@/features/menu/constants";
import { PublishBadge } from "@/features/menu/components/PublishBadge";
import { BulkActionsToolbar } from "@/features/menu/components/BulkActionsToolbar";
import type {
  MenuItem,
  FoodType,
  MenuItemStatus,
  MenuCategory,
  MenuTag,
} from "@pos/types";
import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

const CATEGORY_BATCH_SIZE = 18;

const InfiniteSentinel = ({ onVisible }: { onVisible: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisible();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onVisible]);
  return <div ref={ref} aria-hidden="true" className="h-px" />;
};
const FOOD_TYPE_FILTERS: { value: FoodType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "VEG", label: "Veg" },
  { value: "NON_VEG", label: "Non-Veg" },
  { value: "EGG", label: "Egg" },
];
const STATUS_FILTERS: { value: MenuItemStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  ...MENU_ITEM_STATUS_OPTIONS,
];
export interface MenuItemsContentProps {
  itemSearch: string;
  setItemSearch: (v: string) => void;
  selectMode: boolean;
  selectedIds: string[];
  categories?: MenuCategory[];
  tags?: MenuTag[];
  isLoading: boolean;
  foodTypeFilter: FoodType | "ALL";
  statusFilter: MenuItemStatus | "ALL";
  publishFilter: "ALL" | "PUBLISHED" | "DRAFT";
  setFoodTypeFilter: (v: FoodType | "ALL") => void;
  setStatusFilter: (v: MenuItemStatus | "ALL") => void;
  setPublishFilter: (v: "ALL" | "PUBLISHED" | "DRAFT") => void;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  setItemForm: (
    v: { categoryId: string; item: MenuItem | null } | null,
  ) => void;
  toggleAvailMutation: {
    mutate: (v: { id: string; isAvailable: boolean; reason?: string }) => void;
  };
  deleteItemMutation: { mutate: (id: string) => void };
  duplicateItemMutation: {
    mutate: (
      id: string,
      opts?: { onSuccess?: (item: MenuItem) => void },
    ) => void;
  };
  publishMutation: { mutate: (v: { id: string; publish: boolean }) => void };
}
export const MenuItemsContent = ({
  itemSearch,
  setItemSearch,
  selectMode,
  selectedIds,
  categories,
  tags,
  isLoading,
  foodTypeFilter,
  statusFilter,
  publishFilter,
  setFoodTypeFilter,
  setStatusFilter,
  setPublishFilter,
  setSelectedIds,
  setItemForm,
  toggleAvailMutation,
  deleteItemMutation,
  duplicateItemMutation,
  publishMutation,
}: MenuItemsContentProps) => {
  const [manualOverrideItem, setManualOverrideItem] = useState<MenuItem | null>(
    null,
  );
  const [manualOverrideReason, setManualOverrideReason] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );

  const matchesFilters = useCallback(
    (item: MenuItem) =>
      (!itemSearch.trim() ||
        item.name.toLowerCase().includes(itemSearch.trim().toLowerCase())) &&
      (foodTypeFilter === "ALL" || item.foodType === foodTypeFilter) &&
      (statusFilter === "ALL" || item.status === statusFilter) &&
      (publishFilter === "ALL" ||
        (publishFilter === "PUBLISHED" ? item.isPublished : !item.isPublished)),
    [foodTypeFilter, itemSearch, publishFilter, statusFilter],
  );

  useEffect(() => {
    const first = categories?.[0]?.id;
    if (!first) return;
    setExpandedCategories((current) =>
      current.size ? current : new Set([first]),
    );
  }, [categories]);

  useEffect(() => {
    setVisibleCounts({});
  }, [foodTypeFilter, itemSearch, publishFilter, statusFilter]);

  const priceDisplay = (item: MenuItem) => {
    if (!item.variants?.length) return formatCurrency(Number(item.basePrice));
    const prices = item.variants.map((v) => Number(v.price));
    const min = Math.min(...prices),
      max = Math.max(...prices);
    return min === max
      ? formatCurrency(min)
      : `${formatCurrency(min)} – ${formatCurrency(max)}`;
  };
  const hasActiveFilters =
    itemSearch !== "" ||
    foodTypeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    publishFilter !== "ALL";
  const clearFilters = () => {
    setItemSearch("");
    setFoodTypeFilter("ALL");
    setStatusFilter("ALL");
    setPublishFilter("ALL");
  };
  const expandAll = () =>
    setExpandedCategories(new Set((categories ?? []).map((item) => item.id)));
  const collapseAll = () => setExpandedCategories(new Set());
  return (
    <div className="space-y-4">
      {selectMode && selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedIds={selectedIds}
          categories={categories ?? []}
          tags={tags ?? []}
          onClear={() => setSelectedIds([])}
        />
      )}

      <FilterBar onClearAll={hasActiveFilters ? clearFilters : undefined}>
        <SearchInput
          aria-label="Search menu items"
          placeholder="Search items..."
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          onClear={() => setItemSearch("")}
          className="w-full sm:w-64"
        />
        <SelectMenu
          aria-label="Food type"
          options={FOOD_TYPE_FILTERS.map((f) => ({
            value: f.value,
            label: f.label,
          }))}
          value={foodTypeFilter}
          onChange={(value) => setFoodTypeFilter(value as FoodType | "ALL")}
          className="w-36"
        />
        <SelectMenu
          aria-label="Status"
          options={STATUS_FILTERS.map((f) => ({
            value: f.value,
            label: f.label,
          }))}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as MenuItemStatus | "ALL")}
          className="w-40"
        />
        <SelectMenu
          aria-label="Publication"
          options={[
            { value: "ALL", label: "All publication" },
            { value: "PUBLISHED", label: "Published" },
            { value: "DRAFT", label: "Drafts" },
          ]}
          value={publishFilter}
          onChange={(value) =>
            setPublishFilter(value as "ALL" | "PUBLISHED" | "DRAFT")
          }
          className="w-40"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={
            expandedCategories.size === (categories?.length ?? 0)
              ? collapseAll
              : expandAll
          }
        >
          {expandedCategories.size === (categories?.length ?? 0)
            ? "Collapse all"
            : "Expand all"}
        </Button>
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      ) : !categories?.length ? (
        <EmptyState
          icon={({ className }) => <span className={className}>🍽️</span>}
          title="No menu categories"
          description="Create a category first, then add items to it."
        />
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const matchingItems = (cat.menuItems ?? []).filter(matchesFilters);
            if (hasActiveFilters && matchingItems.length === 0) return null;
            const isExpanded =
              hasActiveFilters || expandedCategories.has(cat.id);
            const visibleCount = visibleCounts[cat.id] ?? CATEGORY_BATCH_SIZE;
            const visibleItems = matchingItems.slice(0, visibleCount);
            const activeCount = (cat.menuItems ?? []).filter(
              (item) => item.status === "ACTIVE",
            ).length;
            const draftCount = (cat.menuItems ?? []).filter(
              (item) => !item.isPublished,
            );
            return (
              <Card key={cat.id} padding="none" className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`menu-category-${cat.id}`}
                    onClick={() =>
                      setExpandedCategories((current) => {
                        const next = new Set(current);
                        if (next.has(cat.id)) next.delete(cat.id);
                        else next.add(cat.id);
                        return next;
                      })
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-text-primary">
                        {cat.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        {(cat.menuItems?.length ?? 0).toLocaleString()} items ·{" "}
                        {activeCount} active
                        {draftCount.length
                          ? ` · ${draftCount.length} drafts`
                          : ""}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setItemForm({ categoryId: cat.id, item: null })
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    id={`menu-category-${cat.id}`}
                    className="border-t border-border px-4 py-4"
                  >
                    {!visibleItems.length ? (
                      <p className="text-sm text-text-disabled text-center py-4">
                        {cat.menuItems?.length
                          ? "No items match this filter"
                          : "No items in this category"}
                      </p>
                    ) : (
                      <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap="sm">
                        {visibleItems.map((item: MenuItem) => {
                          const isSelected = selectedIds.includes(item.id);
                          const activateCard = () =>
                            selectMode
                              ? setSelectedIds((prev) =>
                                  isSelected
                                    ? prev.filter((x) => x !== item.id)
                                    : [...prev, item.id],
                                )
                              : setItemForm({ categoryId: cat.id, item });
                          return (
                            <div
                              key={item.id}

                              role="button"
                              tabIndex={0}
                              aria-pressed={selectMode ? isSelected : undefined}
                              aria-label={
                                selectMode
                                  ? `${item.name}${isSelected ? ", selected" : ""}`
                                  : `Edit ${item.name}`
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  activateCard();
                                }
                              }}
                              className={`border rounded-lg p-3 transition-all cursor-pointer relative ${
                                isSelected
                                  ? "border-primary bg-primary-surface ring-1 ring-primary"
                                  : item.status === "ACTIVE"
                                    ? "border-border bg-surface hover:border-primary/40"
                                    : "border-border bg-surface-secondary opacity-70"
                              } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                              onClick={activateCard}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  {selectMode &&
                                    (isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-text-disabled shrink-0" />
                                    ))}
                                  <FoodTypeDot type={item.foodType} size="sm" />
                                  <p className="text-sm font-semibold text-text-primary">
                                    {item.name}
                                  </p>
                                  {item.spiceLevel &&
                                    item.spiceLevel !== "NONE" && (
                                      <Flame className="w-3 h-3 text-orange-500" />
                                    )}
                                </div>
                                {!selectMode && (
                                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                                  <div
                                    className="flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <IconButton
                                      size="sm"
                                      aria-label={
                                        item.isPublished
                                          ? "Unpublish (move to draft)"
                                          : "Publish (make live)"
                                      }
                                      onClick={() =>
                                        publishMutation.mutate({
                                          id: item.id,
                                          publish: !item.isPublished,
                                        })
                                      }
                                      icon={() =>
                                        item.isPublished ? (
                                          <EyeOff className="w-4 h-4 text-text-disabled" />
                                        ) : (
                                          <Eye className="w-4 h-4 text-warning" />
                                        )
                                      }
                                    />
                                    <IconButton
                                      size="sm"
                                      aria-label={
                                        item.manualOverrideStatus
                                          ? "Clear manual availability override"
                                          : "Manually mark out of stock"
                                      }
                                      onClick={() => {
                                        if (item.manualOverrideStatus) {
                                          toggleAvailMutation.mutate({
                                            id: item.id,
                                            isAvailable: true,
                                          });
                                          return;
                                        }
                                        setManualOverrideReason("");
                                        setManualOverrideItem(item);
                                      }}
                                      icon={() =>
                                        item.manualOverrideStatus ? (
                                          <ToggleLeft className="w-5 h-5 text-danger" />
                                        ) : (
                                          <ToggleRight className="w-5 h-5 text-success" />
                                        )
                                      }
                                    />
                                    <IconButton
                                      size="sm"
                                      aria-label="Duplicate item"
                                      icon={Copy}
                                      onClick={() =>
                                        duplicateItemMutation.mutate(item.id, {
                                          onSuccess: (newItem) =>
                                            setItemForm({
                                              categoryId: newItem.categoryId,
                                              item: newItem,
                                            }),
                                        })
                                      }
                                    />
                                    <IconButton
                                      size="sm"
                                      aria-label="Delete item"
                                      icon={Trash2}
                                      onClick={() =>
                                        deleteItemMutation.mutate(item.id)
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="mb-2">
                                <PublishBadge isPublished={item.isPublished} />
                                <StatusBadge status={item.status} />
                                {item.manualOverrideStatus && (
                                  <span className="ml-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                                    Manual override
                                  </span>
                                )}
                                {(item.manualOverrideReason ??
                                  item.availabilityReason) && (
                                  <span className="ml-1.5 text-[11px] text-text-disabled">
                                    {item.manualOverrideReason ??
                                      item.availabilityReason}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {(item.tagLinks?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.tagLinks!.map((l) => (
                                    <span
                                      key={l.tagId}
                                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                                      style={{
                                        backgroundColor:
                                          l.tag.color ?? "#8b5cf6",
                                      }}
                                    >
                                      {l.tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-primary">
                                  {priceDisplay(item)}
                                </span>
                                <span className="text-xs text-text-disabled">
                                  Tax: {item.taxRate}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </Grid>
                    )}
                    {visibleItems.length < matchingItems.length && (
                      <>
                        <InfiniteSentinel
                          onVisible={() =>
                            setVisibleCounts((current) => ({
                              ...current,
                              [cat.id]:
                                (current[cat.id] ?? CATEGORY_BATCH_SIZE) +
                                CATEGORY_BATCH_SIZE,
                            }))
                          }
                        />
                        <p className="pt-3 text-center text-xs text-text-disabled">
                          Showing {visibleItems.length} of{" "}
                          {matchingItems.length} items · scroll for more
                        </p>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {manualOverrideItem && (
        <Modal
          open
          onClose={() => setManualOverrideItem(null)}
          title={`Manually 86 ${manualOverrideItem.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              This manual override stays in effect even if inventory or a
              schedule would otherwise make the item available.
            </p>
            <Input
              aria-label="Manual override reason"
              value={manualOverrideReason}
              onChange={(event) => setManualOverrideReason(event.target.value)}
              placeholder="Reason (required)"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setManualOverrideItem(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={!manualOverrideReason.trim()}
                onClick={() => {
                  toggleAvailMutation.mutate({
                    id: manualOverrideItem.id,
                    isAvailable: false,
                    reason: manualOverrideReason.trim(),
                  });
                  setManualOverrideItem(null);
                }}
              >
                Mark out of stock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
