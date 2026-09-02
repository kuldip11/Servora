import type { WaiterMenuCategory } from "@/features/menu/api/menu";
import { FOOD_TYPE_FILTERS } from "@/features/menu/constants";

interface Props {
  foodTypeFilter: "ALL" | "VEG" | "NON_VEG" | "EGG";
  onFoodTypeChange: (value: "ALL" | "VEG" | "NON_VEG" | "EGG") => void;
  categories: WaiterMenuCategory[] | undefined;
  activeCategory: string | null;
  onCategoryChange: (id: string) => void;
  menuSearch: string;
}

export const CategoryTabs = ({
  foodTypeFilter,
  onFoodTypeChange,
  categories,
  activeCategory,
  onCategoryChange,
  menuSearch,
}: Props) => {
  return (
    <>
      {!menuSearch && (
        <div className="scrollbar-hidden flex gap-[7px] overflow-x-auto px-4 pb-3">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-[13px] text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "border-primary bg-primary-surface text-primary"
                  : "border-border bg-surface text-text-secondary"
              }`}
            >
              {cat.name}
            </button>
          ))}
          {FOOD_TYPE_FILTERS.filter((filter) => filter.value !== "ALL").map(
            (filter) => (
              <button
                key={filter.value}
                onClick={() =>
                  onFoodTypeChange(
                    foodTypeFilter === filter.value ? "ALL" : filter.value,
                  )
                }
                className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-[13px] text-xs font-medium transition-colors ${
                  foodTypeFilter === filter.value
                    ? "border-primary bg-primary-surface text-primary"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                {filter.label}
              </button>
            ),
          )}
        </div>
      )}
    </>
  );
};
